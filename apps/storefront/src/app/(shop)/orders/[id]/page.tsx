"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
  product: { name: string; sku: string; unit: string };
}

interface StatusEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusEvent[];
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "text-muted bg-line/40",
  PENDING: "text-warning bg-warning/10",
  CONFIRMED: "text-success bg-success-soft",
  PROCESSING: "text-success bg-success-soft",
  DELIVERED: "text-success bg-success-soft",
  CANCELLED: "text-critical bg-critical/10",
};

// The order the statuses normally progress through — used to render the
// timeline so a customer sees where their order is, not just a status word.
const STATUS_SEQUENCE = ["DRAFT", "PENDING", "CONFIRMED", "PROCESSING", "DELIVERED"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useApiQuery<OrderDetail>(["orders", "detail", id], `/orders/${id}`);

  const cancelOrder = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${id}/cancel`, accessToken, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled by customer" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!order) return <p className="text-sm text-muted">Order not found.</p>;

  const canCancel = hasPermission("orders.cancel") && order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const currentStep = STATUS_SEQUENCE.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/orders" className="text-sm text-muted hover:text-ink">
          ← Back to my orders
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{order.orderNumber}</h1>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? ""}`}>
              {order.status}
            </span>
          </div>
          {canCancel && (
            <Button variant="destructive" onClick={() => cancelOrder.mutate()} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
            </Button>
          )}
        </div>
      </div>

      {cancelOrder.isError && (
        <p className="text-sm text-critical">
          {cancelOrder.error instanceof ApiError ? cancelOrder.error.message : "Could not cancel the order."}
        </p>
      )}

      {!isCancelled && (
        <Card>
          <CardContent className="py-5">
            <ol className="flex items-center">
              {STATUS_SEQUENCE.map((step, index) => {
                const reached = currentStep >= index;
                return (
                  <li key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          reached ? "bg-success text-white" : "border border-line bg-paper-raised text-muted"
                        }`}
                      >
                        {reached ? "✓" : ""}
                      </div>
                      <span className={`whitespace-nowrap text-xs ${reached ? "font-medium text-ink" : "text-muted"}`}>
                        {step}
                      </span>
                    </div>
                    {index < STATUS_SEQUENCE.length - 1 && (
                      <div className={`mx-2 h-0.5 flex-1 ${currentStep > index ? "bg-success" : "bg-line"}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-5 py-2 font-medium text-right">Qty</th>
                <th className="px-5 py-2 font-medium text-right">Unit price</th>
                <th className="px-5 py-2 font-medium text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{item.product.name}</p>
                    <p className="text-xs text-muted">{item.product.sku}</p>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {item.quantity} {item.product.unit}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{item.unitPrice}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-1 border-t border-line p-5 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Discount</span>
              <span className="tabular-nums">-{order.discountTotal}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax</span>
              <span className="tabular-nums">{order.taxTotal}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span className="tabular-nums">{order.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink">{order.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
