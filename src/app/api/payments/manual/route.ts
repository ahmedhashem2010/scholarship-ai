export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { uploadReceipt, ensureUserRecord } from "@/lib/supabase/storage";
import { validatePackage } from "@/lib/pricing";

const ALLOWED_METHODS = ["vodafone_cash", "instapay", "bank_transfer"] as const;
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/**
 * Submits a manual payment for admin approval.
 *
 * This is the PRIMARY revenue path — Stripe is unavailable in several of the
 * markets we serve, and local wallets (Vodafone Cash, InstaPay) are how most
 * Egyptian students actually pay. Credits are NOT granted here; an admin
 * verifies the receipt first.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Please sign in first" }, { status: 401 });
    }

    const form = await request.formData();
    const packageId = form.get("packageId");
    const method = form.get("method");
    const reference = (form.get("reference") as string | null)?.trim() || null;
    const userNote = (form.get("userNote") as string | null)?.trim() || null;
    const receipt = form.get("receipt");

    const pkg = validatePackage(packageId, undefined);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Invalid package selected" }, { status: 400 });
    }

    if (typeof method !== "string" || !ALLOWED_METHODS.includes(method as typeof ALLOWED_METHODS[number])) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    // Require some evidence — either a receipt image or a transaction
    // reference. Without one, there's nothing for an admin to check against.
    const hasReceipt = receipt instanceof File && receipt.size > 0;
    if (!hasReceipt && !reference) {
      return NextResponse.json(
        { success: false, error: "Please upload a receipt screenshot or enter the transaction reference." },
        { status: 400 }
      );
    }

    // Block duplicate submissions — a student clicking twice shouldn't create
    // two pending records for the admin to reconcile.
    const existingPending = await prisma.payment.findFirst({
      where: { userId: user.id, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a payment awaiting confirmation. We'll email you as soon as it's approved.",
          pendingId: existingPending.id,
        },
        { status: 409 }
      );
    }

    let receiptPath: string | null = null;
    if (hasReceipt) {
      const file = receipt as File;
      if (file.size > MAX_RECEIPT_BYTES) {
        return NextResponse.json(
          { success: false, error: "Receipt must be under 5MB." },
          { status: 400 }
        );
      }
      if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Receipt must be a PNG, JPG, WEBP or PDF." },
          { status: 400 }
        );
      }
      try {
        receiptPath = await uploadReceipt(user.id, file);
      } catch (e) {
        console.error("[manual-payment] Receipt upload failed:", e);
        // Don't lose the payment over a storage hiccup — record it and let the
        // admin follow up. Losing a real payment is far worse than a missing image.
        receiptPath = null;
      }
    }

    // Auth and DB are separate Supabase projects, so the User row may not exist.
    await ensureUserRecord(user.id, user.email);

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: pkg.price,
        credits: pkg.credits,
        status: "pending",
        method,
        packageId: pkg.id,
        receiptUrl: receiptPath,
        reference,
        userNote,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        credits: pkg.credits,
        amount: pkg.price,
        receiptUploaded: Boolean(receiptPath),
      },
    });
  } catch (err) {
    console.error("[manual-payment] Error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't submit your payment. Please try again or message us on WhatsApp." },
      { status: 500 }
    );
  }
}

/** Lets a user see the status of their own payments. */
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        credits: true,
        status: true,
        method: true,
        createdAt: true,
        reviewedAt: true,
        rejectionReason: true,
      },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (err) {
    console.error("[manual-payment] GET error:", err);
    return NextResponse.json({ success: false, error: "Couldn't load payments" }, { status: 500 });
  }
}
