"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface CustomerAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  isDefault: boolean;
}

interface CustomerDetail {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  status: string;
  photoUrl: string | null;
  addresses: CustomerAddress[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
}

interface OrderListResponse {
  data: Order[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغى",
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useApiQuery<CustomerDetail>(["customers", id], `/customers/${id}`);
  const { data: orders } = useApiQuery<OrderListResponse>(
    ["orders", "by-customer", id],
    `/orders?customerId=${id}&pageSize=20`,
  );

  if (isLoading) return <p className="text-sm text-muted">جارٍ التحميل…</p>;
  if (!customer) return <p className="text-sm text-critical">تعذر العثور على العميل.</p>;

  const address = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{customer.name}</h1>
          {customer.legalName && <p className="text-sm text-muted">{customer.legalName}</p>}
        </div>
        <Link href={`/orders/new?customerId=${customer.id}`}>
          <Button>طلب جديد</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {customer.phone && (
            <p>
              <span className="text-muted">الهاتف: </span>
              <a href={`tel:${customer.phone}`} dir="ltr" className="text-brand-ink">
                {customer.phone}
              </a>
            </p>
          )}
          {customer.taxId && (
            <p>
              <span className="text-muted">ICE: </span>
              <span dir="ltr">{customer.taxId}</span>
            </p>
          )}
          {address && (
            <p>
              <span className="text-muted">العنوان: </span>
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}, {address.city}
              {address.region ? `, ${address.region}` : ""}
            </p>
          )}
          {customer.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customer.photoUrl} alt={customer.name} className="mt-2 h-40 w-full rounded-md object-cover" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الطلبات السابقة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {!orders?.data.length && <p className="text-sm text-muted">لا توجد طلبات بعد.</p>}
          {orders?.data.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between border-b border-line py-2 last:border-0 hover:bg-brand-soft/40"
            >
              <div>
                <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
                <p className="text-xs text-muted">{ORDER_STATUS_LABELS[order.status] ?? order.status}</p>
              </div>
              <p className="text-sm font-medium text-ink">{formatPrice(order.total)}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
