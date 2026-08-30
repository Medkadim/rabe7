"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, uploadImage, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const newClientSchema = z.object({
  name: z.string().min(1, "مطلوب"),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  phone: z.string().min(1, "مطلوب لإنشاء حساب دخول للعميل"),
  password: z.string().min(8, "8 خانات على الأقل"),
  line1: z.string().min(1, "مطلوب"),
  city: z.string().min(1, "مطلوب"),
  region: z.string().optional(),
});
type NewClientForm = z.infer<typeof newClientSchema>;

interface CreatedCustomer {
  id: string;
}

// An easy-to-read 8-digit code the rep can hand the client on the spot —
// they log in with it right away and can change it later from the app
// (see the storefront's account page).
function generateTempPassword(): string {
  return String(Math.floor(10_000_000 + Math.random() * 90_000_000));
}

export default function NewClientPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [photo, setPhoto] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  // Shown after creation so the rep has a moment to read the credentials
  // out to the client (or write them down) before moving on — this is the
  // only place that password is ever visible, the server never echoes it
  // back.
  const [created, setCreated] = useState<{ id: string; phone: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    defaultValues: { password: generateTempPassword() },
  });

  const create = useMutation({
    mutationFn: async (values: NewClientForm) => {
      let photoUrl: string | undefined;
      if (photo) {
        const uploaded = await uploadImage(photo, accessToken);
        photoUrl = uploaded.url;
      }
      const customer = await apiFetch<CreatedCustomer>("/customers", accessToken, {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          legalName: values.legalName || undefined,
          taxId: values.taxId || undefined,
          phone: values.phone,
          password: values.password,
          photoUrl,
          assignedRepId: user?.userId,
          addresses: [
            {
              label: "المحل",
              line1: values.line1,
              city: values.city,
              region: values.region || undefined,
              country: "المغرب",
              lat: coords?.lat,
              lng: coords?.lng,
              isDefault: true,
            },
          ],
        }),
      });
      return { customer, phone: values.phone, password: values.password };
    },
    onSuccess: ({ customer, phone, password }) => {
      setCreated({ id: customer.id, phone, password });
    },
  });

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-ink">تم إنشاء الحساب</h1>
        <Card>
          <CardHeader>
            <CardTitle>معلومات الدخول — أعطها للعميل الآن</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted">
              يمكن للعميل تحميل التطبيق وتسجيل الدخول بهذه المعلومات، ثم تغيير كلمة المرور من حسابه لاحقًا.
            </p>
            <div className="flex items-center justify-between rounded-md border border-line p-3">
              <span className="text-muted">الهاتف</span>
              <span dir="ltr" className="font-mono text-ink">{created.phone}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-line p-3">
              <span className="text-muted">كلمة المرور المؤقتة</span>
              <span dir="ltr" className="font-mono text-ink">{created.password}</span>
            </div>
            <Button onClick={() => router.push(`/orders/new?customerId=${created.id}`)} className="w-full">
              متابعة إلى إنشاء الطلب
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationError("الموقع الجغرافي غير مدعوم على هذا الجهاز.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("تعذر الحصول على الموقع. تحقق من إذن الموقع.");
        setLocating(false);
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">عميل جديد</h1>

      <Card>
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => create.mutate(values))} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="legalName">اسم الشركة (اختياري)</Label>
              <Input id="legalName" {...register("legalName")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxId">ICE (اختياري)</Label>
              <Input id="taxId" dir="ltr" {...register("taxId")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" type="tel" dir="ltr" placeholder="0612345678" {...register("phone")} />
              {errors.phone && <p className="text-xs text-critical">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">كلمة المرور المؤقتة</Label>
              <Input id="password" dir="ltr" className="font-mono" {...register("password")} />
              <p className="text-xs text-muted">
                أعطِ هذا الرمز للعميل حتى يتمكن من تسجيل الدخول — يمكنه تغييره لاحقًا من حسابه.
              </p>
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="line1">العنوان</Label>
              <Input id="line1" {...register("line1")} />
              {errors.line1 && <p className="text-xs text-critical">{errors.line1.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">المدينة</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-critical">{errors.city.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="region">الجهة (اختياري)</Label>
              <Input id="region" {...register("region")} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>الموقع الجغرافي (اختياري)</Label>
              <Button type="button" variant="outline" onClick={locate} disabled={locating} className="w-fit">
                {locating ? "جارٍ التحديد…" : coords ? "تم تحديد الموقع ✓" : "تحديد الموقع الحالي"}
              </Button>
              {locationError && <p className="text-xs text-critical">{locationError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="photo">صورة المحل (اختياري)</Label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="text-sm text-muted"
              />
            </div>

            {create.isError && (
              <p className="text-sm text-critical">
                {create.error instanceof ApiError ? create.error.message : "حدث خطأ ما."}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting || create.isPending} className="w-full">
              {isSubmitting || create.isPending ? "جارٍ الإنشاء…" : "إنشاء العميل ومتابعة الطلب"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
