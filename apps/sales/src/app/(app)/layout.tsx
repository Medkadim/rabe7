"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { WaslaMark } from "@/components/wasla-mark";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية" },
  { href: "/clients", label: "العملاء" },
  { href: "/orders/new", label: "طلب جديد" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        {status === "loading" ? "جارٍ التحميل…" : "جارٍ التوجيه إلى تسجيل الدخول…"}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <WaslaMark size={22} />
            <span className="font-display text-sm font-semibold text-ink">وصلة — المندوب</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && <span className="hidden text-sm text-muted sm:inline">{user.email}</span>}
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              تسجيل الخروج
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-2xl gap-1 px-4 pb-2">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-brand-soft hover:text-ink",
                  active && "bg-brand-soft text-brand-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
