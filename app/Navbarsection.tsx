"use client";

import Link from "next/link";

export default function Navbarsection() {
  return (
    <nav className="nav">
          <div className="nav__wrapper">
            <Link href="/" className="nav__img--mask" aria-label="Summarist home page">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="nav__img" src="/logo.png" alt="Summarist" />
            </Link>
            <ul className="nav__list--wrapper">
              <li className="nav__list nav__list--mobile">About</li>
              <li className="nav__list nav__list--mobile">Contact</li>
              <li className="nav__list nav__list--mobile">Help</li>
              <li className="nav__list nav__list--login">                
              </li>
            </ul>                       
        </div>
    </nav>
  );
}
