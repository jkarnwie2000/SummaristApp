"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  endAdminSession,
  isApprovedAdmin,
  requireAdmin,
  startAdminSession,
  verifyFirebaseIdToken,
} from "@/lib/admin-auth";
import { getStore } from "@/lib/store";

export type ActionState = { error?: string; ok?: string } | null;

/**
 * Called by the login form after Firebase has checked the email + password.
 * Starts the admin session, or returns an error code the form turns into a message.
 */
export async function adminLogin(
  idToken: string,
): Promise<{ ok: true } | { error: "invalid" | "unverified" | "not-approved" }> {
  let who: { email: string | null; emailVerified: boolean };
  try {
    who = await verifyFirebaseIdToken(idToken);
  } catch (error) {
    console.error("Admin token check failed", error);
    return { error: "invalid" };
  }
  if (!who.email || !isApprovedAdmin(who.email)) return { error: "not-approved" };
  if (!who.emailVerified) return { error: "unverified" };
  await startAdminSession(who.email);
  return { ok: true };
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function deleteTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const restock = formData.get("restock") === "on";
  if (!id) return { error: "Missing transaction id." };

  let deleted: boolean;
  try {
    deleted = await getStore().deleteOrder(id, restock);
  } catch (error) {
    console.error("Delete failed", error);
    return { error: "Couldn't reach order storage. Try again later." };
  }
  if (!deleted) return { error: "That transaction no longer exists." };

  revalidatePath("/admin");
  revalidatePath("/book/[id]", "page");
  return { ok: restock ? "Deleted and restocked." : "Deleted." };
}

export async function updateStock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const bookId = String(formData.get("bookId") ?? "");
  const stock = Number(formData.get("stock"));
  if (!bookId) return { error: "Missing book." };
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return { error: "Stock must be a whole number of 0 or more." };
  }

  try {
    await getStore().setStock(bookId, stock);
  } catch (error) {
    console.error("Stock update failed", error);
    return { error: "Couldn't save — order storage is unavailable." };
  }
  revalidatePath("/admin");
  revalidatePath("/book/[id]", "page");
  return { ok: "Saved" };
}
