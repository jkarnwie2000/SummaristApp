// Store data the Summarist API doesn't provide. Prices live on the server so a
// client can never choose what it pays — the payment API re-prices every cart.

/** Price in cents per book id. */
export const PRICES: Record<string, number> = {
  f9gy1gpai8: 1799, // The Lean Startup
  "5bxl50cz4bt": 1499, // How to Win Friends and Influence People in the Digital Age
  "2l0idxm1rvw": 1899, // Can't Hurt Me
  "4t0amyb4upc": 1999, // Mastery
  g2tdej27d23: 1699, // Atomic Habits
  "18tro3gle2p": 1399, // How to Talk to Anyone
  ap153fptaq: 2199, // Good to Great
  "2ozpy1q1pbt": 2499, // The Intelligent Investor
  cuolx5oryy8: 1599, // The 4 Day Week
  "6ncszvwbl4e": 1799, // Zero to One
  hyqzkhdyq7h: 1299, // Rich Dad, Poor Dad
  vt4i7lvosz: 1599, // The 10X Rule
  g80xtszllo9: 1899, // Deep Work
  "6ctat6ynzqp": 1499, // The 5 Second Rule
  pducrv7aiqr: 1699, // The 12 Week Year
  vdb1ghfrlt: 1899, // Getting Things Done
};

/** Fallback price for any book added to the API later. */
export const DEFAULT_PRICE = 1499;

/** Audio length per book, so cards don't have to download audio to show it. */
export const DURATIONS: Record<string, string> = {
  f9gy1gpai8: "03:23",
  "5bxl50cz4bt": "03:24",
  "2l0idxm1rvw": "04:52",
  "4t0amyb4upc": "04:40",
  g2tdej27d23: "03:24",
  "18tro3gle2p": "03:22",
  ap153fptaq: "03:01",
  "2ozpy1q1pbt": "02:48",
  cuolx5oryy8: "02:20",
  "6ncszvwbl4e": "03:24",
  hyqzkhdyq7h: "05:38",
  vt4i7lvosz: "03:18",
  g80xtszllo9: "02:50",
  "6ctat6ynzqp": "02:45",
  pducrv7aiqr: "03:36",
  vdb1ghfrlt: "02:24",
};

/** Starting stock for every book the first time inventory is read. */
export const DEFAULT_STOCK = 25;
/** At or below this many copies a book is flagged "low stock" in the admin. */
export const LOW_STOCK_THRESHOLD = 5;
/** Most copies of one book allowed in a single order. */
export const MAX_QUANTITY = 10;

export const CURRENCY = "usd";
/** Flat shipping in cents; free at or above FREE_SHIPPING_MIN. */
export const SHIPPING_FLAT = 499;
export const FREE_SHIPPING_MIN = 3500;
export const TAX_RATE = 0.07;

export function priceFor(bookId: string): number {
  return PRICES[bookId] ?? DEFAULT_PRICE;
}

export function durationFor(bookId: string): string {
  return DURATIONS[bookId] ?? "--:--";
}

export function calculateTotals(subtotal: number) {
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

export function formatPrice(cents: number, currency = CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
