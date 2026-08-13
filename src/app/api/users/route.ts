export const runtime = "nodejs";

// Reads auth cookies, so it can never be static. Declaring that up front
// stops Next attempting a prerender at build time, failing, and printing a
// DYNAMIC_SERVER_USAGE stack trace that looks like a broken build but isn't.
export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if ("response" in gate) return gate.response;

    const users = await prisma.user.findMany({
      select: { id: true, email: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    console.error("Users GET error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
