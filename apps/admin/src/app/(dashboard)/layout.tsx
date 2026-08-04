"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavSidebar } from "@/components/nav-sidebar";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
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
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-paper-raised px-7">
          <div className="text-sm font-medium capitalize text-muted">
            {user?.roles.join(", ").replace(/_/g, " ").toLowerCase()}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
