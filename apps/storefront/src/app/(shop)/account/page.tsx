"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  BLOCKED: "محظور",
  PENDING_APPROVAL: "قيد الموافقة",
};

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-success bg-success-soft";
  if (status === "BLOCKED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function AccountPage() {
  const { customer, user, logout, accessToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const changePassword = useMutation({
    mutationFn: () =>
      apiFetch<void>("/auth/change-password", accessToken, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">حسابي</h1>

      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">اسم النشاط التجاري</span>
            <span className="text-ink">{customer?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">رمز العميل</span>
            <span className="font-mono text-ink">{customer?.code ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">الهاتف</span>
            <span dir="ltr" className="text-ink">{customer?.phone ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">البريد الإلكتروني</span>
            <span className="text-ink">{customer?.email ?? user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">الحالة</span>
            {customer && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(customer.status)}`}>
                {STATUS_LABELS[customer.status] ?? customer.status}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>عناوين التوصيل</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!customer?.addresses.length && <p className="text-sm text-muted">لا توجد عناوين مسجلة بعد.</p>}
          {customer?.addresses.map((address) => (
            <div key={address.id} className="rounded-md border border-line p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{address.label}</span>
                {address.isDefault && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-ink">
                    افتراضي
                  </span>
                )}
              </div>
              <p className="text-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-muted">
                {address.city}
                {address.region ? `, ${address.region}` : ""}, {address.country}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePassword.mutate();
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={changePassword.isPending} className="w-fit">
              {changePassword.isPending ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
            </Button>
            {changePassword.isSuccess && <p className="text-sm text-success">تم تغيير كلمة المرور.</p>}
            {changePassword.isError && (
              <p className="text-sm text-critical">
                {changePassword.error instanceof ApiError ? changePassword.error.message : "حدث خطأ ما."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => void logout()} className="self-start">
        تسجيل الخروج
      </Button>
    </div>
  );
}
