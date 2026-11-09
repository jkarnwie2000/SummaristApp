"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { adminLogin } from "../actions";
import { authMessage, EMAIL_RE } from "./authErrors";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setUnverifiedUser(null);
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");

    setPending(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      const result = await adminLogin(await user.getIdToken());
      if ("ok" in result) {
        // The dashboard uses its own session cookie; end the Firebase browser session.
        await signOut(auth);
        router.push("/admin");
        router.refresh();
        return;
      }
      if (result.error === "unverified") {
        setUnverifiedUser(user);
        setError("Verify your email address first. Check your inbox for the link.");
        return;
      }
      await signOut(auth);
      setError(
        result.error === "not-approved"
          ? "This account isn't approved for admin access. Ask the site owner to add your email."
          : "We couldn't confirm your sign-in. Please try again.",
      );
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setPending(false);
    }
  };

  const resendVerification = async () => {
    if (!unverifiedUser) return;
    try {
      await sendEmailVerification(unverifiedUser);
      await signOut(auth);
      setUnverifiedUser(null);
      setError(null);
      setNotice(`Verification email sent to ${unverifiedUser.email}.`);
    } catch (err) {
      setError(authMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="admin-login__form" noValidate>
      <label className="shop-field">
        <span className="shop-field__label">Email address</span>
        <input
          className="shop-input"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label className="shop-field">
        <span className="admin-login__label-row">
          <span className="shop-field__label">Password</span>
          <Link href="/admin/forgot-password" className="shop-link admin-login__small">
            Forgot password?
          </Link>
        </span>
        <input
          className="shop-input"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && (
        <p className="shop-field__error" role="alert">
          {error}{" "}
          {unverifiedUser && (
            <button type="button" className="shop-link" onClick={resendVerification}>
              Resend verification email
            </button>
          )}
        </p>
      )}
      {notice && (
        <p className="admin-login__notice" role="status">
          {notice}
        </p>
      )}

      <button className="shop-btn shop-btn--primary shop-btn--block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
