"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice, MAX_QUANTITY } from "@/lib/catalog";
import { addItem } from "@/lib/cart/cartSlice";
import {
  selectCartCount,
  selectCartSubtotal,
  useAppDispatch,
  useAppSelector,
} from "@/lib/cart/store";
import type { CartItem } from "@/lib/types";
import { CartIcon } from "../../../components/icons";

type Props = { item: Omit<CartItem, "quantity">; stock: number };

export default function AddToCart({ item, stock }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const inCart = useAppSelector(
    (s) => s.cart.items.find((i) => i.bookId === item.bookId)?.quantity ?? 0,
  );
  const cartCount = useAppSelector(selectCartCount);
  const cartSubtotal = useAppSelector(selectCartSubtotal);
  const [quantity, setQuantity] = useState(1);
  /** How many copies the last click added; shows the "added" panel when set. */
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const maxAddable = Math.max(0, Math.min(MAX_QUANTITY, stock) - inCart);

  // Move focus to the confirmation so keyboard and screen-reader users land on the choices.
  useEffect(() => {
    if (justAdded) panelRef.current?.focus();
  }, [justAdded]);

  const add = (goToCheckout: boolean) => {
    if (maxAddable === 0) return;
    const qty = Math.min(quantity, maxAddable);
    dispatch(addItem({ ...item, quantity: qty }));
    setQuantity(1);
    if (goToCheckout) router.push("/checkout");
    else setJustAdded(qty);
  };

  if (stock === 0) {
    return (
      <button className="shop-btn shop-btn--primary" disabled>
        Out of stock
      </button>
    );
  }

  return (
    <>
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
          <CartIcon /> {maxAddable === 0 ? "Max in cart" : "Add to cart"}
        </button>
        <button
          className="shop-btn shop-btn--secondary"
          onClick={() => (maxAddable === 0 ? router.push("/checkout") : add(true))}
        >
          Buy now
        </button>
      </div>

      {justAdded !== null ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          className="added-panel"
          role="status"
          aria-live="polite"
        >
          <div className="added-panel__msg">
            <span className="added-panel__check" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>
                {justAdded} {justAdded === 1 ? "copy" : "copies"} of {item.title} added to
                your cart
              </strong>
              <div className="shop-muted">
                Cart: {cartCount} {cartCount === 1 ? "item" : "items"} ·{" "}
                {formatPrice(cartSubtotal)}
              </div>
            </div>
          </div>
          <div className="added-panel__actions">
            <Link href="/foryou" className="shop-btn shop-btn--secondary">
              Continue shopping
            </Link>
            <Link href="/checkout" className="shop-btn shop-btn--primary">
              <CartIcon /> Go to cart &amp; checkout
            </Link>
          </div>
        </div>
      ) : (
        inCart > 0 && (
          <p className="book-buy__incart">
            {inCart} in your cart ·{" "}
            <Link href="/checkout" className="shop-link">
              View cart &amp; checkout
            </Link>
          </p>
        )
      )}
    </>
  );
}
