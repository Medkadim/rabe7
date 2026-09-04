"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { apiFetch } from "./api-client";

// Every screen reads through this one hook so the access token is always
// attached the same way and a 401 always means the same thing.
export function useApiQuery<T>(
  key: readonly unknown[],
  path: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  const { accessToken, status } = useAuth();
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiFetch<T>(path, accessToken),
    enabled: status === "authenticated" && !!accessToken,
    ...options,
  });
}
