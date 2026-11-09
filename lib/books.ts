import "server-only";
import { durationFor, priceFor } from "./catalog";
import type { Book, ShopBook } from "./types";

const API = "https://us-central1-summaristt.cloudfunctions.net";
/** Book data rarely changes — cache API responses for an hour. */
const REVALIDATE_SECONDS = 3600;

export type BookStatus = "selected" | "recommended" | "suggested";

function withShopData(book: Book): ShopBook {
  return { ...book, price: priceFor(book.id), duration: durationFor(book.id) };
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["books"] },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

export async function getBooks(status: BookStatus): Promise<ShopBook[]> {
  const books = await getJson<Book[]>(`/getBooks?status=${status}`);
  return (books ?? []).map(withShopData);
}

export async function getBook(id: string): Promise<ShopBook | null> {
  const book = await getJson<Book>(`/getBook?id=${encodeURIComponent(id)}`);
  return book && book.id ? withShopData(book) : null;
}

/** Every book in the store (the three API lists, de-duplicated). */
export async function getAllBooks(): Promise<ShopBook[]> {
  const lists = await Promise.all([
    getBooks("selected"),
    getBooks("recommended"),
    getBooks("suggested"),
  ]);
  const byId = new Map<string, ShopBook>();
  for (const book of lists.flat()) byId.set(book.id, book);
  return [...byId.values()];
}
