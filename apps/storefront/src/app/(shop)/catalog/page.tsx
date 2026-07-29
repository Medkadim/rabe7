"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/use-favorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  basePrice: string;
  currentStock: number;
  isFeatured: boolean;
  isPromotion: boolean;
  images: { url: string }[];
}

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

interface Category {
  id: string;
  name: string;
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { favoritedIds, toggle, error: favoriteError } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.currentStock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/catalog/${product.id}`} className="relative block">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.name} className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-brand-soft" />
        )}
        {(product.isPromotion || product.isFeatured) && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium",
              product.isPromotion ? "bg-critical text-white" : "bg-brand text-white",
            )}
          >
            {product.isPromotion ? "Promo" : "Featured"}
          </span>
        )}
        <FavoriteButton
          active={favoritedIds.has(product.id)}
          onToggle={() => toggle(product.id)}
          className="absolute right-2 top-2"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/catalog/${product.id}`}>
          <p className="font-medium text-ink hover:underline">{product.name}</p>
          <p className="text-xs text-muted">
            {product.sku} · per {product.unit}
          </p>
        </Link>
        <p className="text-lg font-semibold text-ink">{product.basePrice}</p>
        {favoriteError && <p className="text-xs text-critical">{favoriteError}</p>}
        {outOfStock ? (
          <p className="mt-auto text-xs font-medium text-critical">Out of stock</p>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            <QuantityStepper value={quantity} onChange={setQuantity} className="w-full" />
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                addItem({ productId: product.id, name: product.name, unitPrice: Number(product.basePrice) }, quantity);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
            >
              {added ? "Added ✓" : "Add to cart"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CatalogPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Debounce so every keystroke doesn't fire a request.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const params = new URLSearchParams({ pageSize: "50" });
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);

  const { data, isLoading } = useApiQuery<ProductListResponse>(
    ["products", "catalog", search, categoryId],
    `/products?${params.toString()}`,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Catalog</h1>
        <p className="text-sm text-muted">{data?.meta.total ?? 0} products available.</p>
      </div>

      <Input
        type="search"
        placeholder="Search products…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="h-11"
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
            All
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

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && data?.data.length === 0 && (
        <p className="text-sm text-muted">No products match your search.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {data?.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
