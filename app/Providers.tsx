"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { hydrate } from "@/lib/cart/cartSlice";
import { makeStore } from "@/lib/cart/store";

const STORAGE_KEY = "summarist-cart";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      store.dispatch(hydrate(saved ? JSON.parse(saved) : null));
    } catch {
      store.dispatch(hydrate(null));
    }

    return store.subscribe(() => {
      const { items, customer, paymentIntentId, hydrated } = store.getState().cart;
      if (!hydrated) return;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ items, customer, paymentIntentId }),
        );
      } catch {
        // Storage full or blocked — the cart still works for this visit.
      }
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
