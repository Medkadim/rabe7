"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { WaslaMark } from "@/components/wasla-mark";

const MENU_LINKS = [
  { href: "/catalog", label: "الرئيسية" },
  { href: "/orders", label: "طلباتي" },
  { href: "/favorites", label: "المفضلة" },
  { href: "/account", label: "حسابي" },
];

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

// Fixed top bar shown above every screen's content: a hamburger menu on
// one side (opens a slide-in drawer for the links that don't fit the
// bottom tab bar, plus sign-out), a circular brand badge centered, and the
// cart shortcut with a live item-count badge — matching the layout of the
// storefronts this catalog is meant to feel as fast and familiar as.
export function ShopHeader() {
  const { items } = useCart();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* dir="ltr" here is deliberate: this row's icon order (menu, badge,
          cart) is a fixed physical layout, not something that should
          mirror under the page's RTL flow like the Arabic content does. */}
      <header
        dir="ltr"
        className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper-raised/95 px-4 backdrop-blur"
      >
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="القائمة"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink"
        >
          <MenuIcon />
        </button>

        <Link
          href="/catalog"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand"
          aria-label="Waslak"
        >
          <WaslaMark size={20} />
        </Link>

        <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-paper text-ink">
          <svg viewBox="0 0 24 24" width={19} height={19} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h2l2.2 11.4a2 2 0 002 1.6h7.6a2 2 0 002-1.6L20 8H6" />
            <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col gap-1 bg-paper-raised p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-2 px-1">
              <WaslaMark size={24} />
              <span className="text-base font-extrabold tracking-tight text-ink">Waslak</span>
            </div>
            {MENU_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-ink hover:bg-brand-soft"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
              className="mt-2 rounded-[10px] px-3 py-2.5 text-right text-sm font-medium text-critical hover:bg-critical/10"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </>
  );
}
