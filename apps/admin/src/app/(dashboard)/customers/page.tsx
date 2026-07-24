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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  status: string;
  segment: string;
  creditLimit: string;
  paymentTermsDays: number;
}

interface CustomerListResponse {
  data: Customer[];
  meta: { total: number };
}

// Numeric fields stay as plain strings at the form layer (HTML inputs are
// strings anyway) and are converted right before the API call — this keeps
// the form's input and output types identical, which is what the resolver
// requires.
const createCustomerSchema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  creditLimit: z.string().optional(),
  paymentTermsDays: z.string().optional(),
});

type CreateCustomerForm = z.infer<typeof createCustomerSchema>;

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-accent-ink bg-accent-soft";
  if (status === "BLOCKED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function CustomersPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useApiQuery<CustomerListResponse>(["customers", "list"], "/customers?pageSize=50");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerForm>({ resolver: zodResolver(createCustomerSchema) });

  const createCustomer = useMutation({
    mutationFn: (values: CreateCustomerForm) =>
      apiFetch<Customer>("/customers", accessToken, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          creditLimit: values.creditLimit ? Number(values.creditLimit) : undefined,
          paymentTermsDays: values.paymentTermsDays ? Number(values.paymentTermsDays) : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      reset();
      setShowForm(false);
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<Customer>(`/customers/${id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const canCreate = hasPermission("customers.create");
  const canApprove = hasPermission("customers.update");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} retailer accounts.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New customer"}</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createCustomer.mutate(values))}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Customer code</Label>
                <Input id="code" placeholder="CUST-0002" {...register("code")} />
                {errors.code && <p className="text-xs text-critical">{errors.code.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Business name</Label>
                <Input id="name" placeholder="Kadim Store" {...register("name")} />
                {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="creditLimit">Credit limit</Label>
                <Input id="creditLimit" type="number" step="0.01" {...register("creditLimit")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
                <Input id="paymentTermsDays" type="number" {...register("paymentTermsDays")} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create customer"}
                </Button>
                {createCustomer.isError && (
                  <p className="text-sm text-critical">
                    {createCustomer.error instanceof ApiError
                      ? createCustomer.error.message
                      : "Something went wrong."}
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
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Credit limit</th>
                <th className="px-5 py-3 font-medium text-right">Terms</th>
                {canApprove && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-muted">
                    No customers yet.
                  </td>
                </tr>
              )}
              {data?.data.map((customer) => (
                <tr key={customer.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-muted">{customer.code}</td>
                  <td className="px-5 py-3 font-medium text-ink">{customer.name}</td>
                  <td className="px-5 py-3 text-muted">{customer.segment}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{customer.creditLimit}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{customer.paymentTermsDays}d</td>
                  {canApprove && (
                    <td className="px-5 py-3">
                      {customer.status === "PENDING_APPROVAL" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: customer.id, status: "ACTIVE" })}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: customer.id, status: "BLOCKED" })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {customer.status === "ACTIVE" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={setStatus.isPending}
                          onClick={() => setStatus.mutate({ id: customer.id, status: "BLOCKED" })}
                        >
                          Block
                        </Button>
                      )}
                      {customer.status === "BLOCKED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={setStatus.isPending}
                          onClick={() => setStatus.mutate({ id: customer.id, status: "ACTIVE" })}
                        >
                          Unblock
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
