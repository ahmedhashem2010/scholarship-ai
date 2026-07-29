import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Email confirmation landing point.
 *
 * The student clicks the button in their inbox, arrives here with a token
 * hash, and we exchange it for a real session server-side. They land signed
 * in — no "now go and log in" step, which is where a chunk of people give up.
 *
 * This exists instead of using Supabase's own `action_link` because that link
 * returns the session in the URL fragment, and a fragment is never sent to the
 * server. See the comment in `api/auth/signup/route.ts`.
 */

/** Only OTP types we actually issue. Anything else is a probe. */
const ALLOWED: EmailOtpType[] = ["email", "signup", "magiclink", "recovery", "invite"];

/** Prevents a confirmation link being turned into an open redirect. */
function safeNext(raw: string | null): string {
  if (!raw) return "/onboarding";
  // Must be a same-site absolute path. "//evil.com" is a protocol-relative
  // URL that most naive checks let straight through.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/onboarding";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(reason)}`);

  if (!tokenHash || !type || !ALLOWED.includes(type)) {
    return fail("invalid_link");
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Overwhelmingly this is an expired or already-used link. Both deserve a
    // "get a new one" path rather than a dead end, so the login page reads
    // this code and offers to resend.
    console.warn(`[auth/confirm] verifyOtp failed: ${error.message}`);
    return fail(/expired/i.test(error.message) ? "link_expired" : "link_invalid");
  }

  return NextResponse.redirect(`${origin}${next}`);
}
