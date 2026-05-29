import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createApiClient } from "@/lib/supabase/api-auth";
import { prisma } from "@/lib/prisma";

const PRICE_LOOKUP: Record<string, { credits: number; price: number; name: string }> = {
  "1-review":   { credits: 1,  price: 3,  name: "Starter" },
  "3-reviews":  { credits: 3,  price: 8,  name: "Popular" },
  "5-reviews":  { credits: 5,  price: 12, name: "Pro" },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { packageId, credits } = await request.json();
    const pkg = PRICE_LOOKUP[packageId as string];
    if (!pkg || pkg.credits !== credits) {
      return NextResponse.json({ success: false, error: "Invalid package" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ success: false, error: "Card payments unavailable. Use manual payment." }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31" as any });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency: "usd", product_data: { name: pkg.name }, unit_amount: pkg.price * 100 }, quantity: 1 }],
      customer_email: dbUser.email ?? undefined,
      metadata: { userId: user.id, credits: String(pkg.credits), packageId: packageId as string },
      success_url: `${request.nextUrl.origin}/dashboard/credits?success=true`,
      cancel_url: `${request.nextUrl.origin}/pricing?cancelled=true`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Checkout error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
