import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="admin-login">
      <div className="admin-card admin-login__card">
        <h1 className="admin-title">Summarist Admin</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="shop-alert shop-alert--error">
            Admin access is turned off. Set <code>ADMIN_PASSWORD</code> in
            <code> .env.local</code> and restart the server.
          </p>
        )}
      </div>
    </main>
  );
}
