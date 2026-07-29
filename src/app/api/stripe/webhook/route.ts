import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { creditsAddedHtml } from "@/lib/email-templates";
import type Stripe from "stripe";

export const runtime = "nodejs";
// Stripe signature verification needs the raw body — never let this be cached
// or statically optimised.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!webhookSecret || !stripeSecret) {
      console.error("[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY");
      return NextResponse.json({ success: false, error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
    }

    const StripeClient = (await import("stripe")).default;
    const stripe = new StripeClient(stripeSecret, { apiVersion: "2025-03-31" as any });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (e) {
      console.error("[stripe-webhook] Signature verification failed:", e);
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      // Acknowledge everything else so Stripe stops retrying it.
      return NextResponse.json({ received: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits ?? "0", 10);
    const packageId = session.metadata?.packageId ?? null;

    if (!userId || !Number.isFinite(credits) || credits <= 0) {
      console.error("[stripe-webhook] Missing or invalid metadata on session", session.id);
      // 200 on purpose: retrying won't fix bad metadata, and a permanent
      // failure would have Stripe hammering this endpoint for days.
      return NextResponse.json({ received: true, error: "Invalid metadata" });
    }

    // Only grant credits once the money has actually settled. `session.completed`
    // fires for unpaid sessions too when using async payment methods.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "payment not settled" });
    }

    // --- Idempotency ------------------------------------------------------
    // Stripe re-delivers any event that doesn't get a prompt 2xx. Without this
    // guard, a slow response doubles the user's credits. `stripeEventId` is
    // UNIQUE, so a concurrent duplicate fails at the DB rather than racing.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            userId,
            amount: Math.round((session.amount_total ?? 0) / 100),
            credits,
            status: "approved",
            method: "stripe",
            packageId,
            stripeEventId: event.id,
            stripeSessionId: session.id,
            reviewedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { reviewCredits: { increment: credits } },
        });
      });
    } catch (e: unknown) {
      // P2002 = unique constraint violation on stripeEventId, i.e. we've
      // already processed this exact event. That's success, not failure.
      const code = (e as { code?: string })?.code;
      if (code === "P2002") {
        // Deliberate production audit trail — a payment event is worth logging.
        console.info(`[stripe-webhook] Duplicate event ${event.id} ignored`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw e;
    }

    console.info(`[stripe-webhook] Granted ${credits} credits to ${userId} (event ${event.id})`);

    // Confirmation email — non-blocking, must never fail the webhook.
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (dbUser?.email) {
      const result = await sendEmail({
        to: dbUser.email,
        subject: `${credits} review credit${credits > 1 ? "s" : ""} added to your account`,
        html: creditsAddedHtml(dbUser.name ?? "there", credits, dbUser.reviewCredits),
      });
      if (!result.sent) {
        console.error(`[stripe-webhook] Credits granted but email failed: ${result.reason}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Unhandled error:", err);
    // 500 tells Stripe to retry — correct for transient DB failures, and the
    // idempotency guard makes the retry safe.
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
