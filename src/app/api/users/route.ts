export const runtime = "nodejs";

// Reads auth cookies, so it can never be static. Declaring that up front
// stops Next attempting a prerender at build time, failing, and printing a
// DYNAMIC_SERVER_USAGE stack trace that looks like a broken build but isn't.
export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ success: false, error: "Server misconfigured: ADMIN_EMAIL not set" }, { status: 500 });
    }
    // Authorize with the authenticated session email. The DB `User.email`
    // column was previously client-writable via the profile API (spoofing the
    // admin address escalated this route to a full user-email dump), so it
    // must never be consulted for an authorization decision.
    if (!user.email || user.email !== adminEmail) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

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
