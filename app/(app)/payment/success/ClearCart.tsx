"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart/cartSlice";
import { useAppDispatch, useAppSelector } from "@/lib/cart/store";

/** Empties the cart once the order is confirmed. */
export default function ClearCart() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((s) => s.cart.hydrated);
  useEffect(() => {
    if (hydrated) dispatch(clearCart());
  }, [hydrated, dispatch]);
  return null;
}
