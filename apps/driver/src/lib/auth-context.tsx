"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeAccessToken } from "./jwt";

export interface SessionUser {
  userId: string;
  tenantId: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  accessToken: string | null;
  user: SessionUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Drivers are staff accounts (DELIVERY_DRIVER role) — same email/password
// login the admin app uses, not the storefront's phone-based customer
// login. See apps/admin/src/lib/auth-context.tsx, which this mirrors.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ accessToken: null, user: null, status: "loading" });
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delay = Math.max((expiresIn - 60) * 1000, 5_000);
    refreshTimer.current = setTimeout(() => void silentRefresh(), delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      setState({ accessToken: data.accessToken, user: decodeAccessToken(data.accessToken), status: "authenticated" });
      scheduleRefresh(data.expiresIn);
    } catch {
      setState({ accessToken: null, user: null, status: "unauthenticated" });
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    void silentRefresh();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      }
      setState({ accessToken: data.accessToken, user: data.user, status: "authenticated" });
      scheduleRefresh(data.expiresIn);
      router.push("/deliveries");
    },
    [router, scheduleRefresh],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ accessToken: null, user: null, status: "unauthenticated" });
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => state.user?.permissions.includes(permission) ?? false,
    [state.user],
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
