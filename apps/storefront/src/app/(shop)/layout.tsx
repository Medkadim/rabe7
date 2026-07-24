"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { NavHeader } from "@/components/nav-header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { status, customer, isApproved } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        {status === "loading" ? "Loading…" : "Redirecting to sign in…"}
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen">
        <NavHeader />
        {customer && !isApproved && (
          <div className="border-b border-warning bg-warning/10 px-4 py-3 text-center text-sm text-warning">
            {customer.status === "PENDING_APPROVAL"
              ? "Your account is waiting for approval. You can browse the catalog now, and you'll be able to place orders once it's approved."
              : "Your account is not currently able to place orders. Contact your distributor for details."}
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>
    </CartProvider>
  );
}
