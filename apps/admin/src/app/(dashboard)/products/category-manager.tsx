"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/use-api-query";

interface Category {
  id: string;
  name: string;
}

export function CategoryManager({ onClose }: { onClose: () => void }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  const createCategory = useMutation({
    mutationFn: (name: string) =>
      apiFetch<Category>("/products/categories", accessToken, { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: async () => {
      await invalidate();
      setNewName("");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create the category."),
  });

  const renameCategory = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch<Category>(`/products/categories/${id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: async () => {
      await invalidate();
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not rename the category."),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/products/categories/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => invalidate(),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not delete the category."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage categories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!newName.trim() || createCategory.isPending}
            onClick={() => createCategory.mutate(newName.trim())}
          >
            {createCategory.isPending ? "Adding…" : "Add"}
          </Button>
        </div>

        {error && <p className="text-sm text-critical">{error}</p>}

        <div className="flex flex-col divide-y divide-line rounded-md border border-line">
          {!categories?.length && <p className="px-3 py-4 text-sm text-muted">No categories yet.</p>}
          {categories?.map((category) => (
            <div key={category.id} className="flex items-center gap-2 px-3 py-2">
              {editingId === category.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    disabled={!editingName.trim() || renameCategory.isPending}
                    onClick={() => renameCategory.mutate({ id: category.id, name: editingName.trim() })}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-ink">{category.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteCategory.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${category.name}"? Products in this category will become uncategorized.`,
                        )
                      ) {
                        deleteCategory.mutate(category.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-fit" onClick={onClose}>
          Close
        </Button>
      </CardContent>
    </Card>
  );
}
