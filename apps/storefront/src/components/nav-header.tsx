"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { WaslaMark } from "@/components/wasla-mark";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/favorites", label: "Favorites" },
  { href: "/orders", label: "My orders" },
  { href: "/account", label: "Account" },
];

export function NavHeader() {
  const pathname = usePathname();
  const { user, customer, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-line bg-paper-raised">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:h-14 sm:py-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/catalog" className="flex items-center gap-2">
            <WaslaMark size={20} />
            <span className="font-display text-sm font-semibold text-ink">Wasla</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm text-muted hover:text-ink",
                  pathname.startsWith(link.href) && "font-medium text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="text-sm text-muted hover:text-ink">
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
          <span className="hidden text-sm text-ink sm:inline">{customer?.name ?? user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
