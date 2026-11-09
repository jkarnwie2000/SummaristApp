"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, MAX_QUANTITY } from "@/lib/catalog";
import { removeItem, setCustomer, setQuantity } from "@/lib/cart/cartSlice";
import { selectCartItems, useAppDispatch, useAppSelector } from "@/lib/cart/store";
import type { Customer } from "@/lib/types";
import { TrashIcon } from "../../components/icons";
import OrderSummary from "./OrderSummary";

const EMPTY_CUSTOMER: Customer = {
  name: "",
  email: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["NG", "Nigeria"],
  ["LR", "Liberia"],
  ["GH", "Ghana"],
] as const;

export default function CheckoutPage() {
  const items = useAppSelector(selectCartItems);
  const hydrated = useAppSelector((s) => s.cart.hydrated);
  const saved = useAppSelector((s) => s.cart.customer);

  if (!hydrated) {
    return (
      <div className="row">
        <div className="container">
          <div className="skeleton skeleton-for-you-section-title"></div>
          <div className="skeleton shop-skeleton-block"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="row">
        <div className="container">
          <h1 className="shop-title">Checkout</h1>
          <div className="shop-card shop-empty">
            <p>Your cart is empty.</p>
            <Link href="/foryou" className="shop-btn shop-btn--primary">
              Browse books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Key on the saved customer so the form picks up details loaded from storage.
  return <CheckoutForm key={saved?.email ?? "new"} initial={saved ?? EMPTY_CUSTOMER} />;
}

function CheckoutForm({ initial }: { initial: Customer }) {
  const items = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [form, setForm] = useState<Customer>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});

  const update =
    (field: keyof Customer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (!form.address.trim()) next.address = "Enter your street address.";
    if (!form.city.trim()) next.city = "Enter your city.";
    if (!form.postalCode.trim()) next.postalCode = "Enter your postal code.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(
      setCustomer(
        Object.fromEntries(
          Object.entries(form).map(([k, v]) => [k, v.trim()]),
        ) as Customer,
      ),
    );
    router.push("/payment");
  };

  const field = (
    name: keyof Customer,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="shop-field">
      <span className="shop-field__label">{label}</span>
      <input
        className={`shop-input ${errors[name] ? "shop-input--error" : ""}`}
        value={form[name]}
        onChange={update(name)}
        aria-invalid={Boolean(errors[name])}
        {...props}
      />
      {errors[name] && <span className="shop-field__error">{errors[name]}</span>}
    </label>
  );

  return (
    <div className="row">
      <div className="container">
        <ol className="shop-steps" aria-label="Checkout steps">
          <li className="shop-steps__item shop-steps__item--active">1. Cart &amp; details</li>
          <li className="shop-steps__item">2. Payment</li>
          <li className="shop-steps__item">3. Confirmation</li>
        </ol>
        <h1 className="shop-title">Checkout</h1>

        <div className="shop-layout">
          <div className="shop-layout__main">
            <section className="shop-card" aria-label="Cart">
              <h2 className="shop-card__title">Your cart</h2>
              <ul className="shop-cart">
                {items.map((item) => (
                  <li className="shop-cart__item" key={item.bookId}>
                    <Link href={`/book/${item.bookId}`} className="shop-cart__img">
                      <Image src={item.imageLink} alt="" width={64} height={64} />
                    </Link>
                    <div className="shop-cart__info">
                      <Link href={`/book/${item.bookId}`} className="shop-cart__title">
                        {item.title}
                      </Link>
                      <div className="shop-muted">{item.author}</div>
                      <div className="shop-muted">{formatPrice(item.price)} each</div>
                    </div>
                    <select
                      className="shop-input shop-cart__qty"
                      aria-label={`Quantity of ${item.title}`}
                      value={item.quantity}
                      onChange={(e) =>
                        dispatch(
                          setQuantity({ bookId: item.bookId, quantity: Number(e.target.value) }),
                        )
                      }
                    >
                      {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <div className="shop-cart__line">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button
                      className="shop-icon-btn"
                      onClick={() => dispatch(removeItem(item.bookId))}
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <form className="shop-card" onSubmit={submit} noValidate id="checkout-form">
              <h2 className="shop-card__title">Contact &amp; shipping</h2>
              <div className="shop-grid">
                {field("name", "Full name", { autoComplete: "name" })}
                {field("email", "Email", { type: "email", autoComplete: "email" })}
                <div className="shop-grid__full">
                  {field("address", "Street address", { autoComplete: "street-address" })}
                </div>
                {field("city", "City", { autoComplete: "address-level2" })}
                {field("state", "State / Province (optional)", {
                  autoComplete: "address-level1",
                })}
                {field("postalCode", "Postal code", { autoComplete: "postal-code" })}
                <label className="shop-field">
                  <span className="shop-field__label">Country</span>
                  <select
                    className="shop-input"
                    value={form.country}
                    onChange={update("country")}
                    autoComplete="country"
                  >
                    {COUNTRIES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </form>
          </div>

          <OrderSummary items={items}>
            <button type="submit" form="checkout-form" className="shop-btn shop-btn--primary shop-btn--block">
              Continue to payment
            </button>
            <Link href="/foryou" className="shop-link">
              Continue shopping
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
