"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
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
  taxAmount: string;
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

interface Invoice {
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  amountPaid: string;
  dueAt: string;
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
  placedAt: string | null;
  createdAt: string;
  customer: { name: string; code: string; phone: string | null; email: string | null };
  items: OrderItem[];
  statusHistory: StatusEvent[];
  invoice: Invoice | null;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "text-muted bg-line/40",
  PENDING: "text-warning bg-warning/10",
  CONFIRMED: "text-success bg-success-soft",
  PROCESSING: "text-success bg-success-soft",
  DELIVERED: "text-success bg-success-soft",
  CANCELLED: "text-critical bg-critical/10",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useApiQuery<OrderDetail>(["orders", "detail", id], `/orders/${id}`);

  const confirmOrder = useMutation({
    mutationFn: () => apiFetch(`/orders/${id}/confirm`, accessToken, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const cancelOrder = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${id}/cancel`, accessToken, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled from admin dashboard" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const downloadPdf = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/orders/${id}/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const canUpdate = hasPermission("orders.update");
  const canCancel = hasPermission("orders.cancel");

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!order) return <p className="text-sm text-muted">Order not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/orders")} className="text-sm text-muted hover:text-ink">
            ← Back to orders
          </button>
          <h1 className="mt-1 text-xl font-semibold text-ink">{order.orderNumber}</h1>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? ""}`}>
            {order.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (order.status === "DRAFT" || order.status === "PENDING") && (
            <Button variant="outline" onClick={() => confirmOrder.mutate()} disabled={confirmOrder.isPending}>
              Confirm
            </Button>
          )}
          {canCancel && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
            <Button variant="destructive" onClick={() => cancelOrder.mutate()} disabled={cancelOrder.isPending}>
              Cancel
            </Button>
          )}
          <Button variant="ghost" onClick={downloadPdf} aria-label="Download PDF">
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(confirmOrder.isError || cancelOrder.isError) && (
        <p className="text-sm text-critical">
          {confirmOrder.error instanceof ApiError
            ? confirmOrder.error.message
            : cancelOrder.error instanceof ApiError
              ? cancelOrder.error.message
              : "Something went wrong."}
        </p>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
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
                    <th className="px-5 py-2 font-medium text-right">Discount</th>
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
                      <td className="px-5 py-3 text-right tabular-nums">{item.discountAmount}</td>
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

          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {order.statusHistory.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus}
                    {event.note && <span className="ml-2 text-muted">({event.note})</span>}
                  </span>
                  <span className="text-xs text-muted">{new Date(event.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <p className="font-medium text-ink">{order.customer.name}</p>
              <p className="text-muted">{order.customer.code}</p>
              {order.customer.phone && <p className="text-muted">{order.customer.phone}</p>}
              {order.customer.email && <p className="text-muted">{order.customer.email}</p>}
              {order.notes && (
                <>
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted">Notes</p>
                  <p className="text-ink">{order.notes}</p>
                </>
              )}
            </CardContent>
          </Card>

          {order.invoice && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <p className="font-mono text-xs text-muted">{order.invoice.invoiceNumber}</p>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span className="text-ink">{order.invoice.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Paid</span>
                  <span className="tabular-nums text-ink">
                    {order.invoice.amountPaid} / {order.invoice.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Due</span>
                  <span className="text-ink">{new Date(order.invoice.dueAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
