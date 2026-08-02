"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface OrderItem {
  quantity: number;
  unitPrice: string;
  product: { id: string; name: string; unit: string };
}

interface OrderDetail {
  id: string;
  status: string;
  notes: string | null;
  requestedDeliveryDate: string | null;
  customer: { id: string; name: string };
  items: OrderItem[];
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
}

interface ProductListResponse {
  data: Product[];
}

interface CartLine {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

const EDITABLE_STATUSES = ["DRAFT", "PENDING"];

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();

  const { data: order, isLoading } = useApiQuery<OrderDetail>(["orders", id], `/orders/${id}`);

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!order || initialized) return;
    const initialCart: Record<string, CartLine> = {};
    for (const item of order.items) {
      initialCart[item.product.id] = {
        productId: item.product.id,
        name: item.product.name,
        unit: item.product.unit,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
      };
    }
    setCart(initialCart);
    setNotes(order.notes ?? "");
    setDeliveryDate(order.requestedDeliveryDate ? order.requestedDeliveryDate.slice(0, 10) : "");
    setInitialized(true);
  }, [order, initialized]);

  const [productSearch, setProductSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { data: categories } = useApiQuery<Category[]>(["products", "categories"], "/products/categories");

  const productParams = new URLSearchParams({ pageSize: "30" });
  if (productSearch) productParams.set("search", productSearch);
  if (categoryId) productParams.set("categoryId", categoryId);
  const { data: products, isLoading: loadingProducts } = useApiQuery<ProductListResponse>(
    ["products", "picker", productSearch, categoryId],
    `/products?${productParams.toString()}`,
  );

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

  const save = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(`/orders/${id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          notes: notes || undefined,
          requestedDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
          items: cartLines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        }),
      }),
    onSuccess: () => {
      router.push(`/orders/${id}`);
    },
  });

  if (isLoading || !initialized) return <p className="text-sm text-muted">جارٍ التحميل…</p>;
  if (order && !EDITABLE_STATUSES.includes(order.status)) {
    return <p className="text-sm text-critical">لم يعد بالإمكان تعديل هذا الطلب في حالته الحالية.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">تعديل الطلب</h1>
        <p className="text-sm text-muted">العميل: {order?.customer.name}</p>
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
          {loadingProducts && <p className="text-sm text-muted">جارٍ التحميل…</p>}
          <div className="flex flex-col gap-2">
            {products?.data.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                  <p className="text-xs text-muted">
                    {formatPrice(product.basePrice)} / {product.unit}
                    {product.currentStock <= 0 ? " · غير متوفر" : ""}
                  </p>
                </div>
                <QuantityStepper
                  value={cart[product.id]?.quantity ?? 0}
                  onChange={(q) => setQuantity(product, q)}
                  min={0}
                />
              </div>
            ))}
          </div>
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

          {save.isError && (
            <p className="text-sm text-critical">
              {save.error instanceof ApiError ? save.error.message : "حدث خطأ ما."}
            </p>
          )}

          <Button
            onClick={() => save.mutate()}
            disabled={cartLines.length === 0 || save.isPending}
            className="w-full"
          >
            {save.isPending ? "جارٍ الحفظ…" : "حفظ التعديلات"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
