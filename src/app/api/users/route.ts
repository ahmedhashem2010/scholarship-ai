export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";

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

    const users = await prisma.user.findMany({
      select: { id: true, email: true, reviewCredits: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    console.error("Users GET error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
