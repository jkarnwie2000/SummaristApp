import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "../login/AuthCard";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Create admin account", robots: { index: false } };

export default function AdminSignupPage() {
  return (
    <AuthCard
      title="Create an admin account"
      subtitle="After you verify your email, you can sign in once the site owner has approved your address."
      footer={
        <>
          Already have an account? <Link href="/admin/login" className="shop-link">Sign in</Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
