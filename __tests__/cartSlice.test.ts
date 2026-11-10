import { describe, expect, it } from "vitest";
import reducer, {
  addItem,
  clearCart,
  hydrate,
  removeItem,
  setCustomer,
  setPaymentIntentId,
  setQuantity,
  type CartState,
} from "@/lib/cart/cartSlice";
import { MAX_QUANTITY } from "@/lib/catalog";

const book = { bookId: "b1", title: "Atomic Habits", author: "James Clear", imageLink: "x.png", price: 1699 };
const empty = () => reducer(undefined, { type: "@@init" });

describe("cart reducer", () => {
  it("starts empty and not hydrated", () => {
    const s = empty();
    expect(s.items).toEqual([]);
    expect(s.hydrated).toBe(false);
  });

  it("adds a new item with quantity 1 by default", () => {
    const s = reducer(empty(), addItem(book as never));
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(1);
  });

  it("merges repeat adds and caps quantity at the maximum", () => {
    let s = reducer(empty(), addItem({ ...book, quantity: 3 } as never));
    s = reducer(s, addItem({ ...book, quantity: 2 } as never));
    expect(s.items[0].quantity).toBe(5);
    s = reducer(s, addItem({ ...book, quantity: 50 } as never));
    expect(s.items[0].quantity).toBe(MAX_QUANTITY);
  });

  it("clamps setQuantity between 1 and the maximum", () => {
    let s = reducer(empty(), addItem(book as never));
    s = reducer(s, setQuantity({ bookId: "b1", quantity: 0 }));
    expect(s.items[0].quantity).toBe(1);
    s = reducer(s, setQuantity({ bookId: "b1", quantity: 99 }));
    expect(s.items[0].quantity).toBe(MAX_QUANTITY);
  });

  it("removes an item", () => {
    let s = reducer(empty(), addItem(book as never));
    s = reducer(s, removeItem("b1"));
    expect(s.items).toEqual([]);
  });

  it("clears items and the payment intent but keeps the customer", () => {
    const customer = { name: "A", email: "a@b.co", address: "1 St", city: "C", state: "TX", postalCode: "1", country: "US" };
    let s = reducer(empty(), addItem(book as never));
    s = reducer(s, setCustomer(customer as never));
    s = reducer(s, setPaymentIntentId("pi_123"));
    s = reducer(s, clearCart());
    expect(s.items).toEqual([]);
    expect(s.paymentIntentId).toBeNull();
    expect(s.customer).toEqual(customer);
  });

  it("hydrates from saved state and marks itself hydrated", () => {
    const saved: Partial<CartState> = { items: [{ ...book, quantity: 2 } as never], paymentIntentId: "pi_1" };
    const s = reducer(empty(), hydrate(saved));
    expect(s.items[0].quantity).toBe(2);
    expect(s.paymentIntentId).toBe("pi_1");
    expect(s.hydrated).toBe(true);
    expect(reducer(empty(), hydrate(null)).hydrated).toBe(true);
  });
});
