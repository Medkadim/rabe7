"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

// One tab per destination, not one per page — /catalog doubles as the app's
// home screen (the root route redirects there), so there is no separate
// "home" tab pointing at the same content.
const TABS = [
  { href: "/catalog", label: "الرئيسية", icon: HomeIcon },
  { href: "/favorites", label: "المفضلة", icon: FavoritesIcon },
  { href: "/cart", label: "السلة", icon: CartIcon },
  { href: "/orders", label: "طلباتي", icon: OrdersIcon },
  { href: "/account", label: "حسابي", icon: AccountIcon },
] as const;

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" />
    </svg>
  );
}
function FavoritesIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6.7-4.35-9.3-8.2C.8 9.6 1.9 5.9 5.1 4.9c2-.6 4 .2 5.1 1.8l1.8 2.5 1.8-2.5c1.1-1.6 3.1-2.4 5.1-1.8 3.2 1 4.3 4.7 2.4 7.9C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.2 11.4a2 2 0 002 1.6h7.6a2 2 0 002-1.6L20 8H6" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M9 10h6M9 14h6M9 18h3" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" />
    </svg>
  );
}

// Fixed to the bottom, mobile-app style — this is the app's only
// navigation chrome now, so every screen relies on it to get around.
export function NavHeader() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper-raised"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
                active ? "font-medium text-brand-ink" : "text-muted",
              )}
            >
              <span className="relative">
                <Icon />
                {href === "/cart" && cartCount > 0 && (
                  <span className="absolute -end-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-white">
                    {cartCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
