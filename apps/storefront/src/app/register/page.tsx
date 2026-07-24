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
  businessName: z.string().min(1, "Required"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional(),
  addressLine1: z.string().min(1, "Required"),
  addressCity: z.string().min(1, "Required"),
  addressCountry: z.string().min(1, "Required"),
});

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
        email: values.email,
        password: values.password,
        phone: values.phone,
        address: {
          label: "Shop",
          line1: values.addressLine1,
          city: values.addressCity,
          country: values.addressCountry,
        },
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Sign up to order online. Your account needs a quick approval before you can place your first order —
            we'll let you know as soon as it's ready.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="businessName">Shop / business name</Label>
              <Input id="businessName" placeholder="Kadim Store" {...register("businessName")} />
              {errors.businessName && <p className="text-xs text-critical">{errors.businessName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-critical">{errors.firstName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-critical">{errors.lastName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" {...register("email")} />
              {errors.email && <p className="text-xs text-critical">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="addressLine1">Delivery address</Label>
              <Input id="addressLine1" placeholder="Street address" {...register("addressLine1")} />
              {errors.addressLine1 && <p className="text-xs text-critical">{errors.addressLine1.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addressCity">City</Label>
              <Input id="addressCity" {...register("addressCity")} />
              {errors.addressCity && <p className="text-xs text-critical">{errors.addressCity.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addressCountry">Country</Label>
              <Input id="addressCountry" {...register("addressCountry")} />
              {errors.addressCountry && <p className="text-xs text-critical">{errors.addressCountry.message}</p>}
            </div>

            {serverError && <p className="col-span-2 text-sm text-critical">{serverError}</p>}

            <div className="col-span-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent-ink underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
