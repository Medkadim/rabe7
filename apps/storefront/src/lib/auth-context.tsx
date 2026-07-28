"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeAccessToken } from "./jwt";
import { apiFetch } from "./api-client";

export interface SessionUser {
  userId: string;
  tenantId: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  customerId: string | null;
}

export interface CustomerAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  country: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  id: string;
  code: string;
  name: string;
  status: string;
  phone: string | null;
  email: string | null;
  addresses: CustomerAddress[];
}

export interface RegisterInput {
  businessName: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  email?: string;
  address: {
    label: string;
    line1: string;
    city: string;
    country: string;
  };
}

interface AuthState {
  accessToken: string | null;
  user: SessionUser | null;
  customer: CustomerProfile | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  isApproved: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
    customer: null,
    status: "loading",
  });
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCustomerProfile = useCallback(async (accessToken: string) => {
    try {
      const me = await apiFetch<{ customer: CustomerProfile | null }>("/auth/me", accessToken);
      return me.customer;
    } catch {
      return null;
    }
  }, []);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    // Refresh a minute before the access token actually expires so an
    // in-flight request never gets caught holding an expired token.
    const delay = Math.max((expiresIn - 60) * 1000, 5_000);
    refreshTimer.current = setTimeout(() => void silentRefresh(), delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      const user = decodeAccessToken(data.accessToken);
      const customer = await loadCustomerProfile(data.accessToken);
      setState({ accessToken: data.accessToken, user, customer, status: "authenticated" });
      scheduleRefresh(data.expiresIn);
    } catch {
      setState({ accessToken: null, user: null, customer: null, status: "unauthenticated" });
    }
  }, [scheduleRefresh, loadCustomerProfile]);

  useEffect(() => {
    // On first load there's no user in memory yet (page refresh clears
    // React state) — try the httpOnly refresh cookie before giving up and
    // sending the user back to /login.
    void silentRefresh();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      }
      const customer = await loadCustomerProfile(data.accessToken);
      setState({ accessToken: data.accessToken, user: data.user, customer, status: "authenticated" });
      scheduleRefresh(data.expiresIn);
      router.push("/catalog");
    },
    [router, scheduleRefresh, loadCustomerProfile],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      }
      const customer = await loadCustomerProfile(data.accessToken);
      setState({ accessToken: data.accessToken, user: data.user, customer, status: "authenticated" });
      scheduleRefresh(data.expiresIn);
      router.push("/catalog");
    },
    [router, scheduleRefresh, loadCustomerProfile],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ accessToken: null, user: null, customer: null, status: "unauthenticated" });
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => state.user?.permissions.includes(permission) ?? false,
    [state.user],
  );

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, isApproved: state.customer?.status === "ACTIVE", hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
