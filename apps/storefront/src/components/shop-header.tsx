"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { WaslaMark } from "@/components/wasla-mark";

// Fixed top bar shown above every screen's content — logo/wordmark on one
// side, cart shortcut with a live item-count badge on the other. Bottom
// tabs (NavHeader) still own primary navigation; this is brand chrome.
export function ShopHeader() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper-raised/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <WaslaMark size={26} />
        <span className="text-base font-extrabold tracking-tight text-ink">Waslak</span>
      </div>
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
  );
}
