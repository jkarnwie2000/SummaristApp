import "server-only";
import Stripe from "stripe";
import { calculateTotals, CURRENCY } from "./catalog";
import type { Order, OrderItem } from "./types";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local.");
  }
  client ??= new Stripe(key);
  return client;
}

/*
 * Order lines are stored on the PaymentIntent's metadata as
 * "bookId:quantity:unitPriceCents" joined by commas, so the order can be rebuilt
 * from Stripe alone (by the webhook or the success page). Stripe allows 500
 * characters per metadata value, so lines are split across items_0, items_1, …
 */
const CHUNK = 480;

export function encodeItems(items: OrderItem[]): Record<string, string> {
  const encoded = items.map((i) => `${i.bookId}:${i.quantity}:${i.price}`);
  const chunks: string[] = [];
  let current = "";
  for (const line of encoded) {
    const next = current ? `${current},${line}` : line;
    if (next.length > CHUNK) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return Object.fromEntries(chunks.map((c, i) => [`items_${i}`, c]));
}

export function decodeItems(
  metadata: Stripe.Metadata,
  titles: Record<string, string> = {},
): OrderItem[] {
  const lines = Object.keys(metadata)
    .filter((k) => k.startsWith("items_"))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
    .flatMap((k) => metadata[k].split(","));
  return lines.filter(Boolean).map((line) => {
    const [bookId, quantity, price] = line.split(":");
    return {
      bookId,
      title: titles[bookId] ?? bookId,
      quantity: Number(quantity),
      price: Number(price),
    };
  });
}

/** Builds the order record for a succeeded PaymentIntent. */
export function orderFromPaymentIntent(
  pi: Stripe.PaymentIntent,
  titles: Record<string, string> = {},
): Order {
  const items = decodeItems(pi.metadata, titles);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totals = calculateTotals(subtotal);
  return {
    id: pi.id,
    createdAt: new Date(pi.created * 1000).toISOString(),
    customerName: pi.shipping?.name ?? pi.metadata.customer_name ?? "",
    customerEmail: pi.receipt_email ?? pi.metadata.customer_email ?? "",
    items,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    // What Stripe actually charged is the source of truth.
    total: pi.amount_received || pi.amount,
    currency: pi.currency ?? CURRENCY,
  };
}
