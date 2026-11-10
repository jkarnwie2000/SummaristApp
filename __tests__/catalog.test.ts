import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICE,
  FREE_SHIPPING_MIN,
  SHIPPING_FLAT,
  calculateTotals,
  durationFor,
  formatPrice,
  priceFor,
} from "@/lib/catalog";

describe("catalog pricing", () => {
  it("returns the listed price for a known book", () => {
    expect(priceFor("hyqzkhdyq7h")).toBe(1299);
  });

  it("falls back to the default price for an unknown book", () => {
    expect(priceFor("not-a-book")).toBe(DEFAULT_PRICE);
  });

  it("returns a placeholder duration for an unknown book", () => {
    expect(durationFor("g2tdej27d23")).toBe("03:24");
    expect(durationFor("missing")).toBe("--:--");
  });

  it("formats cents as US dollars", () => {
    expect(formatPrice(1299)).toBe("$12.99");
    expect(formatPrice(0)).toBe("$0.00");
  });
});

describe("calculateTotals", () => {
  it("charges nothing for an empty cart", () => {
    expect(calculateTotals(0)).toEqual({ subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });

  it("adds flat shipping and 7% tax below the free-shipping minimum", () => {
    const t = calculateTotals(1000);
    expect(t.shipping).toBe(SHIPPING_FLAT);
    expect(t.tax).toBe(70);
    expect(t.total).toBe(1000 + SHIPPING_FLAT + 70);
  });

  it("ships free at the free-shipping minimum", () => {
    const t = calculateTotals(FREE_SHIPPING_MIN);
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(FREE_SHIPPING_MIN + Math.round(FREE_SHIPPING_MIN * 0.07));
  });
});
