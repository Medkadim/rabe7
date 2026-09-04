"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface Address {
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  country: string;
  isDefault: boolean;
  lat: number | null;
  lng: number | null;
}
interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: { name: string; unit: string };
}
interface DeliveryDetail {
  id: string;
  status: string;
  cashCollected: string | null;
  notes: string | null;
  order: {
    id: string;
    orderNumber: string;
    total: string;
    customer: { name: string; phone: string | null; addresses: Address[] };
    items: OrderItem[];
  };
}

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التسليم",
  PARTIALLY_DELIVERED: "تسليم جزئي",
  FAILED: "فشل التسليم",
};

function mapsUrl(address?: Address): string | null {
  if (!address) return null;
  if (address.lat != null && address.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`;
  }
  const query = `${address.line1}, ${address.city}, ${address.country}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [cashCollected, setCashCollected] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);

  const { data: delivery, isLoading } = useApiQuery<DeliveryDetail>(["delivery", "detail", id], `/delivery/deliveries/${id}`);

  const updateStatus = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/delivery/deliveries/${id}/status`, accessToken, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
    },
  });

  if (isLoading) return <p className="text-sm text-muted">جارٍ التحميل…</p>;
  if (!delivery) return <p className="text-sm text-muted">لم يتم العثور على هذا التسليم.</p>;

  const { order } = delivery;
  const address = order.customer.addresses.find((a) => a.isDefault) ?? order.customer.addresses[0];
  const maps = mapsUrl(address);
  const isFinal = ["DELIVERED", "PARTIALLY_DELIVERED", "FAILED"].includes(delivery.status);

  const downloadPdf = async () => {
    setPdfError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/orders/${order.id}/pdf`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setPdfError("تعذر إنشاء بون التسليم.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/deliveries" className="text-sm text-muted hover:text-ink">
          → العودة إلى جولاتي
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">{order.orderNumber}</h1>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-ink">
            {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-ink">{order.customer.name}</p>
          {order.customer.phone && (
            <a href={`tel:${order.customer.phone}`} dir="ltr" className="w-fit text-accent-ink underline">
              {order.customer.phone}
            </a>
          )}
          {address && (
            <p className="text-muted">
              {address.line1}
              {address.line2 ? `، ${address.line2}` : ""}، {address.city}
            </p>
          )}
          {maps && (
            <a href={maps} target="_blank" rel="noreferrer" className="w-fit text-accent-ink underline">
              فتح في الخرائط
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>محتوى الطلب</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{item.product.name}</p>
                    <p className="text-xs text-muted">
                      {item.quantity} {item.product.unit}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-left font-mono tabular-nums">{formatPrice(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line p-4">
            <span className="text-sm text-muted">المجموع الكلي</span>
            <span className="font-mono text-lg font-bold text-ink">{formatPrice(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={downloadPdf} className="self-start">
        تحميل بون التسليم
      </Button>
      {pdfError && <p className="text-sm text-critical">{pdfError}</p>}

      {!isFinal && (
        <Card>
          <CardHeader>
            <CardTitle>تحديث حالة التسليم</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {delivery.status === "PENDING" && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => updateStatus.mutate({ status: "OUT_FOR_DELIVERY" })}
                disabled={updateStatus.isPending}
              >
                بدء التوصيل
              </Button>
            )}
            {delivery.status === "OUT_FOR_DELIVERY" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cashCollected">المبلغ المحصّل نقدًا (اختياري)</Label>
                  <Input
                    id="cashCollected"
                    type="number"
                    step="0.01"
                    dir="ltr"
                    placeholder={order.total}
                    value={cashCollected}
                    onChange={(e) => setCashCollected(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({
                        status: "DELIVERED",
                        cashCollected: cashCollected ? Number(cashCollected) : Number(order.total),
                      })
                    }
                  >
                    تم التسليم
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ status: "FAILED" })}
                  >
                    فشل التسليم
                  </Button>
                </div>
              </>
            )}
            {updateStatus.isError && (
              <p className="text-sm text-critical">
                {updateStatus.error instanceof ApiError ? updateStatus.error.message : "حدث خطأ ما."}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
