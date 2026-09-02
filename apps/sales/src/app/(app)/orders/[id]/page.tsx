"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/lib/use-api-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string; unit: string };
}

type ReturnCondition = "SELLABLE" | "DAMAGED";

interface ReturnLine {
  productId: string;
  name: string;
  maxQuantity: number;
  quantity: number;
  condition: ReturnCondition;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  notes: string | null;
  requestedDeliveryDate: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone: string | null };
  items: OrderItem[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغى",
};

const EDITABLE_STATUSES = ["DRAFT", "PENDING"];

function statusColor(status: string): string {
  if (status === "DELIVERED") return "text-success bg-success-soft";
  if (status === "CANCELLED") return "text-critical bg-critical/10";
  if (status === "CONFIRMED" || status === "PROCESSING") return "text-brand-ink bg-brand-soft";
  return "text-warning bg-warning/10";
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: order, isLoading, error } = useApiQuery<OrderDetail>(["orders", id], `/orders/${id}`);

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnLines, setReturnLines] = useState<Record<string, ReturnLine>>({});

  function toggleReturnLine(item: OrderItem, checked: boolean) {
    setReturnLines((current) => {
      const next = { ...current };
      if (checked) {
        next[item.product.id] = {
          productId: item.product.id,
          name: item.product.name,
          maxQuantity: item.quantity,
          quantity: item.quantity,
          condition: "SELLABLE",
        };
      } else {
        delete next[item.product.id];
      }
      return next;
    });
  }

  function updateReturnLine(productId: string, patch: Partial<ReturnLine>) {
    setReturnLines((current) => ({ ...current, [productId]: { ...current[productId], ...patch } }));
  }

  const declareReturn = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>("/warehouse/returns", accessToken, {
        method: "POST",
        body: JSON.stringify({
          customerId: order!.customer.id,
          orderId: order!.id,
          reason: returnReason,
          items: Object.values(returnLines).map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            condition: line.condition,
          })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      setShowReturnForm(false);
      setReturnReason("");
      setReturnLines({});
    },
  });

  async function downloadPdf() {
    if (!order) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/orders/${order.id}/pdf`,
      { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  if (isLoading) return <p className="text-sm text-muted">جارٍ التحميل…</p>;
  if (error || !order) {
    return (
      <p className="text-sm text-critical">
        {error instanceof ApiError ? error.message : "تعذر العثور على الطلب."}
      </p>
    );
  }

  const canEdit = EDITABLE_STATUSES.includes(order.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{order.orderNumber}</h1>
          <Link href={`/clients/${order.customer.id}`} className="text-sm text-muted hover:underline">
            {order.customer.name}
          </Link>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
              <div>
                <p className="text-ink">{item.product.name}</p>
                <p className="text-xs text-muted">
                  {item.quantity} × {formatPrice(item.unitPrice)} / {item.product.unit}
                </p>
              </div>
              <p className="font-medium text-ink">{formatPrice(item.lineTotal)}</p>
            </div>
          ))}
          <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2 text-sm text-muted">
            <div className="flex justify-between">
              <span>المجموع الفرعي</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between">
                <span>الخصم</span>
                <span>-{formatPrice(order.discountTotal)}</span>
              </div>
            )}
            {Number(order.taxTotal) > 0 && (
              <div className="flex justify-between">
                <span>الضريبة</span>
                <span>{formatPrice(order.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>الإجمالي</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التسليم</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted">تاريخ التسليم: </span>
            {order.requestedDeliveryDate
              ? new Date(order.requestedDeliveryDate).toLocaleDateString("ar-MA")
              : "غير محدد"}
          </p>
          {order.notes && (
            <p>
              <span className="text-muted">ملاحظات: </span>
              {order.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإبلاغ عن إرجاع</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!showReturnForm && (
            <Button variant="outline" className="w-fit" onClick={() => setShowReturnForm(true)}>
              الإبلاغ عن إرجاع منتجات
            </Button>
          )}
          {showReturnForm && (
            <>
              <div className="flex flex-col gap-2">
                {order.items.map((item) => {
                  const line = returnLines[item.product.id];
                  return (
                    <div key={item.id} className="rounded-md border border-line p-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!line}
                          onChange={(e) => toggleReturnLine(item, e.target.checked)}
                        />
                        <span className="text-ink">{item.product.name}</span>
                        <span className="text-xs text-muted">(الكمية المطلوبة: {item.quantity})</span>
                      </label>
                      {line && (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor={`qty-${item.product.id}`} className="text-xs">
                              الكمية المرتجعة
                            </Label>
                            <Input
                              id={`qty-${item.product.id}`}
                              type="number"
                              min={1}
                              max={line.maxQuantity}
                              value={line.quantity}
                              onChange={(e) =>
                                updateReturnLine(item.product.id, {
                                  quantity: Math.min(Number(e.target.value) || 1, line.maxQuantity),
                                })
                              }
                              className="w-20"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateReturnLine(item.product.id, { condition: "SELLABLE" })}
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                line.condition === "SELLABLE"
                                  ? "border-brand bg-brand text-white"
                                  : "border-line bg-paper-raised text-muted"
                              }`}
                            >
                              قابل لإعادة البيع
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReturnLine(item.product.id, { condition: "DAMAGED" })}
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                line.condition === "DAMAGED"
                                  ? "border-critical bg-critical text-white"
                                  : "border-line bg-paper-raised text-muted"
                              }`}
                            >
                              تالف
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="returnReason">سبب الإرجاع</Label>
                <Input
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="مثال: العميل غيّر رأيه، منتج تالف عند التسليم…"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  disabled={
                    declareReturn.isPending || Object.keys(returnLines).length === 0 || !returnReason.trim()
                  }
                  onClick={() => declareReturn.mutate()}
                >
                  {declareReturn.isPending ? "جارٍ الإرسال…" : "إرسال الإرجاع"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReturnForm(false);
                    setReturnLines({});
                    setReturnReason("");
                  }}
                >
                  إلغاء
                </Button>
              </div>
              {declareReturn.isError && (
                <p className="text-sm text-critical">
                  {declareReturn.error instanceof ApiError ? declareReturn.error.message : "حدث خطأ ما."}
                </p>
              )}
              {declareReturn.isSuccess && <p className="text-sm text-success">تم إرسال الإرجاع، وسيتم إعلام الإدارة.</p>}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {canEdit && (
          <Link href={`/orders/${order.id}/edit`}>
            <Button className="w-full">تعديل الطلب</Button>
          </Link>
        )}
        <Button variant="outline" className="w-full" onClick={() => void downloadPdf()}>
          تحميل بون الطلب
        </Button>
      </div>
    </div>
  );
}
