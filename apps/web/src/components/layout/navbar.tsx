"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/repas", label: "Nos repas" },
  { href: "/comment-ca-marche", label: "Comment ça marche ?" },
  { href: "/a-propos", label: "À propos" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1 text-sm font-medium text-ink-soft transition-colors hover:text-green-800",
                  active && "text-green-800",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-green-600 transition-transform duration-300",
                    active && "scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <Link href="/prix" className={cn(buttonVariants({ size: "sm" }), "hidden lg:inline-flex")}>
          S&apos;abonner
        </Link>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-green-900 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-cream px-5 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-3 text-sm font-medium text-ink-soft hover:bg-green-50 hover:text-green-800",
                  pathname === link.href && "bg-green-50 text-green-800",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/prix"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ size: "sm" }), "mt-4 w-full")}
          >
            S&apos;abonner
          </Link>
        </div>
      )}
    </header>
  );
}
