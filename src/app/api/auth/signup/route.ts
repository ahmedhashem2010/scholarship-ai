import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { email, password, name, referralCode } = await req.json();

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

  const origin = new URL(req.url).origin;

  // Create user + generate confirmation link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo: `${origin}/auth/login`,
      data: {
        name: name || null,
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const confirmLink = data.properties?.action_link;
  if (!confirmLink) {
    return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 500 });
  }

  return NextResponse.json({
    confirmLink,
  });
}
