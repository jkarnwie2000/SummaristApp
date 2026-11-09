"use client";

import { useActionState } from "react";
import { updateStock } from "./actions";

export default function StockForm({
  bookId,
  stock,
  title,
}: {
  bookId: string;
  stock: number;
  title: string;
}) {
  const [state, action, pending] = useActionState(updateStock, null);
  return (
    <form action={action} className="admin-stock">
      <input type="hidden" name="bookId" value={bookId} />
      <input
        // Re-mount with the new value after a save or sale.
        key={stock}
        className="shop-input admin-stock__input"
        type="number"
        name="stock"
        min={0}
        step={1}
        defaultValue={stock}
        aria-label={`Stock for ${title}`}
      />
      <button className="shop-btn shop-btn--secondary admin-stock__btn" disabled={pending}>
        {pending ? "…" : "Save"}
      </button>
      <span
        className={state?.error ? "shop-field__error" : "admin-stock__ok"}
        aria-live="polite"
      >
        {state?.error ?? (state?.ok && !pending ? "✓" : "")}
      </span>
    </form>
  );
}
