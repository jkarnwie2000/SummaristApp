import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillPaymentIntent } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook: records an order when a payment succeeds, even if the buyer
 * closes the tab before reaching the success page.
 *
 * Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * and put the printed signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Webhook not configured or signature missing." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    // The raw body is required for signature verification.
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    try {
      await fulfillPaymentIntent(event.data.object);
    } catch (error) {
      console.error("Failed to record order from webhook", error);
      // A 500 makes Stripe retry later.
      return NextResponse.json({ error: "Failed to record order." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
