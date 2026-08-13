import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { confirmSignupHtml } from "@/lib/email-templates";
import {
  clientIp,
  consumeRateLimitBucket,
  SIGNUP_EMAIL_LIMIT,
  SIGNUP_IP_LIMIT,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Signup with real email verification.
 *
 * WHAT CHANGED AND WHY
 *
 * This route used to call `createUser({ email_confirm: true })`, which marked
 * every address as verified without checking it. That meant anyone could
 * register as anyone — including addresses they don't own — and it meant the
 * deadline reminder cron was mailing addresses that had never been proven to
 * exist. On a product whose entire value is "we email you before each step",
 * an unverified address is a silently broken account.
 *
 * HOW THE LINK WORKS
 *
 * `generateLink` creates the unconfirmed user and hands back a `hashed_token`.
 * We do NOT use the `action_link` Supabase returns: that link goes to
 * Supabase's own verify endpoint, which redirects back with the session in the
 * URL *fragment* — and a fragment never reaches the server, so our server-side
 * callback can't read it. Instead we build our own `/auth/confirm` URL around
 * the token hash and exchange it server-side with `verifyOtp`. That is the
 * documented SSR pattern and it means the student lands already signed in.
 */
export async function POST(req: NextRequest) {
  const { email, password, name, lang } = await req.json();
  // Whichever language the visitor was actually using on the site — read
  // client-side from the same localStorage key LanguageContext uses, and
  // sent along with the signup request. Defaults to Arabic (the product's
  // default) if the client didn't send one.
  const emailLang: "en" | "ar" = lang === "en" ? "en" : "ar";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = typeof name === "string" ? name.trim().slice(0, 80) : "";

  // Server-side rate limiting (Postgres-backed, shared across instances) so an
  // attacker can't trivially burn the Zoho send quota. Both dimensions are
  // enforced: per-IP catches a single bot, per-email catches the same address
  // being pounded from anywhere. A fresh address probed once is never limited,
  // and a 429 is keyed to attempt count, not existence — so it leaks nothing
  // about whether an address is registered.
  const ip = clientIp(req);
  const ipAllowed = await consumeRateLimitBucket({
    scope: "signup",
    dimension: "ip",
    value: ip,
    limit: SIGNUP_IP_LIMIT,
  });
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts from your network. Please try again later." },
      { status: 429 }
    );
  }
  const emailAllowed = await consumeRateLimitBucket({
    scope: "signup",
    dimension: "email",
    value: cleanEmail,
    limit: SIGNUP_EMAIL_LIMIT,
  });
  if (!emailAllowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts for this address. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email: cleanEmail,
    password,
    options: {
      data: {
        name: cleanName || null,
      },
    },
  });

  if (error) {
    // Supabase phrases this several ways depending on version. We must NOT let
    // an anonymous caller learn whether an address is already registered: the
    // old 409 + `code: "email_exists"` response was an enumeration oracle, so
    // we reply with exactly the same success payload a fresh signup returns.
    //
    // No email is sent on this path. Sending one would both burn Zoho's daily
    // quota for address probes and turn delivery timing into an oracle. A user
    // who genuinely owns the address recovers through the login/verify resend
    // flow (see /api/auth/resend-verification), which is anti-enumeration by
    // design and returns an identical success response for every address.
    if (/already been registered|already registered|email_exists/i.test(error.message)) {
      console.warn(
        `[signup] Address already registered — replying as success (anti-enumeration): ${cleanEmail}`
      );
      return NextResponse.json({ success: true, email: cleanEmail });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) {
    console.error("[signup] generateLink returned no hashed_token");
    return NextResponse.json(
      { error: "Could not start verification. Please try again." },
      { status: 500 }
    );
  }

  const confirmUrl =
    `${siteUrl}/auth/confirm` +
    `?token_hash=${encodeURIComponent(tokenHash)}` +
    `&type=email&next=${encodeURIComponent("/onboarding")}`;

  const emailResult = await sendEmail({
    to: cleanEmail,
    subject:
      emailLang === "en"
        ? "Confirm your SmartScholar account"
        : "أكّد بريدك الإلكتروني · Confirm your SmartScholar account",
    html: confirmSignupHtml(
      cleanName || (emailLang === "en" ? "there" : "بك"),
      confirmUrl,
      emailLang
    ),
  });

  if (!emailResult.sent) {
    // The account exists but is unreachable. Say so plainly instead of
    // showing a success screen for an email that will never arrive.
    console.error(
      `[signup] Account created for ${cleanEmail} but the verification email failed: ${emailResult.reason}`
    );
    return NextResponse.json(
      {
        error:
          "Your account was created but we couldn't send the confirmation email. Please try requesting a new link in a moment.",
        code: "email_failed",
        email: cleanEmail,
        // Outside production, hand the actual SMTP failure to the browser.
        // Without this the only clue is a server log the person debugging
        // may not be looking at — and "couldn't send" is true of a wrong
        // password, a blocked port and a bad From address alike.
        ...(process.env.NODE_ENV !== "production"
          ? { debug: emailResult.reason }
          : {}),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, email: cleanEmail });
}
