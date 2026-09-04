"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaslaMark } from "@/components/wasla-mark";

const loginSchema = z.object({
  email: z.string().email("أدخل بريدًا إلكترونيًا صالحًا."),
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
      await login(values.email, values.password);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "حدث خطأ ما.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <WaslaMark size={26} />
            <span className="font-display text-lg font-semibold text-ink">Waslak — السائق</span>
          </div>
          <CardTitle>تسجيل الدخول</CardTitle>
          <p className="mt-1 text-sm text-muted">اعرض طلباتك المخصصة لك وابدأ التوصيل.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" dir="ltr" autoComplete="username" {...register("email")} />
              {errors.email && <p className="text-xs text-critical">{errors.email.message}</p>}
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
        </CardContent>
      </Card>
    </main>
  );
}
