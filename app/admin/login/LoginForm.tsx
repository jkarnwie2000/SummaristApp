"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="admin-login__form">
      <label className="shop-field">
        <span className="shop-field__label">Password</span>
        <input
          className="shop-input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </label>
      {state?.error && (
        <p className="shop-field__error" role="alert">
          {state.error}
        </p>
      )}
      <button className="shop-btn shop-btn--primary shop-btn--block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
