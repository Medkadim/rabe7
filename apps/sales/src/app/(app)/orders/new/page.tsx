"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useApiQuery } from "@/lib/use-api-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { cn, formatPrice } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface CustomerListResponse {
  data: Customer[];
}

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
  images: { url: string }[];
}

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

interface CartLine {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function CustomerPicker({ onSelect }: { onSelect: (customer: Customer) => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams({ pageSize: "20" });
  if (search) params.set("search", search);

  const { data, isLoading } = useApiQuery<CustomerListResponse>(
    ["customers", "picker", search],
    `/customers?${params.toString()}`,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>اختر العميل</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          type="search"
          placeholder="ابحث بالاسم أو الهاتف…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
        <div className="flex flex-col gap-1.5">
          {data?.data.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => onSelect(customer)}
              className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-start text-sm hover:bg-brand-soft"
            >
              <span className="text-ink">{customer.name}</span>
              <span dir="ltr" className="text-muted">{customer.phone ?? ""}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const initialCustomerId = searchParams.get("customerId");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const { data: prefetchedCustomer } = useApiQuery<Customer>(
    ["customers", initialCustomerId],
    `/customers/${initialCustomerId}`,
    { enabled: !!initialCustomerId },
  );

  useEffect(() => {
    if (prefetchedCustomer) setCustomer(prefetchedCustomer);
  }, [prefetchedCustomer]);

  const [productSearch, setProductSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [deliveryDate, setDeliveryDate] = useState(tomorrowIso());
  const [notes, setNotes] = useState("");

  const { data: categories } = useApiQuery<Category[]>(
    ["products", "categories"],
    "/products/categories",
    { enabled: !!customer },
  );

  useEffect(() => {
    setProductPage(1);
  }, [productSearch, categoryId]);

  const PRODUCT_PAGE_SIZE = 30;
  const productParams = new URLSearchParams({ pageSize: String(PRODUCT_PAGE_SIZE), page: String(productPage) });
  if (productSearch) productParams.set("search", productSearch);
  if (categoryId) productParams.set("categoryId", categoryId);
  const { data: products, isLoading: loadingProducts } = useApiQuery<ProductListResponse>(
    ["products", "picker", productSearch, categoryId, productPage],
    `/products?${productParams.toString()}`,
    { enabled: !!customer },
  );

  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!products) return;
    setAccumulatedProducts((current) => (productPage === 1 ? products.data : [...current, ...products.data]));
  }, [products, productPage]);

  const hasMoreProducts = accumulatedProducts.length < (products?.meta.total ?? 0);

  function setQuantity(product: Product, quantity: number) {
    setCart((current) => {
      if (quantity <= 0) {
        const { [product.id]: _removed, ...rest } = current;
        return rest;
      }
      return {
        ...current,
        [product.id]: { productId: product.id, name: product.name, unit: product.unit, unitPrice: Number(product.basePrice), quantity },
      };
    });
  }

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(() => cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [cartLines]);

  const createOrder = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>("/orders", accessToken, {
        method: "POST",
        body: JSON.stringify({
          customerId: customer!.id,
          notes: notes || undefined,
          requestedDeliveryDate: new Date(deliveryDate).toISOString(),
          items: cartLines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        }),
      }),
    onSuccess: () => {
      router.push(`/clients/${customer!.id}`);
    },
  });

  if (!customer) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-ink">طلب جديد</h1>
        <CustomerPicker onSelect={setCustomer} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">طلب جديد</h1>
          <p className="text-sm text-muted">العميل: {customer.name}</p>
        </div>
        {!initialCustomerId && (
          <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
            تغيير العميل
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            type="search"
            placeholder="ابحث عن منتج…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          {!!categories?.length && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                onClick={() => setCategoryId(null)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
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
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
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
          {loadingProducts && productPage === 1 && <p className="text-sm text-muted">جارٍ التحميل…</p>}
          <div className="flex flex-col gap-2">
            {accumulatedProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-md bg-brand-soft" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                    <p className="text-xs text-muted">
                      {formatPrice(product.basePrice)} / {product.unit}
                      {product.currentStock <= 0 ? " · غير متوفر" : ""}
                    </p>
                  </div>
                </div>
                <QuantityStepper
                  value={cart[product.id]?.quantity ?? 0}
                  onChange={(q) => setQuantity(product, q)}
                  min={0}
                />
              </div>
            ))}
          </div>
          {hasMoreProducts && (
            <Button
              variant="outline"
              onClick={() => setProductPage((p) => p + 1)}
              disabled={loadingProducts}
              className="mx-auto"
            >
              {loadingProducts ? "جارٍ التحميل…" : "عرض المزيد"}
            </Button>
          )}
        </CardContent>
      </Card>

      {cartLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص الطلب</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cartLines.map((line) => (
              <div key={line.productId} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {line.name} × {line.quantity}
                </span>
                <span className="text-muted">{formatPrice(line.unitPrice * line.quantity)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-base font-semibold text-ink">
              <span>الإجمالي</span>
              <span>{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التسليم</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deliveryDate">تاريخ التسليم</Label>
            <Input
              id="deliveryDate"
              type="date"
              dir="ltr"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {createOrder.isError && (
            <p className="text-sm text-critical">
              {createOrder.error instanceof ApiError ? createOrder.error.message : "حدث خطأ ما."}
            </p>
          )}

          <Button
            onClick={() => createOrder.mutate()}
            disabled={cartLines.length === 0 || createOrder.isPending}
            className="w-full"
          >
            {createOrder.isPending ? "جارٍ الإنشاء…" : "إنشاء الطلب"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
