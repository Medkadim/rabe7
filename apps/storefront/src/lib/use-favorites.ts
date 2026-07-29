"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { useApiQuery } from "./use-api-query";
import { apiFetch, ApiError } from "./api-client";

export interface FavoriteProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  basePrice: string;
  currentStock: number;
  images: { url: string }[];
}

export interface Favorite {
  id: string;
  productId: string;
  product: FavoriteProduct;
}

// One shared query, keyed the same everywhere it's read — the catalog grid,
// the product detail page, and the favorites list all see the same list and
// stay in sync through react-query's cache rather than each holding their
// own copy of "is this favorited".
export function useFavorites() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error: listError } = useApiQuery<Favorite[]>(["favorites"], "/favorites");

  const favoritedIds = new Set((data ?? []).map((f) => f.productId));

  const add = useMutation({
    mutationFn: (productId: string) =>
      apiFetch<Favorite>("/favorites", accessToken, {
        method: "POST",
        body: JSON.stringify({ productId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const remove = useMutation({
    mutationFn: (productId: string) => apiFetch<void>(`/favorites/${productId}`, accessToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const toggle = (productId: string) => {
    if (favoritedIds.has(productId)) {
      remove.mutate(productId);
    } else {
      add.mutate(productId);
    }
  };

  const failure = add.error ?? remove.error ?? listError;
  const error = failure ? (failure instanceof ApiError ? failure.message : "Could not update favorites.") : null;

  return { favorites: data ?? [], favoritedIds, isLoading, toggle, error };
}
