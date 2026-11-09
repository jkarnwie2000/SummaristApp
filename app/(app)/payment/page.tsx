"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatPrice } from "@/lib/catalog";
import { setPaymentIntentId } from "@/lib/cart/cartSlice";
import { selectCartItems, useAppDispatch, useAppSelector } from "@/lib/cart/store";
import type { OrderItem } from "@/lib/types";
import OrderSummary from "../checkout/OrderSummary";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
// Created once at module level so Stripe.js is only loaded a single time.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const isTestMode = publishableKey.startsWith("pk_test");

type Intent = { clientSecret: string; items: OrderItem[]; total: number };

export default function PaymentPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const customer = useAppSelector((s) => s.cart.customer);
  const hydrated = useAppSelector((s) => s.cart.hydrated);
  const savedIntentId = useAppSelector((s) => s.cart.paymentIntentId);

  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0 || !customer) {
      router.replace("/checkout");
      return;
    }
    // Guard against React Strict Mode running the effect twice in development.
    if (requested.current) return;
    requested.current = true;

    (async () => {
      try {
        const res = await fetch("/api/checkout/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(({ bookId, quantity }) => ({ bookId, quantity })),
            customer,
            paymentIntentId: savedIntentId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not start payment.");
        dispatch(setPaymentIntentId(data.paymentIntentId));
        setIntent(data);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [hydrated, items, customer, savedIntentId, router, dispatch]);

  return (
    <div className="row">
      <div className="container">
        <ol className="shop-steps" aria-label="Checkout steps">
          <li className="shop-steps__item shop-steps__item--done">
            <Link href="/checkout">1. Cart &amp; details</Link>
          </li>
          <li className="shop-steps__item shop-steps__item--active">2. Payment</li>
          <li className="shop-steps__item">3. Confirmation</li>
        </ol>
        <h1 className="shop-title">Payment</h1>

        <div className="shop-layout">
          <div className="shop-layout__main">
            {customer && (
              <section className="shop-card shop-shipto">
                <div>
                  <h2 className="shop-card__title">Shipping to</h2>
                  <p>
                    {customer.name} · {customer.email}
                    <br />
                    {customer.address}, {customer.city}
                    {customer.state ? `, ${customer.state}` : ""} {customer.postalCode},{" "}
                    {customer.country}
                  </p>
                </div>
                <Link href="/checkout" className="shop-link">
                  Edit
                </Link>
              </section>
            )}

            <section className="shop-card">
              <h2 className="shop-card__title">Card details</h2>
              {!stripePromise ? (
                <p className="shop-alert shop-alert--error">
                  Payments aren&apos;t configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and
                  STRIPE_SECRET_KEY in .env.local.
                </p>
              ) : error ? (
                <div className="shop-alert shop-alert--error" role="alert">
                  {error}{" "}
                  <Link href="/checkout" className="shop-link">
                    Back to checkout
                  </Link>
                </div>
              ) : !intent ? (
                <div className="skeleton shop-skeleton-block" aria-label="Loading payment form"></div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: intent.clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#2bd97c",
                        colorText: "#032b41",
                        borderRadius: "4px",
                        fontFamily: "Roboto, sans-serif",
                      },
                    },
                  }}
                >
                  <PaymentForm total={intent.total} />
                </Elements>
              )}
              {isTestMode && (
                <p className="shop-muted shop-testhint">
                  Test mode: pay with card <code>4242 4242 4242 4242</code>, any future
                  date and any CVC.
                </p>
              )}
            </section>
          </div>

          {/* Server-priced lines once the intent exists; cart lines until then. */}
          <OrderSummary items={intent?.items ?? items} />
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ total }: { total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/payment/success` },
    });

    // Only reached if confirmation failed; on success Stripe redirects.
    setMessage(
      error.type === "card_error" || error.type === "validation_error"
        ? (error.message ?? "Payment failed.")
        : "Something went wrong with the payment. Please try again.",
    );
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit}>
      <PaymentElement options={{ layout: "tabs" }} />
      {message && (
        <p className="shop-alert shop-alert--error" role="alert">
          {message}
        </p>
      )}
      <button
        type="submit"
        className="shop-btn shop-btn--primary shop-btn--block shop-pay-btn"
        disabled={!stripe || !elements || submitting}
      >
        {submitting ? "Processing…" : `Pay ${formatPrice(total)}`}
      </button>
    </form>
  );
}
