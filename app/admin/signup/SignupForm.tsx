"use client";

import Link from "next/link";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { authMessage, EMAIL_RE } from "../login/authErrors";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const address = email.trim();
    if (!EMAIL_RE.test(address)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirm) return setError("The passwords don't match.");

    setPending(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, address, password);
      await sendEmailVerification(user);
      await signOut(auth);
      setDone(address);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="admin-login__notice" role="status">
        <p>
          <strong>Account created.</strong> We sent a verification link to{" "}
          <strong>{done}</strong>. Open it, then sign in.
        </p>
        <p>
          Dashboard access is limited to approved emails. If you&apos;re not approved yet,
          ask the site owner to add your address.
        </p>
        <Link href="/admin/login" className="shop-btn shop-btn--primary shop-btn--block">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="admin-login__form" noValidate>
      <label className="shop-field">
        <span className="shop-field__label">Email address</span>
        <input
          className="shop-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label className="shop-field">
        <span className="shop-field__label">Password</span>
        <input
          className="shop-input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <span className="shop-muted admin-login__small">At least 8 characters.</span>
      </label>
      <label className="shop-field">
        <span className="shop-field__label">Confirm password</span>
        <input
          className="shop-input"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </label>
      {error && (
        <p className="shop-field__error" role="alert">
          {error}
        </p>
      )}
      <button className="shop-btn shop-btn--primary shop-btn--block" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
