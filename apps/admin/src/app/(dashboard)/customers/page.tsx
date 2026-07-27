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
const customerFormSchema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  creditLimit: z.string().optional(),
  paymentTermsDays: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerFormSchema>;

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-success bg-success-soft";
  if (status === "BLOCKED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function CustomersPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useApiQuery<CustomerListResponse>(["customers", "list"], "/customers?pageSize=50");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerFormSchema) });

  function startCreate() {
    setEditingId(null);
    reset({ code: "", name: "", phone: "", creditLimit: "", paymentTermsDays: "" });
    setShowForm(true);
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    reset({
      code: customer.code,
      name: customer.name,
      phone: customer.phone ?? "",
      creditLimit: customer.creditLimit,
      paymentTermsDays: String(customer.paymentTermsDays),
    });
    setShowForm(true);
  }

  const saveCustomer = useMutation({
    mutationFn: (values: CustomerForm) => {
      const body = JSON.stringify({
        ...values,
        creditLimit: values.creditLimit ? Number(values.creditLimit) : undefined,
        paymentTermsDays: values.paymentTermsDays ? Number(values.paymentTermsDays) : undefined,
      });
      return editingId
        ? apiFetch<Customer>(`/customers/${editingId}`, accessToken, { method: "PATCH", body })
        : apiFetch<Customer>("/customers", accessToken, { method: "POST", body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      reset();
      setEditingId(null);
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

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/customers/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const canCreate = hasPermission("customers.create");
  const canUpdate = hasPermission("customers.update");
  const canDelete = hasPermission("customers.delete");
  const showActions = canUpdate || canDelete;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} retailer accounts.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
              } else {
                startCreate();
              }
            }}
          >
            {showForm ? "Cancel" : "New customer"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit customer" : "New customer"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => saveCustomer.mutate(values))}
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
                  {isSubmitting ? "Saving…" : editingId ? "Save changes" : "Create customer"}
                </Button>
                {saveCustomer.isError && (
                  <p className="text-sm text-critical">
                    {saveCustomer.error instanceof ApiError ? saveCustomer.error.message : "Something went wrong."}
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
                {showActions && <th className="px-5 py-3 font-medium">Actions</th>}
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
                  {showActions && (
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {canUpdate && customer.status === "PENDING_APPROVAL" && (
                          <>
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
                          </>
                        )}
                        {canUpdate && customer.status === "ACTIVE" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: customer.id, status: "BLOCKED" })}
                          >
                            Block
                          </Button>
                        )}
                        {canUpdate && customer.status === "BLOCKED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: customer.id, status: "ACTIVE" })}
                          >
                            Unblock
                          </Button>
                        )}
                        {canUpdate && (
                          <Button variant="outline" size="sm" onClick={() => startEdit(customer)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deleteCustomer.isPending}
                            onClick={() => {
                              if (window.confirm(`Archive ${customer.name}? This can be undone from the database if needed, but not from this screen.`)) {
                                deleteCustomer.mutate(customer.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {deleteCustomer.isError && (
        <p className="text-sm text-critical">
          {deleteCustomer.error instanceof ApiError ? deleteCustomer.error.message : "Could not archive the customer."}
        </p>
      )}
    </div>
  );
}
