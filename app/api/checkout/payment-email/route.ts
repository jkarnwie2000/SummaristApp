import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * Updates the receipt email on an unpaid PaymentIntent (the email field on the
 * payment page). The caller must present the intent's client secret, which only
 * the buyer's browser has.
 */
export async function POST(request: Request) {
  let body: { clientSecret?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const clientSecret = typeof body.clientSecret === "string" ? body.clientSecret : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const id = clientSecret.split("_secret_")[0];
  if (!id.startsWith("pi_")) {
    return NextResponse.json({ error: "Invalid payment." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(id);
    if (pi.client_secret !== clientSecret || pi.metadata.source !== "summarist") {
      return NextResponse.json({ error: "Invalid payment." }, { status: 403 });
    }
    if (pi.status === "succeeded" || pi.status === "canceled" || pi.status === "processing") {
      return NextResponse.json({ error: "This payment can no longer be changed." }, { status: 409 });
    }
    await stripe.paymentIntents.update(id, {
      receipt_email: email,
      metadata: { customer_email: email },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update receipt email", error);
    return NextResponse.json({ error: "Couldn't update your email. Please try again." }, { status: 500 });
  }
}
