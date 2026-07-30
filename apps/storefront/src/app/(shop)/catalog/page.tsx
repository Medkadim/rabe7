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
import { HomeBanner } from "@/components/home-banner";
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

type QuickFilter = "new" | "popular" | "promotion" | null;

// Small hand-drawn icon set (no icon library in this app) — one stroke
// style, 24x24, matching the FavoriteButton heart so shortcuts and the
// favorite toggle read as one visual family.
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3-3 4-3 8a3 3 0 006 0c0-1-.6-1.6-1-2 .3 1.6-.7 2.4-1.5 2.4-1 0-1.7-.8-1.5-1.8.3-1.4 1-2.6 1-6.6zM8 14a4 4 0 108 0c0 3-1.8 6-4 7-2.2-1-4-4-4-7z" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 12.6L12.7 20.5a2 2 0 01-2.8 0l-6.4-6.4a2 2 0 010-2.8L11.4 3.4 20.6 3v9.6z" />
      <circle cx="16.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PercentIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M19 5L5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

const SHORTCUTS: { id: QuickFilter; label: string; icon: () => React.ReactElement }[] = [
  { id: "new", label: "New arrivals", icon: SparkleIcon },
  { id: "popular", label: "Most ordered", icon: FlameIcon },
  { id: "promotion", label: "Special offers", icon: TagIcon },
];

const CATEGORY_COLORS = ["bg-brand", "bg-accent", "bg-success", "bg-warning", "bg-critical"];

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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  // Debounce so every keystroke doesn't fire a request.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const isDefaultView = !search && !categoryId && !quickFilter;

  const params = new URLSearchParams({ pageSize: "50" });
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  if (quickFilter === "promotion") params.set("promotion", "true");

  const productsPath = quickFilter === "popular" ? "/products/popular?limit=20" : `/products?${params.toString()}`;

  const { data, isLoading } = useApiQuery<ProductListResponse | Product[]>(
    ["products", "catalog", search, categoryId, quickFilter],
    productsPath,
  );

  // /products/popular returns a bare array; /products returns {data, meta}.
  const products = Array.isArray(data) ? data : (data?.data ?? []);
  const total = Array.isArray(data) ? data.length : data?.meta.total;

  function selectQuickFilter(id: QuickFilter) {
    setQuickFilter((current) => (current === id ? null : id));
    setCategoryId(null);
    setSearchInput("");
    setSearch("");
  }

  function selectCategory(id: string | null) {
    setCategoryId(id);
    setQuickFilter(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {isDefaultView && <HomeBanner />}

      <div>
        <h1 className="text-xl font-semibold text-ink">Catalog</h1>
        <p className="text-sm text-muted">{total ?? 0} products available.</p>
      </div>

      <Input
        type="search"
        placeholder="Search products…"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          setQuickFilter(null);
        }}
        className="h-11"
      />

      {isDefaultView && (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {SHORTCUTS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectQuickFilter(id)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                <Icon />
              </span>
              <span className="w-16 text-center text-xs text-muted">{label}</span>
            </button>
          ))}
          <Link href="/promotions" className="flex shrink-0 flex-col items-center gap-1.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
              <PercentIcon />
            </span>
            <span className="w-16 text-center text-xs text-muted">Promotions</span>
          </Link>
        </div>
      )}

      {!!quickFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">
            {SHORTCUTS.find((s) => s.id === quickFilter)?.label}
          </span>
          <button onClick={() => setQuickFilter(null)} className="text-xs text-muted underline">
            Clear
          </button>
        </div>
      )}

      {isDefaultView && !!categories?.length && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Categories</span>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => selectCategory(category.id)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white",
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  )}
                >
                  {category.name.charAt(0).toUpperCase()}
                </span>
                <span className="w-16 truncate text-center text-xs text-muted">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isDefaultView && !!categories?.length && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => selectCategory(null)}
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
              onClick={() => selectCategory(category.id)}
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
      {!isLoading && products.length === 0 && (
        <p className="text-sm text-muted">
          {quickFilter === "popular" ? "No orders yet to rank products by." : "No products match your search."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
