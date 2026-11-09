import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAllBooks } from "@/lib/books";
import { calculateTotals, CURRENCY, MAX_QUANTITY } from "@/lib/catalog";
import { getStore } from "@/lib/store";
import { encodeItems, getStripe } from "@/lib/stripe";
import type { Customer, OrderItem } from "@/lib/types";

type Body = {
  items?: { bookId?: unknown; quantity?: unknown }[];
  customer?: Partial<Customer>;
  /** Re-use the PaymentIntent from an earlier visit to the payment page. */
  paymentIntentId?: string;
};

const REQUIRED_FIELDS: (keyof Customer)[] = [
  "name",
  "email",
  "address",
  "city",
  "postalCode",
  "country",
];

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  // --- Validate customer ---------------------------------------------------
  const customer = body.customer ?? {};
  for (const field of REQUIRED_FIELDS) {
    if (typeof customer[field] !== "string" || !customer[field]!.trim()) {
      return bad(`Missing customer ${field}.`);
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email!)) {
    return bad("Enter a valid email address.");
  }

  // --- Validate cart and price it on the server ----------------------------
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return bad("Your cart is empty.");
  }
  const books = new Map((await getAllBooks()).map((b) => [b.id, b]));
  if (books.size === 0) {
    return bad("The book catalog is unavailable. Please try again.", 503);
  }

  const quantities = new Map<string, number>();
  for (const raw of body.items) {
    const bookId = String(raw.bookId ?? "");
    const quantity = Number(raw.quantity);
    if (!books.has(bookId)) return bad("Your cart has a book we don't sell.");
    if (!Number.isInteger(quantity) || quantity < 1) {
      return bad("Invalid quantity in cart.");
    }
    quantities.set(bookId, (quantities.get(bookId) ?? 0) + quantity);
  }

  const inventory = await getStore().getInventory([...quantities.keys()]);
  const items: OrderItem[] = [];
  for (const [bookId, quantity] of quantities) {
    const book = books.get(bookId)!;
    if (quantity > MAX_QUANTITY) {
      return bad(`You can order at most ${MAX_QUANTITY} copies of ${book.title}.`);
    }
    if (quantity > inventory[bookId]) {
      return bad(
        inventory[bookId] === 0
          ? `${book.title} is out of stock.`
          : `Only ${inventory[bookId]} copies of ${book.title} are left.`,
        409,
      );
    }
    items.push({ bookId, title: book.title, price: book.price, quantity });
  }

  const totals = calculateTotals(
    items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  // --- Create (or update) the PaymentIntent --------------------------------
  const shipping: Stripe.PaymentIntentCreateParams.Shipping = {
    name: customer.name!.trim(),
    address: {
      line1: customer.address!.trim(),
      city: customer.city!.trim(),
      state: customer.state?.trim() || undefined,
      postal_code: customer.postalCode!.trim(),
      country: customer.country!.trim().toUpperCase(),
    },
  };
  const metadata = {
    source: "summarist",
    customer_name: shipping.name,
    customer_email: customer.email!.trim(),
    ...encodeItems(items),
  };

  try {
    const stripe = getStripe();
    let intent: Stripe.PaymentIntent | null = null;

    if (body.paymentIntentId?.startsWith("pi_")) {
      const existing = await stripe.paymentIntents
        .retrieve(body.paymentIntentId)
        .catch(() => null);
      if (
        existing &&
        existing.metadata.source === "summarist" &&
        existing.status === "requires_payment_method"
      ) {
        // Clear old item keys in case the cart shrank to fewer chunks.
        const cleared = Object.fromEntries(
          Object.keys(existing.metadata)
            .filter((k) => k.startsWith("items_"))
            .map((k) => [k, ""]),
        );
        intent = await stripe.paymentIntents.update(existing.id, {
          amount: totals.total,
          receipt_email: metadata.customer_email,
          shipping,
          metadata: { ...cleared, ...metadata },
        });
      }
    }

    intent ??= await stripe.paymentIntents.create({
      amount: totals.total,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      receipt_email: metadata.customer_email,
      shipping,
      metadata,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      items,
      ...totals,
    });
  } catch (error) {
    console.error("Failed to create PaymentIntent", error);
    const message =
      error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")
        ? "Payments aren't configured yet (missing Stripe keys)."
        : "We couldn't start the payment. Please try again.";
    return bad(message, 500);
  }
}
