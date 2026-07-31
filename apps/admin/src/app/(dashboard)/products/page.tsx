"use client";

import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, uploadImage, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImport } from "./product-import";
import { CategoryManager } from "./category-manager";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  basePrice: string;
  costPrice: string | null;
  taxRatePercent: string;
  currentStock: number;
  minStock: number;
  status: string;
  isFeatured: boolean;
  isPromotion: boolean;
  category: Category | null;
  images: { url: string }[];
}

const MIN_PRODUCT_IMAGES = 3;

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

// Numeric fields stay as strings at the form layer — see the Customers page
// for why (keeps the Zod resolver's input/output types identical).
const createProductSchema = z.object({
  sku: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.string().min(1, "Required"),
  basePrice: z.string().min(1, "Required"),
  costPrice: z.string().optional(),
  taxRatePercent: z.string().optional(),
  currentStock: z.string().optional(),
  minStock: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPromotion: z.boolean().optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

function stockColor(product: Product) {
  if (product.currentStock <= 0) return "text-critical bg-critical/10";
  if (product.currentStock <= product.minStock) return "text-warning bg-warning/10";
  return "text-success bg-success-soft";
}

function margin(product: Product): string {
  if (!product.costPrice) return "—";
  const cost = Number(product.costPrice);
  const sale = Number(product.basePrice);
  if (!cost) return "—";
  const percent = ((sale - cost) / cost) * 100;
  return `${percent.toFixed(0)}%`;
}

export default function ProductsPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const { data, isLoading } = useApiQuery<ProductListResponse>(["products", "list"], "/products?pageSize=50");
  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductForm>({ resolver: zodResolver(createProductSchema) });

  function startCreate() {
    setEditingId(null);
    setImages([]);
    setUploadError(null);
    reset({
      sku: "",
      name: "",
      description: "",
      categoryId: "",
      unit: "",
      basePrice: "",
      costPrice: "",
      taxRatePercent: "",
      currentStock: "",
      minStock: "",
      isFeatured: false,
      isPromotion: false,
    });
    setShowForm(true);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setImages(product.images.map((i) => i.url));
    setUploadError(null);
    reset({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      categoryId: product.category?.id ?? "",
      unit: product.unit,
      basePrice: product.basePrice,
      costPrice: product.costPrice ?? "",
      taxRatePercent: product.taxRatePercent,
      currentStock: String(product.currentStock),
      minStock: String(product.minStock),
      isFeatured: product.isFeatured,
      isPromotion: product.isPromotion,
    });
    setShowForm(true);
  }

  const createCategory = useMutation({
    mutationFn: (name: string) => apiFetch<Category>("/products/categories", accessToken, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
    onSuccess: async (category) => {
      // Wait for the categories list to actually refetch before selecting
      // the new one — otherwise the <select> has no matching <option> yet
      // and silently falls back to displaying "No category" even though
      // the form state is technically holding the right id.
      await queryClient.invalidateQueries({ queryKey: ["products", "categories"] });
      setValue("categoryId", category.id);
      setNewCategoryName("");
      setShowNewCategory(false);
      setCategoryError(null);
    },
    onError: (err) => setCategoryError(err instanceof ApiError ? err.message : "Could not create the category."),
  });

  const saveProduct = useMutation({
    mutationFn: (values: CreateProductForm) => {
      const body = JSON.stringify({
        ...values,
        categoryId: values.categoryId || undefined,
        basePrice: Number(values.basePrice),
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        taxRatePercent: values.taxRatePercent ? Number(values.taxRatePercent) : undefined,
        currentStock: values.currentStock ? Number(values.currentStock) : undefined,
        minStock: values.minStock ? Number(values.minStock) : undefined,
        images,
      });
      return editingId
        ? apiFetch<Product>(`/products/${editingId}`, accessToken, { method: "PATCH", body })
        : apiFetch<Product>("/products", accessToken, { method: "POST", body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
      setImages([]);
      setEditingId(null);
      setShowForm(false);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/products/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const bulkDeleteProducts = useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ deleted: number }>("/products/bulk-delete", accessToken, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
    },
  });

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allVisibleSelected = !!data?.data.length && data.data.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data?.data.map((p) => p.id)));
    }
  }

  async function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // lets the same file be re-picked if removed later
    if (files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      for (const file of files) {
        const { url } = await uploadImage(file, accessToken);
        setImages((prev) => [...prev, url]);
      }
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const canCreate = hasPermission("products.create");
  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.delete");
  const canReadCost = hasPermission("products.cost_read");
  const showActions = canUpdate || canDelete;
  const hasEnoughImages = images.length >= MIN_PRODUCT_IMAGES;
  const columnCount = 8 + (canDelete ? 1 : 0) + (canReadCost ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Products</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} items in the catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && selectedIds.size > 0 && (
            <Button
              variant="destructive"
              disabled={bulkDeleteProducts.isPending}
              onClick={() => {
                if (window.confirm(`Archive ${selectedIds.size} selected product(s)? They will no longer appear in the catalog.`)) {
                  bulkDeleteProducts.mutate([...selectedIds]);
                }
              }}
            >
              {bulkDeleteProducts.isPending ? "Deleting…" : `Delete selected (${selectedIds.size})`}
            </Button>
          )}
          {canCreate && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setShowImport(false);
                  setShowCategoryManager((v) => !v);
                }}
              >
                {showCategoryManager ? "Close categories" : "Manage categories"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setShowCategoryManager(false);
                  setShowImport((v) => !v);
                }}
              >
                {showImport ? "Cancel import" : "Import from Excel"}
              </Button>
              <Button
                onClick={() => {
                  if (showForm) {
                    setShowForm(false);
                  } else {
                    setShowImport(false);
                    setShowCategoryManager(false);
                    startCreate();
                  }
                }}
              >
                {showForm ? "Cancel" : "New product"}
              </Button>
            </>
          )}
        </div>
      </div>

      {showImport && <ProductImport onClose={() => setShowImport(false)} />}
      {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} />}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit product" : "New product"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => saveProduct.mutate(values))}
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
              <div className="col-span-3 flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="What customers see on the product page…"
                  className="flex w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  {...register("description")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="categoryId">Category</Label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory((v) => !v)}
                    className="text-xs font-medium text-accent-ink underline"
                  >
                    {showNewCategory ? "Cancel" : "+ New category"}
                  </button>
                </div>
                {showNewCategory ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Beverages"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!newCategoryName.trim() || createCategory.isPending}
                      onClick={() => createCategory.mutate(newCategoryName.trim())}
                    >
                      {createCategory.isPending ? "Adding…" : "Add"}
                    </Button>
                  </div>
                ) : (
                  <Select id="categoryId" {...register("categoryId")}>
                    <option value="">No category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                )}
                {categoryError && <p className="text-xs text-critical">{categoryError}</p>}
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
              {canReadCost && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="costPrice">Cost price</Label>
                  <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} />
                </div>
              )}
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

              <div className="col-span-3 flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
                  Featured — highlighted to customers
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4" {...register("isPromotion")} />
                  Special offer — shown as a promotion
                </label>
              </div>

              <div className="col-span-3 flex flex-col gap-1.5">
                <Label htmlFor="images">
                  Product photos ({images.length}/{MIN_PRODUCT_IMAGES} minimum)
                </Label>
                <Input id="images" type="file" accept="image/*" multiple onChange={handleImagesSelected} />
                {isUploading && <p className="text-xs text-muted">Uploading…</p>}
                {uploadError && <p className="text-xs text-critical">{uploadError}</p>}
                {images.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {images.map((url, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-md border border-line">
                        <img src={url} alt={`Product photo ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                          className="absolute inset-0 hidden items-center justify-center bg-black/50 text-xs font-medium text-white group-hover:flex"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!hasEnoughImages && (
                  <p className="text-xs text-muted">Add at least {MIN_PRODUCT_IMAGES} photos before saving.</p>
                )}
              </div>

              <div className="col-span-3 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting || !hasEnoughImages || isUploading}>
                  {isSubmitting ? "Saving…" : editingId ? "Save changes" : "Create product"}
                </Button>
                {saveProduct.isError && (
                  <p className="text-sm text-critical">
                    {saveProduct.error instanceof ApiError
                      ? saveProduct.error.message
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
                {canDelete && (
                  <th className="px-5 py-3 font-medium">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all products"
                    />
                  </th>
                )}
                <th className="px-5 py-3 font-medium">Photo</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium text-right">Base price</th>
                {canReadCost && <th className="px-5 py-3 font-medium text-right">Margin</th>}
                <th className="px-5 py-3 font-medium text-right">Tax</th>
                <th className="px-5 py-3 font-medium text-right">Stock</th>
                {showActions && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-6 text-center text-muted">
                    No products yet.
                  </td>
                </tr>
              )}
              {data?.data.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  {canDelete && (
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelected(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-3">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="h-10 w-10 rounded-md border border-line object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-dashed border-line" />
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{product.sku}</td>
                  <td className="px-5 py-3 font-medium text-ink">{product.name}</td>
                  <td className="px-5 py-3 text-muted">{product.category?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{product.unit}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{product.basePrice}</td>
                  {canReadCost && <td className="px-5 py-3 text-right tabular-nums">{margin(product)}</td>}
                  <td className="px-5 py-3 text-right tabular-nums">{product.taxRatePercent}%</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${stockColor(product)}`}>
                      {product.currentStock}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button variant="outline" size="sm" onClick={() => startEdit(product)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deleteProduct.isPending}
                            onClick={() => {
                              if (window.confirm(`Archive ${product.name}? It will no longer appear in the catalog.`)) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {deleteProduct.isError && (
        <p className="text-sm text-critical">
          {deleteProduct.error instanceof ApiError ? deleteProduct.error.message : "Could not archive the product."}
        </p>
      )}
    </div>
  );
}
