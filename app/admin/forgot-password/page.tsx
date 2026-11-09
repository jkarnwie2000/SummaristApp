"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import AuthCard from "../login/AuthCard";
import { authMessage, EMAIL_RE } from "../login/authErrors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address.");
    setPending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // Don't reveal whether an account exists for this email.
      if (code === "auth/user-not-found") setSent(true);
      else setError(authMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a link to choose a new password."
      footer={
        <>
          Remembered it? <Link href="/admin/login" className="shop-link">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="admin-login__notice" role="status">
          <p>
            If an account exists for <strong>{email.trim()}</strong>, a password reset link
            is on its way. Check your inbox (and spam folder).
          </p>
          <Link href="/admin/login" className="shop-btn shop-btn--primary shop-btn--block">
            Back to sign in
          </Link>
        </div>
      ) : (
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
          {error && (
            <p className="shop-field__error" role="alert">
              {error}
            </p>
          )}
          <button className="shop-btn shop-btn--primary shop-btn--block" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
