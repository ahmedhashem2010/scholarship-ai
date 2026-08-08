import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { confirmSignupHtml } from "@/lib/email-templates";

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
  const { email, password, name } = await req.json();

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
    // Supabase phrases this several ways depending on version. Normalise it,
    // and point the user at the resend path rather than leaving them stuck.
    if (/already been registered|already registered|email_exists/i.test(error.message)) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Try signing in instead.",
          code: "email_exists",
        },
        { status: 409 }
      );
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
    subject: "أكّد بريدك الإلكتروني · Confirm your SmartScholar account",
    html: confirmSignupHtml(cleanName || "بك", confirmUrl),
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
