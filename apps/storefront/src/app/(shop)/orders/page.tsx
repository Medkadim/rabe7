"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApiQuery } from "@/lib/use-api-query";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
}

interface OrderListResponse {
  data: Order[];
  meta: { total: number };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغى",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function statusColor(status: string) {
  if (status === "DELIVERED" || status === "CONFIRMED") return "text-success bg-success-soft";
  if (status === "CANCELLED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function OrdersPage() {
  const router = useRouter();
  const { data, isLoading } = useApiQuery<OrderListResponse>(["orders", "mine"], "/orders?pageSize=50");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">طلباتي</h1>

      {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!isLoading && data?.data.length === 0 && <p className="text-sm text-muted">لم تقم بإرسال أي طلب بعد.</p>}

      <Card>
        {/* Stacked cards on narrow screens — a 4-column table forces sideways
            scrolling on a phone, which buries the total off-screen. */}
        <div className="divide-y divide-line sm:hidden">
          {data?.data.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex flex-col gap-2 p-4 active:bg-brand-soft">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">{order.orderNumber}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="font-medium tabular-nums text-ink">{formatPrice(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">الطلب</th>
                <th className="px-5 py-3 font-medium">التاريخ</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium text-right">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-brand-soft"
                >
                  <td className="px-5 py-3 font-mono text-xs text-accent-ink underline">{order.orderNumber}</td>
                  <td className="px-5 py-3 text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
