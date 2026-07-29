import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createApiClient } from "@/lib/supabase/api-auth";
import { prisma } from "@/lib/prisma";
import { validatePackage } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { packageId, credits } = await request.json();

    // Price is resolved from the server's own table, never from the request
    // body — otherwise a tampered payload could buy 100 credits for $3.
    const pkg = validatePackage(packageId, credits);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Invalid package" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Not an error state — manual payment is a first-class path in this
      // market. The UI reads this flag and routes the user to WhatsApp.
      return NextResponse.json(
        {
          success: false,
          cardPaymentsUnavailable: true,
          error: "Card payments aren't set up yet — use Vodafone Cash, InstaPay or bank transfer instead.",
        },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31" as any });

    // Behind a proxy, nextUrl.origin can resolve to the internal host, which
    // produces redirect URLs that 404 for the user. Prefer the configured
    // public URL.
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency: "usd", product_data: { name: pkg.name }, unit_amount: pkg.price * 100 }, quantity: 1 }],
      customer_email: dbUser.email ?? undefined,
      metadata: { userId: user.id, credits: String(pkg.credits), packageId: pkg.id },
      success_url: `${origin}/dashboard/credits?success=true`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    // Log the detail, return something generic. Stripe errors can echo back
    // account and key metadata that shouldn't reach the browser.
    console.error("Checkout error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't start checkout. Please try again or use a local payment method." },
      { status: 500 }
    );
  }
}
