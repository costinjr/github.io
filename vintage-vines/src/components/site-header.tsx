"use client";

import Link from "next/link";
import { useState } from "react";
import { business } from "@/config/business";
import { headerCta, primaryNav } from "@/config/routes";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-serif text-lg font-semibold tracking-tight text-ink"
          onClick={() => setMenuOpen(false)}
        >
          {business.name}
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 md:flex"
        >
          {primaryNav.map((link) => (
            <Link
              key={link.label}
              href={link.path}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-green"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={headerCta.path}
            className="hidden min-h-11 items-center rounded-sm border border-green px-4 text-sm font-medium text-green transition-colors hover:bg-green hover:text-cream md:inline-flex"
          >
            {headerCta.label}
          </Link>

          <Link
            href={headerCta.path}
            className="inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream md:hidden"
          >
            See what&apos;s available
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-ink md:hidden"
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
            >
              {menuOpen ? (
                <path
                  d="M4 4l14 14M18 4L4 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path d="M2 6h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M2 11h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M2 16h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line bg-cream px-4 pb-4 md:hidden"
        >
          <ul className="flex flex-col">
            {primaryNav.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.path}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center text-base font-medium text-ink-soft"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
