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

const loginSchema = z.object({
  phone: z.string().min(6, "أدخل رقم هاتف صحيح."),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values.phone, values.password);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "حدث خطأ ما.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>سجّل الدخول لطلب المنتجات</CardTitle>
          <p className="mt-1 text-sm text-muted">اطلب من الموزع الخاص بك في أي وقت.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>

            {serverError && <p className="text-sm text-critical">{serverError}</p>}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted">
            جديد هنا؟{" "}
            <Link href="/register" className="font-medium text-accent-ink underline">
              أنشئ حسابًا
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
