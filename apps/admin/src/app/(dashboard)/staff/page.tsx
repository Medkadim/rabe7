"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  roles: { role: { code: string; name: string } }[];
}

// RETAILER isn't offered — a customer's own login comes from
// self-registration in the storefront, never from this screen.
const ROLE_OPTIONS = [
  { code: "SALES_REPRESENTATIVE", label: "Sales representative" },
  { code: "WAREHOUSE_EMPLOYEE", label: "Warehouse employee" },
  { code: "DELIVERY_DRIVER", label: "Delivery driver" },
  { code: "DISTRIBUTOR_MANAGER", label: "Distributor manager" },
  { code: "SUPER_ADMIN", label: "Super admin" },
];

function roleLabel(code: string): string {
  return ROLE_OPTIONS.find((r) => r.code === code)?.label ?? code;
}

const createStaffSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roleCode: z.string().min(1, "Required"),
});
type CreateStaffForm = z.infer<typeof createStaffSchema>;

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-success bg-success-soft";
  if (status === "SUSPENDED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function StaffPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useApiQuery<StaffMember[]>(["staff", "list"], "/staff");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { roleCode: "DELIVERY_DRIVER" },
  });

  const createStaff = useMutation({
    mutationFn: (values: CreateStaffForm) =>
      apiFetch<StaffMember>("/staff", accessToken, {
        method: "POST",
        body: JSON.stringify({ ...values, phone: values.phone || undefined }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      reset({ firstName: "", lastName: "", email: "", phone: "", password: "", roleCode: "DELIVERY_DRIVER" });
      setShowForm(false);
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/staff/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const canManage = hasPermission("users.manage");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Staff</h1>
          <p className="text-sm text-muted">
            {data?.length ?? 0} accounts — sales reps, warehouse staff, delivery drivers, and admins.
          </p>
        </div>
        {canManage && <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New staff account"}</Button>}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New staff account</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createStaff.mutate(values))}
              className="grid grid-cols-2 gap-4"
            >
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
                <Label htmlFor="email">Email (used to sign in)</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-critical">{errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" placeholder="0612345678" {...register("phone")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="roleCode">Role</Label>
                <Select id="roleCode" {...register("roleCode")}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create account"}
                </Button>
                {createStaff.isError && (
                  <p className="text-sm text-critical">
                    {createStaff.error instanceof ApiError ? createStaff.error.message : "Something went wrong."}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    No staff accounts yet.
                  </td>
                </tr>
              )}
              {data?.map((member) => (
                <tr key={member.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-5 py-3 text-muted">{member.email ?? "—"}</td>
                  <td className="px-5 py-3 text-muted" dir="ltr">
                    {member.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {member.roles.map((r) => roleLabel(r.role.code)).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deactivate.isPending}
                        onClick={() => {
                          if (window.confirm(`Deactivate ${member.firstName} ${member.lastName}? They won't be able to sign in anymore.`)) {
                            deactivate.mutate(member.id);
                          }
                        }}
                      >
                        Deactivate
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {deactivate.isError && (
        <p className="text-sm text-critical">
          {deactivate.error instanceof ApiError ? deactivate.error.message : "Could not deactivate the account."}
        </p>
      )}
    </div>
  );
}
