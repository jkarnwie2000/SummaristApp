"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_QUANTITY } from "@/lib/catalog";
import { addItem } from "@/lib/cart/cartSlice";
import { useAppDispatch, useAppSelector } from "@/lib/cart/store";
import type { CartItem } from "@/lib/types";
import { CartIcon } from "../../../components/icons";

type Props = { item: Omit<CartItem, "quantity">; stock: number };

export default function AddToCart({ item, stock }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const inCart = useAppSelector(
    (s) => s.cart.items.find((i) => i.bookId === item.bookId)?.quantity ?? 0,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const maxAddable = Math.max(0, Math.min(MAX_QUANTITY, stock) - inCart);
  const soldOut = stock === 0;

  const add = (goToCheckout: boolean) => {
    if (maxAddable === 0) return;
    dispatch(addItem({ ...item, quantity: Math.min(quantity, maxAddable) }));
    if (goToCheckout) {
      router.push("/checkout");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (soldOut) {
    return (
      <button className="shop-btn shop-btn--primary" disabled>
        Out of stock
      </button>
    );
  }

  return (
    <div className="book-buy__actions">
      <label className="book-buy__qty">
        <span className="sr-only">Quantity</span>
        <select
          value={Math.min(quantity, Math.max(1, maxAddable))}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={maxAddable === 0}
        >
          {Array.from({ length: Math.max(1, maxAddable) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Qty {n}
            </option>
          ))}
        </select>
      </label>
      <button
        className="shop-btn shop-btn--primary"
        onClick={() => add(false)}
        disabled={maxAddable === 0}
      >
        <CartIcon /> {added ? "Added!" : maxAddable === 0 ? "Max in cart" : "Add to cart"}
      </button>
      <button
        className="shop-btn shop-btn--secondary"
        onClick={() => (maxAddable === 0 ? router.push("/checkout") : add(true))}
      >
        Buy now
      </button>
      <span className="sr-only" aria-live="polite">
        {added ? `${item.title} added to cart` : ""}
      </span>
    </div>
  );
}
