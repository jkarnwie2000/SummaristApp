import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MAX_QUANTITY } from "../catalog";
import type { CartItem, Customer } from "../types";

export type CartState = {
  items: CartItem[];
  customer: Customer | null;
  /** PaymentIntent from the last visit to /payment, re-used instead of creating a new one. */
  paymentIntentId: string | null;
  /** False until the saved cart has been loaded from localStorage. */
  hydrated: boolean;
};

const initialState: CartState = {
  items: [],
  customer: null,
  paymentIntentId: null,
  hydrated: false,
};

const clamp = (n: number) => Math.max(1, Math.min(MAX_QUANTITY, Math.floor(n)));

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<CartState> | null>) {
      if (action.payload) {
        state.items = action.payload.items ?? [];
        state.customer = action.payload.customer ?? null;
        state.paymentIntentId = action.payload.paymentIntentId ?? null;
      }
      state.hydrated = true;
    },
    addItem(
      state,
      action: PayloadAction<Omit<CartItem, "quantity"> & { quantity?: number }>,
    ) {
      const { quantity = 1, ...item } = action.payload;
      const existing = state.items.find((i) => i.bookId === item.bookId);
      if (existing) existing.quantity = clamp(existing.quantity + quantity);
      else state.items.push({ ...item, quantity: clamp(quantity) });
    },
    setQuantity(state, action: PayloadAction<{ bookId: string; quantity: number }>) {
      const item = state.items.find((i) => i.bookId === action.payload.bookId);
      if (item) item.quantity = clamp(action.payload.quantity);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.bookId !== action.payload);
    },
    setCustomer(state, action: PayloadAction<Customer>) {
      state.customer = action.payload;
    },
    setPaymentIntentId(state, action: PayloadAction<string | null>) {
      state.paymentIntentId = action.payload;
    },
    /** After a successful payment: empty the cart but remember contact details. */
    clearCart(state) {
      state.items = [];
      state.paymentIntentId = null;
    },
  },
});

export const {
  hydrate,
  addItem,
  setQuantity,
  removeItem,
  setCustomer,
  setPaymentIntentId,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
