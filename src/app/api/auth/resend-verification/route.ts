import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { confirmSignupHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Re-sends the verification link.
 *
 * Verification email delivery fails for ordinary reasons all the time — spam
 * folders, typo'd addresses, a Zoho hiccup — and without this route the only
 * recovery is "sign up again with a different address", which loses the user.
 *
 * SECURITY NOTE: this always returns success, whatever happened. Telling an
 * anonymous caller whether an address is registered turns the endpoint into a
 * free user-enumeration oracle, which matters here because the user base is
 * students who reuse one address everywhere.
 */

/**
 * Crude in-memory throttle. Per-instance and lost on cold start, which is
 * fine: it exists to stop someone hammering the button and burning the daily
 * Zoho send quota, not as real abuse protection. Do not treat it as security.
 */
const lastSent = new Map<string, number>();
const COOLDOWN_MS = 60_000;

const okResponse = () =>
  NextResponse.json({
    success: true,
    message: "If that address needs confirming, a new link is on its way.",
  });

export async function POST(req: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  const previous = lastSent.get(cleanEmail);
  if (previous && Date.now() - previous < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Please wait a minute before requesting another link." },
      { status: 429 }
    );
  }
  lastSent.set(cleanEmail, Date.now());

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;

  // "magiclink" rather than "signup": the signup token can only be minted for
  // an address with no user row, and by definition this address already has
  // one. Consuming a magic link also sets email_confirmed_at, so it confirms
  // and signs them in at once.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: cleanEmail,
  });

  if (error || !data?.properties?.hashed_token) {
    // Includes "user not found" and "already confirmed". Both are non-events
    // from the caller's point of view — log, then answer identically.
    console.warn(`[resend-verification] ${cleanEmail}: ${error?.message ?? "no token"}`);
    return okResponse();
  }

  const confirmUrl =
    `${siteUrl}/auth/confirm` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=magiclink&next=${encodeURIComponent("/onboarding")}`;

  const name =
    (typeof data.user?.user_metadata?.name === "string" && data.user.user_metadata.name) || "بك";

  const result = await sendEmail({
    to: cleanEmail,
    subject: "رابط تفعيل جديد · Your new SmartScholar confirmation link",
    html: confirmSignupHtml(name, confirmUrl),
  });

  if (!result.sent) {
    console.error(`[resend-verification] send failed for ${cleanEmail}: ${result.reason}`);
    // Let them retry immediately when it was our fault, not theirs.
    lastSent.delete(cleanEmail);
  }

  return okResponse();
}
