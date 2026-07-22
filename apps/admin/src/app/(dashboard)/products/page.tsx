"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  basePrice: string;
  taxRatePercent: string;
  currentStock: number;
  minStock: number;
  status: string;
}

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

// Numeric fields stay as strings at the form layer — see the Customers page
// for why (keeps the Zod resolver's input/output types identical).
const createProductSchema = z.object({
  sku: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  unit: z.string().min(1, "Required"),
  basePrice: z.string().min(1, "Required"),
  taxRatePercent: z.string().optional(),
  currentStock: z.string().optional(),
  minStock: z.string().optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

function stockColor(product: Product) {
  if (product.currentStock <= 0) return "text-critical bg-critical/10";
  if (product.currentStock <= product.minStock) return "text-warning bg-warning/10";
  return "text-accent-ink bg-accent-soft";
}

export default function ProductsPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useApiQuery<ProductListResponse>(["products", "list"], "/products?pageSize=50");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductForm>({ resolver: zodResolver(createProductSchema) });

  const createProduct = useMutation({
    mutationFn: (values: CreateProductForm) =>
      apiFetch<Product>("/products", accessToken, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          basePrice: Number(values.basePrice),
          taxRatePercent: values.taxRatePercent ? Number(values.taxRatePercent) : undefined,
          currentStock: values.currentStock ? Number(values.currentStock) : undefined,
          minStock: values.minStock ? Number(values.minStock) : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
      setShowForm(false);
    },
  });

  const canCreate = hasPermission("products.create");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Products</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} items in the catalog.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New product"}</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New product</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createProduct.mutate(values))}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" placeholder="SKU-001" {...register("sku")} />
                {errors.sku && <p className="text-xs text-critical">{errors.sku.message}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="name">Product name</Label>
                <Input id="name" placeholder="Coca Cola 1.5L" {...register("name")} />
                {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" placeholder="case" {...register("unit")} />
                {errors.unit && <p className="text-xs text-critical">{errors.unit.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="basePrice">Base price</Label>
                <Input id="basePrice" type="number" step="0.01" {...register("basePrice")} />
                {errors.basePrice && <p className="text-xs text-critical">{errors.basePrice.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="taxRatePercent">Tax rate (%)</Label>
                <Input id="taxRatePercent" type="number" step="0.01" {...register("taxRatePercent")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentStock">Current stock</Label>
                <Input id="currentStock" type="number" {...register("currentStock")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="minStock">Minimum stock</Label>
                <Input id="minStock" type="number" {...register("minStock")} />
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create product"}
                </Button>
                {createProduct.isError && (
                  <p className="text-sm text-critical">
                    {createProduct.error instanceof ApiError
                      ? createProduct.error.message
                      : "Something went wrong."}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium text-right">Base price</th>
                <th className="px-5 py-3 font-medium text-right">Tax</th>
                <th className="px-5 py-3 font-medium text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    No products yet.
                  </td>
                </tr>
              )}
              {data?.data.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-muted">{product.sku}</td>
                  <td className="px-5 py-3 font-medium text-ink">{product.name}</td>
                  <td className="px-5 py-3 text-muted">{product.unit}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{product.basePrice}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{product.taxRatePercent}%</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${stockColor(product)}`}>
                      {product.currentStock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
