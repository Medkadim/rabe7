"use client";

import { useEffect, useState } from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  basePrice: string;
  currentStock: number;
  category: { name: string } | null;
  images: { url: string }[];
}

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

const PAGE_SIZE = 20;

export default function ProductsCatalogPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(page) });
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);

  const { data, isLoading } = useApiQuery<ProductListResponse>(
    ["products", "catalog", search, categoryId, page],
    `/products?${params.toString()}`,
  );

  const [accumulated, setAccumulated] = useState<Product[]>([]);
  useEffect(() => {
    if (!data) return;
    setAccumulated((current) => (page === 1 ? data.data : [...current, ...data.data]));
  }, [data, page]);

  const total = data?.meta.total ?? 0;
  const hasMore = accumulated.length < total;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">المنتجات</h1>
        <p className="text-sm text-muted">{total} منتج متاح</p>
      </div>

      <Input
        type="search"
        placeholder="ابحث عن منتج…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {!!categories?.length && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setCategoryId(null)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
              categoryId === null ? "border-brand bg-brand text-white" : "border-line bg-paper-raised text-muted",
            )}
          >
            الكل
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryId(category.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
                categoryId === category.id
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-paper-raised text-muted",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && page === 1 && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!isLoading && accumulated.length === 0 && <p className="text-sm text-muted">لا توجد منتجات مطابقة.</p>}

      <div className="flex flex-col gap-2">
        {accumulated.map((product) => (
          <Card key={product.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-md bg-brand-soft" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{product.name}</p>
                <p className="text-xs text-muted">
                  {product.category?.name ?? "—"} · {product.unit}
                  {product.currentStock <= 0 ? " · غير متوفر" : ""}
                </p>
              </div>
            </div>
            <p className="shrink-0 font-semibold text-ink">{formatPrice(product.basePrice)}</p>
          </Card>
        ))}
      </div>

      {hasMore && (
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isLoading} className="mx-auto">
          {isLoading ? "جارٍ التحميل…" : "عرض المزيد"}
        </Button>
      )}
    </div>
  );
}
