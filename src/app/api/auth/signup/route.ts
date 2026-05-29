import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { welcomeHtml } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send welcome email
  let emailSent = false;
  let emailError = "";

  try {
    const loginUrl = `${new URL(req.url).origin}/auth/login`;
    await sendEmail({
      to: email,
      subject: "Welcome to Scholarship Hub — your account is ready",
      html: welcomeHtml(name || "there", loginUrl),
    });
    emailSent = true;
  } catch (err: any) {
    emailError = err?.message || "Failed to send welcome email";
  }

  return NextResponse.json({
    user: data.user,
    emailSent,
    emailError: emailError || undefined,
    message: emailSent
      ? "Account created! Check your email for next steps."
      : "Account created but welcome email could not be sent.",
  });
}
