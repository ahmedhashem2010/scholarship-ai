export const runtime = "nodejs";

// Reads auth cookies, so it can never be static. Declaring that up front
// stops Next attempting a prerender at build time, failing, and printing a
// DYNAMIC_SERVER_USAGE stack trace that looks like a broken build but isn't.
export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { getReceiptSignedUrl } from "@/lib/supabase/storage";

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ success: false, error: "Server misconfigured: ADMIN_EMAIL not set" }, { status: 500 });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.email || dbUser.email !== adminEmail) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Pending first — that's the queue that actually needs action.
    const payments = await prisma.payment.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        user: { select: { email: true, name: true, reviewCredits: true } },
      },
    });

    // Receipts live in a private bucket; mint a short-lived signed URL for each
    // so the admin can view them without making the bucket public.
    const withReceipts = await Promise.all(
      payments.map(async (p) => ({
        ...p,
        receiptSignedUrl: p.receiptUrl ? await getReceiptSignedUrl(p.receiptUrl) : null,
      }))
    );

    const pendingCount = payments.filter((p) => p.status === "pending").length;

    return NextResponse.json({
      success: true,
      data: withReceipts,
      meta: { pendingCount, total: payments.length },
    });
  } catch (err) {
    console.error("Admin payments GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
