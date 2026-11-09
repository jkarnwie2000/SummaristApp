import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminConfigured, currentAdmin } from "@/lib/admin-auth";
import AuthCard from "./AuthCard";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect("/admin");

  return (
    <AuthCard
      title="Admin sign in"
      subtitle="Sign in to manage sales, inventory and transactions."
      footer={
        <>
          New admin? <Link href="/admin/signup" className="shop-link">Create an account</Link>
          <span className="admin-login__sep" aria-hidden="true">·</span>
          <Link href="/" className="shop-link">Back to store</Link>
        </>
      }
    >
      {!adminConfigured() && (
        <p className="shop-alert shop-alert--error">
          No admin emails are approved yet. Add them to <code>ADMIN_EMAILS</code> in the
          server environment.
        </p>
      )}
      <LoginForm />
    </AuthCard>
  );
}
