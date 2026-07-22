"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  customer: { name: string; code: string };
  createdAt: string;
}

interface OrderListResponse {
  data: Order[];
  meta: { total: number };
}

interface Customer {
  id: string;
  code: string;
  name: string;
}
interface Product {
  id: string;
  sku: string;
  name: string;
}
interface CustomerListResponse {
  data: Customer[];
}
interface ProductListResponse {
  data: Product[];
}

const createOrderSchema = z.object({
  customerId: z.string().min(1, "Choose a customer"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Choose a product"),
        quantity: z.string().min(1, "Required"),
      }),
    )
    .min(1, "Add at least one line"),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "text-muted bg-line/40",
  PENDING: "text-warning bg-warning/10",
  CONFIRMED: "text-accent-ink bg-accent-soft",
  PROCESSING: "text-accent-ink bg-accent-soft",
  DELIVERED: "text-accent-ink bg-accent-soft",
  CANCELLED: "text-critical bg-critical/10",
};

export default function OrdersPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const { data, isLoading } = useApiQuery<OrderListResponse>(["orders", "list"], "/orders?pageSize=50");
  const { data: customers } = useApiQuery<CustomerListResponse>(
    ["customers", "for-select"],
    "/customers?pageSize=100",
  );
  const { data: products } = useApiQuery<ProductListResponse>(["products", "for-select"], "/products?pageSize=100");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { customerId: "", items: [{ productId: "", quantity: "1" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const createOrder = useMutation({
    mutationFn: (values: CreateOrderForm) =>
      apiFetch<Order>("/orders", accessToken, {
        method: "POST",
        body: JSON.stringify({
          customerId: values.customerId,
          items: values.items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      reset({ customerId: "", items: [{ productId: "", quantity: "1" }] });
      setShowForm(false);
    },
  });

  const confirmOrder = useMutation({
    mutationFn: (id: string) => apiFetch(`/orders/${id}/confirm`, accessToken, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const cancelOrder = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/orders/${id}/cancel`, accessToken, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled from admin dashboard" }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const downloadPdf = async (order: Order) => {
    setPdfError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/orders/${order.id}/pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not generate the PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setPdfError(`Failed to download PDF for ${order.orderNumber}.`);
    }
  };

  const canCreate = hasPermission("orders.create");
  const canUpdate = hasPermission("orders.update");
  const canCancel = hasPermission("orders.cancel");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Orders</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} orders placed.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New order"}</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((values) => createOrder.mutate(values))} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 max-w-sm">
                <Label htmlFor="customerId">Customer</Label>
                <Select id="customerId" {...register("customerId")}>
                  <option value="">Select a customer…</option>
                  {customers?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
                {errors.customerId && <p className="text-xs text-critical">{errors.customerId.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Line items</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <Select className="flex-1" {...register(`items.${index}.productId`)}>
                      <option value="">Select a product…</option>
                      {products?.data.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      className="w-24"
                      placeholder="Qty"
                      {...register(`items.${index}.quantity`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {errors.items?.message && <p className="text-xs text-critical">{errors.items.message}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => append({ productId: "", quantity: "1" })}
                >
                  <Plus className="h-4 w-4" /> Add line
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create draft order"}
                </Button>
                {createOrder.isError && (
                  <p className="text-sm text-critical">
                    {createOrder.error instanceof ApiError ? createOrder.error.message : "Something went wrong."}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pdfError && <p className="text-sm text-critical">{pdfError}</p>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
              {data?.data.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-muted">{order.orderNumber}</td>
                  <td className="px-5 py-3 font-medium text-ink">{order.customer.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? ""}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{order.total}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate && (order.status === "DRAFT" || order.status === "PENDING") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmOrder.mutate(order.id)}
                          disabled={confirmOrder.isPending}
                        >
                          Confirm
                        </Button>
                      )}
                      {canCancel && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelOrder.mutate(order.id)}
                          disabled={cancelOrder.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => downloadPdf(order)} aria-label="Download PDF">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {confirmOrder.isError && (
        <p className="text-sm text-critical">
          {confirmOrder.error instanceof ApiError ? confirmOrder.error.message : "Could not confirm the order."}
        </p>
      )}
    </div>
  );
}
