"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";

export default function Settings() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setEmail(user?.email ?? null);
        setReady(true);
      }),
    [],
  );

  return (
    <div className="container settings__container">
      <div className="row">
        <h1 className="section__title page__title">Settings</h1>
        <div className="setting__content">
          <div className="settings__sub--title">Your Subscription plan</div>
          <div className="settings__text">Basic</div>
          <a className="btn settings__upgrade--btn" href="/choose-plan">
            Upgrade to Premium
          </a>
        </div>
        <div className="setting__content">
          <div className="settings__sub--title">Email</div>
          <div className="settings__text">
            {!ready ? "…" : (email ?? "Guest account")}
          </div>
        </div>
      </div>
    </div>
  );
}
