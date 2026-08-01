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
        {status === "loading" ? "جارٍ التحميل…" : "جارٍ التوجيه إلى تسجيل الدخول…"}
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen">
        {customer && !isApproved && (
          <div className="border-b border-warning bg-warning/10 px-4 py-3 text-center text-sm text-warning">
            {customer.status === "PENDING_APPROVAL"
              ? "حسابك بانتظار الموافقة. يمكنك تصفح المنتجات الآن، وستتمكن من إرسال الطلبات بمجرد الموافقة على حسابك."
              : "لا يمكن لحسابك حاليًا إرسال الطلبات. تواصل مع الموزع الخاص بك لمزيد من التفاصيل."}
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">{children}</main>
        <NavHeader />
      </div>
    </CartProvider>
  );
}
