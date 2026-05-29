import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ success: false, error: "Webhook not configured" }, { status: 500 });
    }

    const StripeClient = (await import("stripe")).default;
    const stripe = new StripeClient(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31" as any });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits ?? "0", 10);

      if (userId && credits > 0) {
        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { reviewCredits: { increment: credits } } }),
          prisma.payment.create({
            data: { userId, amount: Math.round((session.amount_total ?? 0) / 100), credits, status: "approved" },
          }),
        ]);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("Webhook error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
