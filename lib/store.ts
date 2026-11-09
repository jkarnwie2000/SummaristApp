import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_STOCK } from "./catalog";
import type { Order } from "./types";

/**
 * Orders + inventory persistence.
 *
 * - When FIREBASE_SERVICE_ACCOUNT_KEY is set, data lives in Firestore
 *   (collections `orders` and `inventory`). Use this in production — Vercel's
 *   filesystem is read-only, so the file store can't save there.
 * - Otherwise data lives in `.data/store.json`, which is fine for local dev.
 */
export interface Store {
  getInventory(bookIds: string[]): Promise<Record<string, number>>;
  setStock(bookId: string, stock: number): Promise<void>;
  /** Saves the order and takes its items out of stock. A repeat call with the same id does nothing. */
  recordOrder(order: Order): Promise<{ created: boolean }>;
  listOrders(): Promise<Order[]>;
  /** Deletes the order; with `restock`, its items go back into inventory. */
  deleteOrder(id: string, restock: boolean): Promise<boolean>;
}

/* ------------------------------ File store ------------------------------ */

type FileData = { orders: Order[]; inventory: Record<string, number> };

const DATA_FILE = path.join(process.cwd(), ".data", "store.json");

class FileStore implements Store {
  /** Serialises read-modify-write cycles so concurrent requests can't clobber each other. */
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<FileData> {
    try {
      const data = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
      return { orders: data.orders ?? [], inventory: data.inventory ?? {} };
    } catch {
      return { orders: [], inventory: {} };
    }
  }

  private async write(data: FileData) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, DATA_FILE);
  }

  private mutate<T>(fn: (data: FileData) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.read();
      const result = await fn(data);
      await this.write(data);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async getInventory(bookIds: string[]) {
    const { inventory } = await this.read();
    return Object.fromEntries(
      bookIds.map((id) => [id, inventory[id] ?? DEFAULT_STOCK]),
    );
  }

  setStock(bookId: string, stock: number) {
    return this.mutate((data) => {
      data.inventory[bookId] = stock;
    });
  }

  recordOrder(order: Order) {
    return this.mutate((data) => {
      if (data.orders.some((o) => o.id === order.id)) return { created: false };
      for (const item of order.items) {
        const current = data.inventory[item.bookId] ?? DEFAULT_STOCK;
        data.inventory[item.bookId] = Math.max(0, current - item.quantity);
      }
      data.orders.push(order);
      return { created: true };
    });
  }

  async listOrders() {
    const { orders } = await this.read();
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  deleteOrder(id: string, restock: boolean) {
    return this.mutate((data) => {
      const order = data.orders.find((o) => o.id === id);
      if (!order) return false;
      if (restock) {
        for (const item of order.items) {
          const current = data.inventory[item.bookId] ?? DEFAULT_STOCK;
          data.inventory[item.bookId] = current + item.quantity;
        }
      }
      data.orders = data.orders.filter((o) => o.id !== id);
      return true;
    });
  }
}

/* ---------------------------- Firestore store ---------------------------- */

class FirestoreStore implements Store {
  private dbPromise: Promise<FirebaseFirestore.Firestore>;

  constructor(serviceAccountJson: string) {
    this.dbPromise = (async () => {
      const { initializeApp, getApps, cert } = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");
      const app =
        getApps().find((a) => a.name === "summarist-store") ??
        initializeApp(
          { credential: cert(JSON.parse(serviceAccountJson)) },
          "summarist-store",
        );
      return getFirestore(app);
    })();
  }

  async getInventory(bookIds: string[]) {
    const db = await this.dbPromise;
    if (bookIds.length === 0) return {};
    const snaps = await db.getAll(
      ...bookIds.map((id) => db.collection("inventory").doc(id)),
    );
    return Object.fromEntries(
      snaps.map((snap) => [
        snap.id,
        snap.exists ? (snap.get("stock") as number) : DEFAULT_STOCK,
      ]),
    );
  }

  async setStock(bookId: string, stock: number) {
    const db = await this.dbPromise;
    await db.collection("inventory").doc(bookId).set({ stock });
  }

  async recordOrder(order: Order) {
    const db = await this.dbPromise;
    return db.runTransaction(async (tx) => {
      const orderRef = db.collection("orders").doc(order.id);
      if ((await tx.get(orderRef)).exists) return { created: false };

      const invRefs = order.items.map((i) =>
        db.collection("inventory").doc(i.bookId),
      );
      const invSnaps = invRefs.length ? await tx.getAll(...invRefs) : [];
      order.items.forEach((item, i) => {
        const snap = invSnaps[i];
        const current = snap.exists ? (snap.get("stock") as number) : DEFAULT_STOCK;
        tx.set(invRefs[i], { stock: Math.max(0, current - item.quantity) });
      });
      tx.set(orderRef, order);
      return { created: true };
    });
  }

  async listOrders() {
    const db = await this.dbPromise;
    const snap = await db.collection("orders").orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => d.data() as Order);
  }

  async deleteOrder(id: string, restock: boolean) {
    const db = await this.dbPromise;
    return db.runTransaction(async (tx) => {
      const orderRef = db.collection("orders").doc(id);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) return false;
      const order = orderSnap.data() as Order;

      if (restock && order.items.length) {
        const invRefs = order.items.map((i) =>
          db.collection("inventory").doc(i.bookId),
        );
        const invSnaps = await tx.getAll(...invRefs);
        order.items.forEach((item, i) => {
          const snap = invSnaps[i];
          const current = snap.exists ? (snap.get("stock") as number) : DEFAULT_STOCK;
          tx.set(invRefs[i], { stock: current + item.quantity });
        });
      }
      tx.delete(orderRef);
      return true;
    });
  }
}

/* -------------------------------------------------------------------------- */

const globalForStore = globalThis as unknown as { __summaristStore?: Store };

function isServiceAccount(key: string | undefined): boolean {
  if (!key) return false;
  try {
    const json = JSON.parse(key);
    return Boolean(json.project_id && json.client_email && json.private_key);
  } catch {
    return false;
  }
}

export function getStore(): Store {
  if (!globalForStore.__summaristStore) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    globalForStore.__summaristStore = isServiceAccount(key)
      ? new FirestoreStore(key!)
      : new FileStore();
    if (key && !isServiceAccount(key)) {
      console.error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is not a valid service account JSON " +
          "(needs project_id, client_email and private_key). Using the file store instead.",
      );
    }
  }
  return globalForStore.__summaristStore;
}
