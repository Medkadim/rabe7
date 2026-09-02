"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useApiQuery } from "@/lib/use-api-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

// An easy-to-read 8-digit code the rep can hand the client on the spot.
function generateTempPassword(): string {
  return String(Math.floor(10_000_000 + Math.random() * 90_000_000));
}

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
  const { accessToken } = useAuth();
  const { data: customer, isLoading } = useApiQuery<CustomerDetail>(["customers", id], `/customers/${id}`);
  const { data: orders } = useApiQuery<OrderListResponse>(
    ["orders", "by-customer", id],
    `/orders?customerId=${id}&pageSize=20`,
  );

  const [showReset, setShowReset] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const resetCustomerPassword = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/customers/${id}/reset-password`, accessToken, {
        method: "POST",
        body: JSON.stringify({ phone: resetPhone, password: resetPassword }),
      }),
    onSuccess: () => setResetDone(true),
  });

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
          <CardTitle>كلمة مرور العميل</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!showReset && (
            <Button
              variant="outline"
              className="w-fit"
              onClick={() => {
                setResetPhone(customer.phone ?? "");
                setResetPassword(generateTempPassword());
                setResetDone(false);
                setShowReset(true);
              }}
            >
              إعادة تعيين كلمة المرور
            </Button>
          )}
          {showReset && resetDone && (
            <>
              <p className="text-sm text-muted">أعطِ هذه المعلومات للعميل — يمكنه تغييرها لاحقًا من حسابه.</p>
              <div className="flex items-center justify-between rounded-md border border-line p-3 text-sm">
                <span className="text-muted">الهاتف</span>
                <span dir="ltr" className="font-mono text-ink">{resetPhone}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-line p-3 text-sm">
                <span className="text-muted">كلمة المرور المؤقتة</span>
                <span dir="ltr" className="font-mono text-ink">{resetPassword}</span>
              </div>
              <Button variant="outline" className="w-fit" onClick={() => setShowReset(false)}>
                تم
              </Button>
            </>
          )}
          {showReset && !resetDone && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="resetPhone">الهاتف</Label>
                <Input id="resetPhone" dir="ltr" value={resetPhone} onChange={(e) => setResetPhone(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="resetPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="resetPassword"
                  dir="ltr"
                  className="font-mono"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button disabled={resetCustomerPassword.isPending} onClick={() => resetCustomerPassword.mutate()}>
                  {resetCustomerPassword.isPending ? "جارٍ الحفظ…" : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setShowReset(false)}>
                  إلغاء
                </Button>
              </div>
              {resetCustomerPassword.isError && (
                <p className="text-sm text-critical">
                  {resetCustomerPassword.error instanceof ApiError ? resetCustomerPassword.error.message : "حدث خطأ ما."}
                </p>
              )}
            </>
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
