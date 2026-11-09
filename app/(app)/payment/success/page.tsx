import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { describePaymentIntent, fulfillPaymentIntent } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { getStripe } from "@/lib/stripe";
import ClearCart from "./ClearCart";

export const metadata: Metadata = { title: "Order confirmation" };

type Props = { searchParams: Promise<{ payment_intent?: string }> };

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { payment_intent: id } = await searchParams;

  let status: string | null = null;
  let order: Order | null = null;

  if (id?.startsWith("pi_")) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(id);
      status = pi.status;
      if (pi.status === "succeeded" && pi.metadata.source === "summarist") {
        // Whether the customer paid is decided by Stripe, not by our database:
        // show the receipt even if saving the order fails (the webhook retries).
        order = await fulfillPaymentIntent(pi).catch(async (error) => {
          console.error("Payment succeeded but the order could not be saved", error);
          return describePaymentIntent(pi);
        });
      }
    } catch (error) {
      console.error("Could not load payment", error);
    }
  }

  return (
    <div className="row">
      <div className="container">
        <ol className="shop-steps" aria-label="Checkout steps">
          <li className="shop-steps__item shop-steps__item--done">1. Cart &amp; details</li>
          <li className="shop-steps__item shop-steps__item--done">2. Payment</li>
          <li className="shop-steps__item shop-steps__item--active">3. Confirmation</li>
        </ol>

        {order ? (
          <div className="shop-card shop-receipt">
            <ClearCart />
            <div className="shop-receipt__check" aria-hidden="true">
              ✓
            </div>
            <h1 className="shop-title">Thank you for your order!</h1>
            <p className="shop-muted">
              A receipt has been sent to <strong>{order.customerEmail}</strong>.
              <br />
              Order reference: <code>{order.id}</code>
            </p>
            <table className="shop-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Qty</th>
                  <th className="num">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.bookId}>
                    <td>{item.title}</td>
                    <td>{item.quantity}</td>
                    <td className="num">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Subtotal</td>
                  <td className="num">{formatPrice(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={2}>Shipping</td>
                  <td className="num">
                    {order.shipping ? formatPrice(order.shipping) : "Free"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>Tax</td>
                  <td className="num">{formatPrice(order.tax)}</td>
                </tr>
                <tr className="shop-table__total">
                  <td colSpan={2}>Total paid</td>
                  <td className="num">{formatPrice(order.total, order.currency)}</td>
                </tr>
              </tfoot>
            </table>
            <Link href="/foryou" className="shop-btn shop-btn--primary">
              Keep browsing
            </Link>
          </div>
        ) : status === "processing" ? (
          <div className="shop-card shop-empty">
            <h1 className="shop-title">Payment processing</h1>
            <p>We&apos;ll email you as soon as your payment is confirmed.</p>
          </div>
        ) : (
          <div className="shop-card shop-empty">
            <h1 className="shop-title">Payment not completed</h1>
            <p>Your payment didn&apos;t go through and you haven&apos;t been charged.</p>
            <Link href="/payment" className="shop-btn shop-btn--primary">
              Try again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
