export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { sendEmail } from "@/lib/email";
import { creditsAddedHtml, paymentRejectedHtml } from "@/lib/email-templates";

async function requireAdmin(request: NextRequest) {
  const supabase = createApiClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "Unauthorized", status: 401 as const, user: null };

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!adminEmail) {
    console.error("[admin-payments] ADMIN_EMAIL is not set — refusing all admin access");
    return { error: "Server misconfigured", status: 500 as const, user: null };
  }
  if (user.email?.toLowerCase().trim() !== adminEmail) {
    return { error: "Forbidden", status: 403 as const, user: null };
  }
  return { error: null, status: 200 as const, user };
}

/**
 * Approve or reject a manual payment.
 *
 * PATCH body: { action: "approve" } | { action: "reject", reason: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error || !auth.user) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const paymentId = params.id;
    const body = await request.json();
    const action = body?.action;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    // Guard against a double-click granting credits twice.
    if (payment.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `This payment was already ${payment.status}.` },
        { status: 409 }
      );
    }

    const adminEmail = auth.user.email ?? "admin";

    if (action === "reject") {
      const reason = typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "We couldn't match your transfer to a payment we received.";

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "rejected",
          rejectionReason: reason,
          reviewedAt: new Date(),
          reviewedBy: adminEmail,
        },
      });

      const dbUser = await prisma.user.findUnique({ where: { id: payment.userId } });
      if (dbUser?.email) {
        await sendEmail({
          to: dbUser.email,
          subject: "We couldn't confirm your payment",
          html: paymentRejectedHtml(dbUser.name ?? "there", reason),
        });
      }

      return NextResponse.json({ success: true, data: { status: "rejected" } });
    }

    // --- Approve ----------------------------------------------------------
    // Status flip and credit grant in one transaction, with the status check
    // repeated inside it. Two admins clicking at once must not double-credit.
    const updated = await prisma.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!fresh || fresh.status !== "pending") return null;

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: adminEmail,
        },
      });

      return tx.user.update({
        where: { id: payment.userId },
        data: { reviewCredits: { increment: payment.credits } },
      });
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Payment was already processed." },
        { status: 409 }
      );
    }

    if (updated.email) {
      const result = await sendEmail({
        to: updated.email,
        subject: `${payment.credits} review credit${payment.credits > 1 ? "s" : ""} added to your account`,
        html: creditsAddedHtml(updated.name ?? "there", payment.credits, updated.reviewCredits),
      });
      if (!result.sent) {
        console.error(`[admin-payments] Credits granted but email failed: ${result.reason}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: { status: "approved", newBalance: updated.reviewCredits },
    });
  } catch (err) {
    console.error("[admin-payments] PATCH error:", err);
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}
