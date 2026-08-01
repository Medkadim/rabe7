"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface Delivery {
  id: string;
  sequence: number | null;
  status: string;
  order: {
    orderNumber: string;
    total: string;
    customer: { name: string; addresses: { city: string; line1: string; isDefault: boolean }[] };
  };
}
interface Route {
  id: string;
  name: string;
  scheduledDate: string;
  status: string;
  deliveries: Delivery[];
}

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التسليم",
  PARTIALLY_DELIVERED: "تسليم جزئي",
  FAILED: "فشل التسليم",
};

const DELIVERY_STATUS_STYLE: Record<string, string> = {
  PENDING: "text-muted bg-line/40",
  OUT_FOR_DELIVERY: "text-warning bg-warning/10",
  DELIVERED: "text-success bg-success-soft",
  PARTIALLY_DELIVERED: "text-warning bg-warning/10",
  FAILED: "text-critical bg-critical/10",
};

function stopAddress(delivery: Delivery): string {
  const address = delivery.order.customer.addresses.find((a) => a.isDefault) ?? delivery.order.customer.addresses[0];
  return address ? `${address.line1}، ${address.city}` : "لا يوجد عنوان مسجل";
}

export default function DeliveriesPage() {
  const { data: routes, isLoading } = useApiQuery<Route[]>(["delivery", "my-routes"], "/delivery/my-routes");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">جولاتي</h1>
        <p className="text-sm text-muted">الطلبات المخصصة لك للتوصيل.</p>
      </div>

      {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!isLoading && routes?.length === 0 && <p className="text-sm text-muted">لا توجد جولات مخصصة لك بعد.</p>}

      <div className="flex flex-col gap-4">
        {routes?.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <CardTitle>{route.name}</CardTitle>
              <p className="text-sm text-muted">{new Date(route.scheduledDate).toLocaleDateString("ar-MA")}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-0">
              {route.deliveries.length === 0 && (
                <p className="px-5 pb-4 text-sm text-muted">لا توجد طلبات على هذه الجولة بعد.</p>
              )}
              <div className="divide-y divide-line">
                {route.deliveries.map((delivery) => (
                  <Link
                    key={delivery.id}
                    href={`/deliveries/${delivery.id}`}
                    className="flex flex-col gap-1.5 px-5 py-4 active:bg-brand-soft"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">{delivery.order.customer.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${DELIVERY_STATUS_STYLE[delivery.status] ?? ""}`}
                      >
                        {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>{stopAddress(delivery)}</span>
                      <span className="tabular-nums text-ink">{formatPrice(delivery.order.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
