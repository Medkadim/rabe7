"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/use-favorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { HomeBanner } from "@/components/home-banner";
import { cn, formatPrice } from "@/lib/utils";

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
  category: { id: string; name: string } | null;
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
  { id: "new", label: "وصل حديثًا", icon: SparkleIcon },
  { id: "popular", label: "الأكثر طلبًا", icon: FlameIcon },
  { id: "promotion", label: "عروض خاصة", icon: TagIcon },
];

const CATEGORY_COLORS = ["bg-brand", "bg-accent", "bg-success", "bg-warning", "bg-critical"];

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { favoritedIds, toggle, error: favoriteError } = useFavorites();
  const [added, setAdded] = useState(false);
  const outOfStock = product.currentStock <= 0;

  return (
    <div className="flex flex-col">
      <Link href={`/catalog/${product.id}`} className="relative block">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.name} className="h-44 w-full object-contain" />
        ) : (
          <div className="h-44 w-full rounded-[10px] bg-brand-soft" />
        )}
        {(product.isPromotion || product.isFeatured) && (
          <span
            className={cn(
              "absolute start-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium",
              product.isPromotion ? "bg-critical text-white" : "bg-brand text-white",
            )}
          >
            {product.isPromotion ? "عرض" : "مميز"}
          </span>
        )}
        <FavoriteButton
          active={favoritedIds.has(product.id)}
          onToggle={() => toggle(product.id)}
          className="absolute end-2 top-2"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <Link href={`/catalog/${product.id}`}>
          {product.category && <p className="text-left text-xs text-muted">{product.category.name}</p>}
          <p className="text-left text-[15px] font-bold text-ink hover:underline">{product.name}</p>
          <p className="text-left text-xs text-muted">{product.unit}</p>
        </Link>
        <p className="text-left text-lg font-semibold text-ink">{formatPrice(product.basePrice)}</p>
        {favoriteError && <p className="text-left text-xs text-critical">{favoriteError}</p>}
        {outOfStock ? (
          <p className="mt-auto text-left text-xs font-medium text-critical">غير متوفر</p>
        ) : (
          <Button
            size="sm"
            className="mt-auto w-full"
            onClick={() => {
              addItem({ productId: product.id, name: product.name, unitPrice: Number(product.basePrice) }, 1);
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
          >
            {added ? "أُضيف ✓" : "أضف إلى السلة"}
          </Button>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function CatalogPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [page, setPage] = useState(1);

  // Debounce so every keystroke doesn't fire a request.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // A category (or search, or filter) can hold more products than one page
  // — reset back to page 1 whenever the filter itself changes, otherwise
  // "load more" would keep paging through the *previous* filter's results.
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, quickFilter]);

  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const isDefaultView = !search && !categoryId && !quickFilter;

  const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(page) });
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  if (quickFilter === "promotion") params.set("promotion", "true");

  const productsPath = quickFilter === "popular" ? "/products/popular?limit=20" : `/products?${params.toString()}`;

  const { data, isLoading } = useApiQuery<ProductListResponse | Product[]>(
    ["products", "catalog", search, categoryId, quickFilter, page],
    productsPath,
  );

  // /products/popular returns a bare array; /products returns {data, meta}.
  const pageProducts = Array.isArray(data) ? data : (data?.data ?? []);
  const total = Array.isArray(data) ? pageProducts.length : (data?.meta.total ?? 0);

  // Each page's results are cached separately by react-query — accumulate
  // them locally so "load more" appends instead of replacing what's shown.
  const [accumulated, setAccumulated] = useState<Product[]>([]);
  useEffect(() => {
    if (!data) return;
    setAccumulated((current) => (page === 1 ? pageProducts : [...current, ...pageProducts]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page]);

  const products = quickFilter === "popular" ? pageProducts : accumulated;
  const hasMore = quickFilter !== "popular" && products.length < total;

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

      <Input
        type="search"
        placeholder="ابحث عن المنتجات…"
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
            <span className="w-16 text-center text-xs text-muted">العروض</span>
          </Link>
        </div>
      )}

      {!!quickFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">
            {SHORTCUTS.find((s) => s.id === quickFilter)?.label}
          </span>
          <button onClick={() => setQuickFilter(null)} className="text-xs text-muted underline">
            مسح
          </button>
        </div>
      )}

      {isDefaultView && !!categories?.length && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">الفئات</span>
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
            الكل
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

      {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!isLoading && products.length === 0 && (
        <p className="text-sm text-muted">
          {quickFilter === "popular" ? "لا توجد طلبات بعد لترتيب المنتجات." : "لا توجد منتجات تطابق بحثك."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
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
