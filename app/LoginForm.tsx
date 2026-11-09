"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import LoginIcon from "./components/LoginIcon";
import GoogleIcon from "./components/GoogleIcon";

type LoginFormProps = {
  redirectTo?: string;
  /** Opens the sign-up form inside the same modal. */
  onSwitchToSignUp?: () => void;
};

export default function LoginForm({ redirectTo = "/foryou", onSwitchToSignUp }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");    
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();


  try {    
    
    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      console.log("Email is empty");
      return;
    }

    const result = await signInWithEmailAndPassword(
      auth,
      cleanedEmail,
      password
    );

    console.log("Login successful:", result.user);
    router.push(redirectTo);
  } 
  
    catch (error) {
    console.error("Login error:", error);
  }
};

  return (
    <div className="login-form-container">
      <h3>Login to Summarist</h3>
      <form onSubmit={handleSubmit} className="login-form">
        <button
          type="button"
          className="btn-login login-guest"
          onClick={() => {
            localStorage.setItem("summaristGuest", "true");
            router.push(redirectTo);
          }}
        >
          <span className="guest-icon">
            <LoginIcon />
          </span>
          Login as Guest
        </button>

        <div className="form-divider--wrapper">
          <div className="form-divider" />
          <p>or</p>
          <div className="form-divider" />
        </div>

        <button className="btn-login login-google" onClick={() => alert("Google login not implemented yet")} >
          <span className="google-icon">
            <GoogleIcon />
          </span>
          Login with Google
        </button>

        <div className="form-divider--wrapper">
          <div className="form-divider" />
          <p>or</p>
          <div className="form-divider" />
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-login"
          placeholder="Email Address"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-login"
          placeholder="Password"
        />

        <button type="submit" className="btn-login btn-login--primary">
          Login
        </button>
      </form>
      <div className="form__btns">
        <button type="button">Forgot your password?</button>
        <button type="button" className="sign-up" onClick={onSwitchToSignUp}>
          Don&apos;t have an account?
        </button>
      </div>
    </div>
  );
}

