import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllBooks } from "@/lib/books";
import { DEFAULT_STOCK, formatPrice, LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import type { Order } from "@/lib/types";
import { getStore } from "@/lib/store";
import { logout } from "./actions";
import DeleteTransaction from "./DeleteTransaction";
import RevenueChart from "./RevenueChart";
import StockForm from "./StockForm";

export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false } };
// Always show live sales data.
export const dynamic = "force-dynamic";

const DAYS = 14;

export default async function AdminDashboard() {
  const adminEmail = await requireAdmin();

  const books = await getAllBooks();
  const { orders, inventory, storeError } = await loadStoreData(books.map((b) => b.id));

  // --- Sales stats ---------------------------------------------------------
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const units = orders.reduce(
    (sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );
  const avgOrder = orders.length ? Math.round(revenue / orders.length) : 0;

  const soldByBook = new Map<string, { units: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const entry = soldByBook.get(item.bookId) ?? { units: 0, revenue: 0 };
      entry.units += item.quantity;
      entry.revenue += item.price * item.quantity;
      soldByBook.set(item.bookId, entry);
    }
  }

  // Revenue per day for the last DAYS days (UTC dates).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daily = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (DAYS - 1 - i));
    return { date: date.toISOString().slice(0, 10), revenue: 0, orders: 0 };
  });
  const dayIndex = new Map(daily.map((d, i) => [d.date, i]));
  for (const order of orders) {
    const i = dayIndex.get(order.createdAt.slice(0, 10));
    if (i !== undefined) {
      daily[i].revenue += order.total;
      daily[i].orders += 1;
    }
  }
  const periodRevenue = daily.reduce((s, d) => s + d.revenue, 0);

  // --- Inventory -----------------------------------------------------------
  const rows = books
    .map((book) => ({
      book,
      stock: inventory[book.id],
      sold: soldByBook.get(book.id) ?? { units: 0, revenue: 0 },
    }))
    .sort((a, b) => b.sold.revenue - a.sold.revenue || a.book.title.localeCompare(b.book.title));
  const lowStock = rows.filter((r) => r.stock <= LOW_STOCK_THRESHOLD).length;
  const stockValue = rows.reduce((s, r) => s + r.stock * r.book.price, 0);

  const titleOf = new Map(books.map((b) => [b.id, b.title]));
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="admin">
      <header className="admin__header">
        <div className="admin__brand">
          <Link href="/" className="admin__logo" aria-label="Summarist home page">
            <Image src="/logo.png" alt="Summarist" width={160} height={40} preload />
          </Link>
          <div>
            <h1 className="admin-title">Sales &amp; inventory</h1>
            <p className="shop-muted">Summarist store dashboard</p>
          </div>
        </div>
        <div className="admin__header-actions">
          <span className="admin__who">Signed in as {adminEmail}</span>
          <Link href="/foryou" className="shop-link">
            View store
          </Link>
          <form action={logout}>
            <button className="shop-btn shop-btn--secondary">Sign out</button>
          </form>
        </div>
      </header>

      {storeError && (
        <div className="shop-alert shop-alert--error" role="alert">
          <strong>Order storage is unavailable</strong>, so sales and stock below are
          not live and changes can&apos;t be saved. If you use Firestore, check that a
          Firestore database exists for your Firebase project.
          <br />
          <span className="admin-mono">{storeError}</span>
        </div>
      )}

      <section className="admin-stats" aria-label="Key figures">
        <Stat label="Total revenue" value={formatPrice(revenue)} />
        <Stat label="Orders" value={orders.length.toLocaleString()} />
        <Stat label="Copies sold" value={units.toLocaleString()} />
        <Stat label="Average order" value={formatPrice(avgOrder)} />
        <Stat
          label="Low-stock titles"
          value={String(lowStock)}
          note={`at or under ${LOW_STOCK_THRESHOLD} copies`}
          warn={lowStock > 0}
        />
      </section>

      <section className="admin-card">
        <div className="admin-card__head">
          <h2 className="admin-card__title">Revenue, last {DAYS} days</h2>
          <span className="admin-card__meta">{formatPrice(periodRevenue)} total</span>
        </div>
        <RevenueChart data={daily} />
      </section>

      <section className="admin-card">
        <div className="admin-card__head">
          <h2 className="admin-card__title">Inventory</h2>
          <span className="admin-card__meta">
            {rows.reduce((s, r) => s + r.stock, 0).toLocaleString()} copies ·{" "}
            {formatPrice(stockValue)} retail value
          </span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Book</th>
                <th className="num">Price</th>
                <th className="num">Sold</th>
                <th className="num">Revenue</th>
                <th>Status</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ book, stock, sold }) => (
                <tr key={book.id}>
                  <td>
                    <div className="admin-book">
                      <Image src={book.imageLink} alt="" width={36} height={36} />
                      <div>
                        <Link href={`/book/${book.id}`} className="admin-book__title">
                          {book.title}
                        </Link>
                        <div className="shop-muted">{book.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{formatPrice(book.price)}</td>
                  <td className="num">{sold.units}</td>
                  <td className="num">{formatPrice(sold.revenue)}</td>
                  <td>
                    <StockBadge stock={stock} />
                  </td>
                  <td>
                    <StockForm bookId={book.id} stock={stock} title={book.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card__head">
          <h2 className="admin-card__title">Transactions</h2>
          <span className="admin-card__meta">{orders.length} total</span>
        </div>
        {orders.length === 0 ? (
          <p className="shop-muted admin-empty">
            No transactions yet. Completed Stripe payments will show up here.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="num">Total</th>
                  <th>Payment</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="nowrap">{dateFmt.format(new Date(order.createdAt))}</td>
                    <td>
                      <div>{order.customerName || "—"}</div>
                      <div className="shop-muted">{order.customerEmail}</div>
                    </td>
                    <td>
                      {order.items.map((i) => (
                        <div key={i.bookId}>
                          {titleOf.get(i.bookId) ?? i.title}{" "}
                          <span className="shop-muted">× {i.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="num">{formatPrice(order.total, order.currency)}</td>
                    <td>
                      <a
                        className="shop-link admin-mono"
                        href={`https://dashboard.stripe.com/payments/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in Stripe"
                      >
                        {order.id.slice(0, 14)}…
                      </a>
                    </td>
                    <td>
                      <DeleteTransaction id={order.id} label={`${order.customerName || order.customerEmail} – ${formatPrice(order.total, order.currency)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/** Reads orders + stock; if the store is down, returns empty data and the error. */
async function loadStoreData(bookIds: string[]): Promise<{
  orders: Order[];
  inventory: Record<string, number>;
  storeError: string | null;
}> {
  const store = getStore();
  try {
    const [orders, inventory] = await Promise.all([
      store.listOrders(),
      store.getInventory(bookIds),
    ]);
    return { orders, inventory, storeError: null };
  } catch (error) {
    console.error("Order store unavailable", error);
    return {
      orders: [],
      inventory: Object.fromEntries(bookIds.map((id) => [id, DEFAULT_STOCK])),
      storeError: String((error as Error).message ?? error).split("\n")[0],
    };
  }
}

function Stat({
  label,
  value,
  note,
  warn = false,
}: {
  label: string;
  value: string;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__label">{label}</div>
      <div className="admin-stat__value">
        {warn && (
          <span className="admin-stat__warn" aria-label="Needs attention">
            ⚠
          </span>
        )}
        {value}
      </div>
      {note && <div className="admin-stat__note">{note}</div>}
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="admin-badge admin-badge--critical">● Out of stock</span>;
  if (stock <= LOW_STOCK_THRESHOLD)
    return <span className="admin-badge admin-badge--warning">▲ Low stock</span>;
  return <span className="admin-badge admin-badge--good">✓ In stock</span>;
}
