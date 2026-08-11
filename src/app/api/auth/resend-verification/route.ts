import { NextRequest, NextResponse } from "next/server";
import { createClient, type GenerateLinkParams } from "@supabase/supabase-js";
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

  // "signup", not "magiclink". A magic link is a *login* token: it issues a
  // recovery-style OTP and treats the address as a signing-in user, not a
  // pending signup. This resend is re-issuing a signup confirmation, so it
  // must mint the same token kind the signup route does — otherwise the
  // confirmation page gets a token of the wrong type.
  //
  // GoTrue's admin.generateLink explicitly supports re-minting a signup
  // confirmation token for an address that already has an (unconfirmed) user
  // row: it refreshes confirmation_token / confirmation_sent_at and returns a
  // fresh hashed_token. Only already-confirmed users are rejected (they don't
  // need this email anyway). See internal/api/mail.go adminGenerateLink.
  //
  // No options.data is passed on purpose: GoTrue merges the data into the
  // user's existing user_metadata, and we'd only risk clobbering the name the
  // original signup stored.
  //
  // The type cast exists because GenerateSignupLinkParams marks `password` as
  // required — it IS required to *create* a user via generateLink. But this
  // route only ever resends to an existing (unconfirmed) user, where GoTrue
  // ignores the password and just re-mints the confirmation token. Deliberately
  // sending none also means an address that was never registered fails
  // validation server-side and creates nothing — no silent account creation.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email: cleanEmail,
  } as GenerateLinkParams);

  if (error || !data?.properties?.hashed_token) {
    // Includes "user not found" and "already confirmed". Both are non-events
    // from the caller's point of view — log, then answer identically.
    console.warn(`[resend-verification] ${cleanEmail}: ${error?.message ?? "no token"}`);
    return okResponse();
  }

  const confirmUrl =
    `${siteUrl}/auth/confirm` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=email&next=${encodeURIComponent("/onboarding")}`;

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
