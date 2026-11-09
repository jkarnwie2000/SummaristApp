"use client";

import { useActionState, useRef } from "react";
import { deleteTransaction } from "./actions";
import { TrashIcon } from "../components/icons";

/** Delete button with a confirmation dialog (and an option to put the copies back in stock). */
export default function DeleteTransaction({ id, label }: { id: string; label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(deleteTransaction, null);

  return (
    <>
      <button
        className="shop-icon-btn admin-delete"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Delete transaction ${label}`}
        title="Delete transaction"
      >
        <TrashIcon />
      </button>
      {state?.error && <span className="shop-field__error">{state.error}</span>}

      <dialog ref={dialogRef} className="admin-dialog">
        <form action={action} onSubmit={() => dialogRef.current?.close()}>
          <h3 className="admin-card__title">Delete this transaction?</h3>
          <p>{label}</p>
          <p className="shop-muted">
            This removes the record from the dashboard. It does <strong>not</strong> refund
            the customer — issue refunds from the Stripe dashboard.
          </p>
          <input type="hidden" name="id" value={id} />
          <label className="admin-dialog__check">
            <input type="checkbox" name="restock" defaultChecked /> Put the copies back
            in stock
          </label>
          <div className="admin-dialog__actions">
            <button
              type="button"
              className="shop-btn shop-btn--secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="shop-btn shop-btn--danger" disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
