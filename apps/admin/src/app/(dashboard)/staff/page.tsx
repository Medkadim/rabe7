"use client";

import { Fragment, useEffect, useState } from "react";
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
  deletedAt: string | null;
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

const createStaffSchema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.string().email("Enter a valid email address."),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    roleCode: z.string().min(1, "Required"),
  })
  // Sales reps sign in to their own app by phone number, not email — so
  // this is the one role where a phone number isn't optional.
  .refine((values) => values.roleCode !== "SALES_REPRESENTATIVE" || !!values.phone, {
    message: "Required for sales representatives — it's how they sign in to the sales app.",
    path: ["phone"],
  });
type CreateStaffForm = z.infer<typeof createStaffSchema>;

interface SalesTargets {
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
}

function TargetsEditor({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useApiQuery<SalesTargets>(["sales", "targets", userId], `/sales/targets/${userId}`);
  const [dailyTarget, setDailyTarget] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");

  useEffect(() => {
    if (!data) return;
    setDailyTarget(String(data.dailyTarget));
    setWeeklyTarget(String(data.weeklyTarget));
    setMonthlyTarget(String(data.monthlyTarget));
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<SalesTargets>(`/sales/targets/${userId}`, accessToken, {
        method: "PUT",
        body: JSON.stringify({
          dailyTarget: Number(dailyTarget) || 0,
          weeklyTarget: Number(weeklyTarget) || 0,
          monthlyTarget: Number(monthlyTarget) || 0,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales", "targets", userId] });
      onClose();
    },
  });

  return (
    <tr className="border-b border-line bg-brand-soft/40">
      <td colSpan={6} className="px-5 py-4">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`daily-${userId}`}>Daily CA target</Label>
              <Input
                id={`daily-${userId}`}
                type="number"
                min={0}
                step="0.01"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`weekly-${userId}`}>Weekly CA target</Label>
              <Input
                id={`weekly-${userId}`}
                type="number"
                min={0}
                step="0.01"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`monthly-${userId}`}>Monthly CA target</Label>
              <Input
                id={`monthly-${userId}`}
                type="number"
                min={0}
                step="0.01"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-32"
              />
            </div>
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save targets"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {save.isError && (
              <p className="text-sm text-critical">
                {save.error instanceof ApiError ? save.error.message : "Could not save targets."}
              </p>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-success bg-success-soft";
  if (status === "SUSPENDED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function StaffPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [targetsEditingId, setTargetsEditingId] = useState<string | null>(null);

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

  const reactivate = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/staff/${id}/reactivate`, accessToken, { method: "POST" }),
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
                <Label htmlFor="phone">Phone (required for sales reps)</Label>
                <Input id="phone" type="tel" placeholder="0612345678" {...register("phone")} />
                {errors.phone && <p className="text-xs text-critical">{errors.phone.message}</p>}
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
              {data?.map((member) => {
                const isSalesRep = member.roles.some((r) => r.role.code === "SALES_REPRESENTATIVE");
                return (
                  <Fragment key={member.id}>
                    <tr className="border-b border-line last:border-0">
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
                          <div className="flex justify-end gap-2">
                            {isSalesRep && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTargetsEditingId((current) => (current === member.id ? null : member.id))}
                              >
                                {targetsEditingId === member.id ? "Close" : "Set targets"}
                              </Button>
                            )}
                            {member.deletedAt ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={reactivate.isPending}
                                onClick={() => reactivate.mutate(member.id)}
                              >
                                Reactivate
                              </Button>
                            ) : (
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
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {targetsEditingId === member.id && (
                      <TargetsEditor userId={member.id} onClose={() => setTargetsEditingId(null)} />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {deactivate.isError && (
        <p className="text-sm text-critical">
          {deactivate.error instanceof ApiError ? deactivate.error.message : "Could not deactivate the account."}
        </p>
      )}
      {reactivate.isError && (
        <p className="text-sm text-critical">
          {reactivate.error instanceof ApiError ? reactivate.error.message : "Could not reactivate the account."}
        </p>
      )}
    </div>
  );
}
