export type Book = {
  id: string;
  author: string;
  title: string;
  subTitle: string;
  imageLink: string;
  audioLink: string;
  totalRating: number;
  averageRating: number;
  keyIdeas: number;
  type: string;
  status: string;
  subscriptionRequired: boolean;
  summary: string;
  tags: string[];
  bookDescription: string;
  authorDescription: string;
};

/** A book plus the store data (price, duration) the API doesn't provide. */
export type ShopBook = Book & {
  /** Price in cents. */
  price: number;
  /** Audio length as "mm:ss". */
  duration: string;
};

export type CartItem = {
  bookId: string;
  title: string;
  author: string;
  imageLink: string;
  /** Price in cents at the time it was added (display only — server re-prices). */
  price: number;
  quantity: number;
};

export type Customer = {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderItem = {
  bookId: string;
  title: string;
  /** Unit price in cents. */
  price: number;
  quantity: number;
};

export type Order = {
  /** Stripe PaymentIntent id — doubles as an idempotency key. */
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  /** Totals in cents. */
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
};
