"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { selectCartCount, useAppSelector } from "@/lib/cart/store";
import type { Book } from "@/lib/types";
import {
  BookmarkIcon,
  CartIcon,
  HelpIcon,
  HighlightIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
} from "./icons";

const SEARCH_API =
  "https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search=";

function SearchBar({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const pathname = usePathname();
  // The query remembers which page it was typed on, so it clears itself on navigation.
  const [input, setInput] = useState({ text: "", path: pathname });
  const [focused, setFocused] = useState(false);
  const [found, setFound] = useState<{ term: string; books: Book[] }>({ term: "", books: [] });

  const query = input.path === pathname ? input.text : "";
  const term = query.trim();
  const open = focused && term !== "";
  const loading = term !== "" && found.term !== term;
  const results = found.books;

  // Debounced search; aborts stale requests so results never arrive out of order.
  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(SEARCH_API + encodeURIComponent(term), {
          signal: controller.signal,
        });
        const text = await res.text();
        setFound({ term, books: text ? JSON.parse(text) : [] });
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFound({ term, books: [] });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  return (
    <div className="search">
      <div className="search__input--wrapper">
        <input
          ref={inputRef}
          className="search__input"
          placeholder="Search for books"
          type="search"
          aria-label="Search for books by title or author"
          value={query}
          onChange={(e) => {
            setInput({ text: e.target.value, path: pathname });
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === "Escape" && setFocused(false)}
        />
        <div className="search__icon">
          <SearchIcon />
        </div>
      </div>
      {open && (
        <div className="search__results" role="listbox">
          {loading ? (
            <div className="search__results--empty">Searching…</div>
          ) : results.length === 0 ? (
            <div className="search__results--empty">No books found</div>
          ) : (
            results.map((book) => (
              <Link key={book.id} href={`/book/${book.id}`} className="search__result">
                <Image
                  src={book.imageLink}
                  alt=""
                  width={48}
                  height={48}
                  className="search__result--img"
                />
                <span>
                  <span className="search__result--title">{book.title}</span>
                  <span className="search__result--author">{book.author}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Open state is tied to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const sidebarOpen = openOn === pathname;
  const setSidebarOpen = (open: boolean) => setOpenOn(open ? pathname : null);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const cartCount = useAppSelector(selectCartCount);
  const hydrated = useAppSelector((s) => s.cart.hydrated);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    localStorage.removeItem("summaristGuest");
    await signOut(auth).catch(() => undefined);
    router.push("/");
  };

  const navLink = (href: string, label: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <Link
      className={`sidebar__link--wrapper ${isActive(href) ? "active" : ""}`}
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
    >
      <div className={`sidebar__link--line ${isActive(href) ? "active--tab" : ""}`}></div>
      <div className="sidebar__icon--wrapper">{icon}</div>
      <div className="sidebar__link--text">{label}</div>
      {extra}
    </Link>
  );

  return (
    <div id="__next">
      <div className="wrapper">
        <div className="search__background">
          <div className="search__wrapper">
            <div className="search__content">
              <SearchBar inputRef={searchRef} />
              <button
                className="sidebar__toggle--btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
                aria-expanded={sidebarOpen}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`sidebar__overlay ${sidebarOpen ? "" : "sidebar__overlay--hidden"}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        <nav
          className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}
          aria-label="Main"
        >
          <div className="sidebar__logo">
            <Link href="/" aria-label="Summarist home page">
              <Image src="/logo.png" alt="Summarist" width={160} height={40} preload />
            </Link>
          </div>
          <div className="sidebar__wrapper">
            <div className="sidebar__top">
              {navLink("/foryou", "For you", <HomeIcon />)}
              {navLink("/library", "My Library", <BookmarkIcon />)}
              {navLink(
                "/checkout",
                "Cart",
                <CartIcon />,
                hydrated && cartCount > 0 ? (
                  <span className="sidebar__badge" aria-label={`${cartCount} items in cart`}>
                    {cartCount}
                  </span>
                ) : null,
              )}
              <div className="sidebar__link--wrapper sidebar__link--not-allowed">
                <div className="sidebar__link--line"></div>
                <div className="sidebar__icon--wrapper">
                  <HighlightIcon />
                </div>
                <div className="sidebar__link--text">Highlights</div>
              </div>
              <button
                className="sidebar__link--wrapper"
                onClick={() => {
                  setSidebarOpen(false);
                  searchRef.current?.focus();
                }}
              >
                <div className="sidebar__link--line"></div>
                <div className="sidebar__icon--wrapper">
                  <SearchIcon />
                </div>
                <div className="sidebar__link--text">Search</div>
              </button>
            </div>
            <div className="sidebar__bottom">
              {navLink("/settings", "Settings", <SettingsIcon />)}
              <div className="sidebar__link--wrapper sidebar__link--not-allowed">
                <div className="sidebar__link--line"></div>
                <div className="sidebar__icon--wrapper">
                  <HelpIcon />
                </div>
                <div className="sidebar__link--text">Help &amp; Support</div>
              </div>
              <button className="sidebar__link--wrapper" onClick={handleLogout}>
                <div className="sidebar__link--line"></div>
                <div className="sidebar__icon--wrapper">
                  <LogoutIcon />
                </div>
                <div className="sidebar__link--text">Log out</div>
              </button>
            </div>
          </div>
        </nav>

        {children}
      </div>
    </div>
  );
}
