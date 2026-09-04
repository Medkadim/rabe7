"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
  businessName: z.string().min(1, "هذا الحقل مطلوب"),
  firstName: z.string().min(1, "هذا الحقل مطلوب"),
  lastName: z.string().min(1, "هذا الحقل مطلوب"),
  phone: z.string().min(6, "أدخل رقم هاتف صحيح."),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."),
  email: z.union([z.string().email("أدخل بريدًا إلكترونيًا صالحًا."), z.literal("")]).optional(),
  addressLine1: z.string().min(1, "هذا الحقل مطلوب"),
  addressCity: z.string().min(1, "هذا الحقل مطلوب"),
});

// Single-market business — every address is in Morocco, so there's no
// reason to ask for a country the customer would just retype every time.
const CUSTOMER_COUNTRY = "المغرب";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerCustomer } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    try {
      await registerCustomer({
        businessName: values.businessName,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        password: values.password,
        email: values.email || undefined,
        address: {
          label: "المتجر",
          line1: values.addressLine1,
          city: values.addressCity,
          country: CUSTOMER_COUNTRY,
        },
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "حدث خطأ ما.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>أنشئ حسابك</CardTitle>
          <p className="mt-1 text-sm text-muted">
            سجّل للطلب عبر الإنترنت. يحتاج حسابك إلى موافقة سريعة قبل أن تتمكن من إرسال أول طلب — سنُعلمك بمجرد أن
            يصبح جاهزًا.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="businessName">اسم المتجر / النشاط التجاري</Label>
              <Input id="businessName" placeholder="متجر قديم" {...register("businessName")} />
              {errors.businessName && <p className="text-xs text-critical">{errors.businessName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-critical">{errors.firstName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-critical">{errors.lastName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                placeholder="0612345678"
                autoComplete="username"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-critical">{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-critical">{errors.email.message}</p>}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="addressLine1">عنوان التوصيل</Label>
              <Input id="addressLine1" placeholder="عنوان الشارع" {...register("addressLine1")} />
              {errors.addressLine1 && <p className="text-xs text-critical">{errors.addressLine1.message}</p>}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="addressCity">المدينة</Label>
              <Input id="addressCity" {...register("addressCity")} />
              {errors.addressCity && <p className="text-xs text-critical">{errors.addressCity.message}</p>}
            </div>

            {serverError && <p className="col-span-2 text-sm text-critical">{serverError}</p>}

            <div className="col-span-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-muted">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-medium text-accent-ink underline">
              سجّل الدخول
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
