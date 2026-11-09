import "server-only";
import type Stripe from "stripe";
import { getAllBooks } from "./books";
import { sendOrderEmails } from "./email";
import { getStore } from "./store";
import { getStripe, orderFromPaymentIntent } from "./stripe";
import type { Order } from "./types";

/**
 * Saves a succeeded PaymentIntent as an order, takes the copies out of stock,
 * and sends the purchase emails.
 * Safe to call more than once for the same payment (the webhook and the success
 * page both call it): the store ignores order ids it has already saved, and the
 * emails only go out the first time.
 */
export async function fulfillPaymentIntent(
  pi: Stripe.PaymentIntent,
): Promise<Order | null> {
  if (pi.status !== "succeeded" || pi.metadata.source !== "summarist") {
    return null;
  }
  const books = await getAllBooks();
  const titles = Object.fromEntries(books.map((b) => [b.id, b.title]));
  const order = orderFromPaymentIntent(pi, titles);
  const { created } = await getStore().recordOrder(order);

  if (created) {
    await sendOrderEmails(order, {
      shipping: pi.shipping ? { name: pi.shipping.name, ...pi.shipping.address } : null,
      billing: await billingAddress(pi),
    }).catch((error) => console.error("Purchase emails failed", error));
  }
  return order;
}

async function billingAddress(pi: Stripe.PaymentIntent) {
  try {
    const chargeId =
      typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;
    if (!chargeId) return null;
    const { billing_details: b } = await getStripe().charges.retrieve(chargeId);
    return b.address ? { name: b.name, ...b.address } : null;
  } catch {
    return null;
  }
}

/** Order details for a PaymentIntent, without saving anything (for display). */
export async function describePaymentIntent(pi: Stripe.PaymentIntent): Promise<Order> {
  const books = await getAllBooks().catch(() => []);
  const titles = Object.fromEntries(books.map((b) => [b.id, b.title]));
  return orderFromPaymentIntent(pi, titles);
}
