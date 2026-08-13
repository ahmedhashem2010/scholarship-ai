import type { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createApiClient } from "@/lib/supabase/api-auth";
import { errorResponse } from "@/lib/api-utils";

/**
 * Shared authentication for API routes.
 *
 * Every protected route resolves the session the same way: re-validate the
 * JWT server-side via `supabase.auth.getUser()` (never `getSession()`) using
 * the request's cookies. Centralizing this keeps the 401 response shape —
 * and the session source — identical everywhere, so a new route cannot drift
 * into an inconsistent authorization response.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const supabase = createApiClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export type AdminGateResult = { user: User } | { response: NextResponse };

/**
 * Authenticated-user gate for admin-only endpoints.
 *
 * The gate compares the *session* email against `ADMIN_EMAIL` — never a DB
 * `User.email`, which clients must not be able to influence (a spoofed DB
 * email must not escalate). Failures map to distinct, consistent responses:
 * 401 unauthenticated, 403 authenticated-but-not-admin, 500 misconfigured.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminGateResult> {
  const user = await getAuthenticatedUser(request);
  if (!user) return { response: errorResponse("Unauthorized", 401) };

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { response: errorResponse("Server misconfigured: ADMIN_EMAIL not set", 500) };
  }
  if (!user.email || user.email !== adminEmail) {
    return { response: errorResponse("Forbidden", 403) };
  }
  return { user };
}
