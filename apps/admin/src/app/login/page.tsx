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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  twoFactorCode: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values.email, values.password, values.twoFactorCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      if (message.toLowerCase().includes("two-factor")) {
        setNeedsTwoFactor(true);
      }
      setServerError(message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to rabe7</CardTitle>
          <p className="mt-1 text-sm text-muted">Your distributor's order management platform.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" {...register("email")} />
              {errors.email && <p className="text-xs text-critical">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>

            {needsTwoFactor && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="twoFactorCode">Authenticator code</Label>
                <Input id="twoFactorCode" inputMode="numeric" maxLength={6} {...register("twoFactorCode")} />
              </div>
            )}

            {serverError && !needsTwoFactor && <p className="text-sm text-critical">{serverError}</p>}
            {needsTwoFactor && (
              <p className="text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
