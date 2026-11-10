import { describe, expect, it } from "vitest";
import { decodeItems, encodeItems } from "@/lib/stripe";

describe("Stripe metadata item encoding", () => {
  it("round-trips order lines and applies titles", () => {
    const items = [
      { bookId: "a", title: "A", quantity: 2, price: 1299 },
      { bookId: "b", title: "B", quantity: 1, price: 1699 },
    ];
    const meta = encodeItems(items);
    expect(meta).toEqual({ items_0: "a:2:1299,b:1:1699" });
    expect(decodeItems(meta, { a: "A", b: "B" })).toEqual(items);
  });

  it("splits long carts across chunks under Stripe's 500-character limit", () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      bookId: `book-id-number-${i}`, title: "", quantity: 3, price: 1999,
    }));
    const meta = encodeItems(items);
    const keys = Object.keys(meta);
    expect(keys.length).toBeGreaterThan(1);
    for (const v of Object.values(meta)) expect(v.length).toBeLessThanOrEqual(500);
    expect(decodeItems(meta).map((i) => i.bookId)).toEqual(items.map((i) => i.bookId));
  });

  it("uses the book id as the title when no title is known", () => {
    expect(decodeItems({ items_0: "x:1:500" })[0].title).toBe("x");
  });
});
