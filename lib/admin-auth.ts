import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/*
 * Admin access = a Firebase Authentication account whose email is VERIFIED and
 * listed in ADMIN_EMAILS. Anyone can create an account on /admin/signup, but only
 * approved, verified emails can open the dashboard.
 *
 * After Firebase confirms the sign-in, the server issues its own signed,
 * httpOnly session cookie, checked on every admin page and action.
 */

const COOKIE = "summarist_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
/** Firebase project the website's sign-in uses (see firebaseConfig.js). */
const AUTH_PROJECT_ID =
  process.env.FIREBASE_AUTH_PROJECT_ID || "advanced-virtual-interns-998ef";

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

/** Approved admin emails from ADMIN_EMAILS (comma separated). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isApprovedAdmin(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().includes(email!.toLowerCase());
}

export function adminConfigured() {
  return adminEmails().length > 0 && Boolean(secret());
}

function sign(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Verifies a Firebase ID token from the browser and returns who signed in. */
export async function verifyFirebaseIdToken(idToken: string) {
  const { initializeApp, getApps } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  // Verifying ID tokens only needs the project id (Google's public keys are used).
  const app =
    getApps().find((a) => a.name === "summarist-auth") ??
    initializeApp({ projectId: AUTH_PROJECT_ID }, "summarist-auth");
  const decoded = await getAuth(app).verifyIdToken(idToken);
  return { email: decoded.email ?? null, emailVerified: decoded.email_verified === true };
}

export async function startAdminSession(email: string) {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET (or ADMIN_PASSWORD) is not set.");
  const expires = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const who = Buffer.from(email.toLowerCase()).toString("base64url");
  const payload = `${expires}.${who}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

/** The signed-in admin's email, or null. Removing an email from ADMIN_EMAILS revokes access. */
export async function currentAdmin(): Promise<string | null> {
  const key = secret();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!key || !value) return null;
  const [expires, who, signature] = value.split(".");
  if (!expires || !who || !signature || Number(expires) < Date.now()) return null;
  if (!safeEqual(signature, sign(`${expires}.${who}`, key))) return null;
  const email = Buffer.from(who, "base64url").toString();
  return isApprovedAdmin(email) ? email : null;
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<string> {
  const email = await currentAdmin();
  if (!email) redirect("/admin/login");
  return email;
}
