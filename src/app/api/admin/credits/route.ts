export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";

export async function POST(request: NextRequest) {
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

    const { userId, credits, amount } = await request.json();

    if (!userId || typeof credits !== "number" || credits <= 0) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { reviewCredits: { increment: credits } },
      }),
      prisma.payment.create({
        data: {
          userId,
          amount: amount ?? 0,
          credits,
          status: "approved",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add credits";
    console.error("Admin credits POST error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
