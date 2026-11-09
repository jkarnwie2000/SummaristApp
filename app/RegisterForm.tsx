"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

type RegisterFormProps = {
  redirectTo?: string;
  /** Goes back to the login form inside the same modal. */
  onSwitchToLogin?: () => void;
};

const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

export default function RegisterForm({ redirectTo = "/foryou", onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Enter your email address.");
    if (password.length < 6) return setError("Use at least 6 characters for your password.");
    if (password !== confirmPassword) return setError("The passwords don't match.");

    setPending(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.push(redirectTo);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(MESSAGES[code] ?? "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-form-container">
      <h3>Sign up to Summarist</h3>
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-login"
          placeholder="Email Address"
          autoComplete="email"
          aria-label="Email address"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-login"
          placeholder="Password"
          autoComplete="new-password"
          aria-label="Password"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-login"
          placeholder="Confirm Password"
          autoComplete="new-password"
          aria-label="Confirm password"
        />
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-login btn-login--primary" disabled={pending}>
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <div className="form__btns">
        <button type="button" className="sign-up" onClick={onSwitchToLogin}>
          Already have an account?
        </button>
      </div>
    </div>
  );
}
