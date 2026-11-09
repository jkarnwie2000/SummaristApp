import "server-only";
import type Stripe from "stripe";
import { getAllBooks } from "./books";
import { getStore } from "./store";
import { orderFromPaymentIntent } from "./stripe";
import type { Order } from "./types";

/**
 * Saves a succeeded PaymentIntent as an order and takes the copies out of stock.
 * Safe to call more than once for the same payment (the webhook and the success
 * page both call it), because the store ignores order ids it has already saved.
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
  await getStore().recordOrder(order);
  return order;
}
