"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/admin-auth";
import { getStore } from "@/lib/store";

export type ActionState = { error?: string; ok?: string } | null;

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Incorrect password." };
  }
  await startAdminSession();
  redirect("/admin");
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

  const deleted = await getStore().deleteOrder(id, restock);
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

  await getStore().setStock(bookId, stock);
  revalidatePath("/admin");
  revalidatePath("/book/[id]", "page");
  return { ok: "Saved" };
}
