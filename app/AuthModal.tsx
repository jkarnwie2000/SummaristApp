"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type AuthModalProps = {
  onClose: () => void;
  redirectTo?: string;
};

export default function AuthModal({ onClose, redirectTo }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div
      className="auth-container"
      role="dialog"
      aria-modal="true"
      aria-label={isLogin ? "Log in to Summarist" : "Create a Summarist account"}
    >
      <button onClick={onClose} className="btn-close" aria-label="Close">
        &times;
      </button>

      {isLogin ? (
        <LoginForm redirectTo={redirectTo} onSwitchToSignUp={() => setIsLogin(false)} />
      ) : (
        <RegisterForm redirectTo={redirectTo} onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}
