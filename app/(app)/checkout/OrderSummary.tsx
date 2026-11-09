import { calculateTotals, formatPrice, FREE_SHIPPING_MIN, TAX_RATE } from "@/lib/catalog";

type Line = { bookId: string; title: string; price: number; quantity: number };

export default function OrderSummary({
  items,
  children,
}: {
  items: Line[];
  children?: React.ReactNode;
}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const { shipping, tax, total } = calculateTotals(subtotal);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <aside className="shop-card shop-summary" aria-label="Order summary">
      <h2 className="shop-card__title">Order summary</h2>
      <ul className="shop-summary__lines">
        {items.map((item) => (
          <li key={item.bookId}>
            <span>
              {item.title} <span className="shop-muted">× {item.quantity}</span>
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="shop-summary__totals">
        <div>
          <dt>Subtotal ({count} {count === 1 ? "item" : "items"})</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
        </div>
        <div>
          <dt>Tax ({Math.round(TAX_RATE * 100)}%)</dt>
          <dd>{formatPrice(tax)}</dd>
        </div>
        <div className="shop-summary__total">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
      {shipping > 0 && (
        <p className="shop-muted shop-summary__note">
          Add {formatPrice(FREE_SHIPPING_MIN - subtotal)} more for free shipping.
        </p>
      )}
      {children}
    </aside>
  );
}
