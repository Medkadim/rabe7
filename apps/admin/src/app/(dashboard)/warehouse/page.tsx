"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useApiQuery } from "@/lib/use-api-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
}
interface ProductListResponse {
  data: Product[];
}
interface Movement {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  referenceType: string | null;
  createdAt: string;
  product: { name: string; sku: string };
}
interface MovementListResponse {
  data: Movement[];
  meta: { total: number };
}
interface Return {
  id: string;
  reason: string;
  status: string;
  customer: { name: string };
  items: { product: { name: string }; quantity: number; condition: string }[];
}
interface ReturnListResponse {
  data: Return[];
}

const stockActionSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  quantity: z.string().min(1, "Required"),
  note: z.string().optional(),
});
type StockActionForm = z.infer<typeof stockActionSchema>;

function movementColor(type: string) {
  if (type === "RECEIVING" || type === "RETURNED") return "text-success bg-success-soft";
  if (type === "PICKED") return "text-muted bg-line/40";
  return "text-warning bg-warning/10";
}

export default function WarehousePage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showReceive, setShowReceive] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const { data: lowStock } = useApiQuery<Product[]>(["warehouse", "low-stock"], "/warehouse/low-stock");
  const { data: products } = useApiQuery<ProductListResponse>(["products", "for-select"], "/products?pageSize=100");
  const { data: movements, isLoading: movementsLoading } = useApiQuery<MovementListResponse>(
    ["warehouse", "movements"],
    "/warehouse/movements?pageSize=20",
  );
  const { data: returns, isLoading: returnsLoading } = useApiQuery<ReturnListResponse>(
    ["warehouse", "returns"],
    "/warehouse/returns?pageSize=20",
  );

  const receiveForm = useForm<StockActionForm>({ resolver: zodResolver(stockActionSchema) });
  const adjustForm = useForm<StockActionForm>({ resolver: zodResolver(stockActionSchema) });

  const receiveStock = useMutation({
    mutationFn: (values: StockActionForm) =>
      apiFetch("/warehouse/receiving", accessToken, {
        method: "POST",
        body: JSON.stringify({ ...values, quantity: Number(values.quantity) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      receiveForm.reset();
      setShowReceive(false);
    },
  });

  const adjustStock = useMutation({
    mutationFn: (values: StockActionForm) =>
      apiFetch("/warehouse/adjustments", accessToken, {
        method: "POST",
        body: JSON.stringify({ ...values, quantity: Number(values.quantity) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      adjustForm.reset();
      setShowAdjust(false);
    },
  });

  const receiveReturn = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "RECEIVED" | "REJECTED" }) =>
      apiFetch(`/warehouse/returns/${id}`, accessToken, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const canReceive = hasPermission("warehouse.receive");
  const canAdjust = hasPermission("warehouse.adjust");
  const canReceiveReturn = hasPermission("returns.receive");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Warehouse</h1>
        <p className="text-sm text-muted">Stock levels, movements, and customer returns.</p>
      </div>

      {lowStock && lowStock.length > 0 && (
        <Card className="border-warning/40">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-ink">
                {lowStock.length} product{lowStock.length === 1 ? "" : "s"} at or below minimum stock
              </p>
              <p className="text-sm text-muted">{lowStock.map((p) => `${p.name} (${p.currentStock})`).join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        {canReceive && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Receive stock</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowReceive((v) => !v)}>
                {showReceive ? "Cancel" : "Record"}
              </Button>
            </CardHeader>
            {showReceive && (
              <CardContent>
                <form
                  onSubmit={receiveForm.handleSubmit((v) => receiveStock.mutate(v))}
                  className="flex flex-col gap-3"
                >
                  <Select {...receiveForm.register("productId")}>
                    <option value="">Select a product…</option>
                    {products?.data.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>
                  <Input type="number" placeholder="Quantity received" {...receiveForm.register("quantity")} />
                  <Input placeholder="Note (optional)" {...receiveForm.register("note")} />
                  <Button type="submit" size="sm" disabled={receiveForm.formState.isSubmitting}>
                    Add to stock
                  </Button>
                  {receiveStock.isError && (
                    <p className="text-xs text-critical">
                      {receiveStock.error instanceof ApiError ? receiveStock.error.message : "Failed."}
                    </p>
                  )}
                </form>
              </CardContent>
            )}
          </Card>
        )}

        {canAdjust && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Adjust stock</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAdjust((v) => !v)}>
                {showAdjust ? "Cancel" : "Correct"}
              </Button>
            </CardHeader>
            {showAdjust && (
              <CardContent>
                <form onSubmit={adjustForm.handleSubmit((v) => adjustStock.mutate(v))} className="flex flex-col gap-3">
                  <Select {...adjustForm.register("productId")}>
                    <option value="">Select a product…</option>
                    {products?.data.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>
                  <Input type="number" placeholder="Change (e.g. -3 or 3)" {...adjustForm.register("quantity")} />
                  <Input placeholder="Reason (required)" {...adjustForm.register("note")} />
                  <Button type="submit" size="sm" disabled={adjustForm.formState.isSubmitting}>
                    Apply correction
                  </Button>
                  {adjustStock.isError && (
                    <p className="text-xs text-critical">
                      {adjustStock.error instanceof ApiError ? adjustStock.error.message : "Failed."}
                    </p>
                  )}
                </form>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent stock movements</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {movementsLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!movementsLoading && movements?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    No stock movements yet.
                  </td>
                </tr>
              )}
              {movements?.data.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{m.product.name}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${movementColor(m.type)}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{m.note ?? m.referenceType ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className={`px-5 py-3 text-right tabular-nums ${m.quantity < 0 ? "text-critical" : "text-success"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer returns</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {canReceiveReturn && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {returnsLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!returnsLoading && returns?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    No returns logged yet.
                  </td>
                </tr>
              )}
              {returns?.data.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{r.customer.name}</td>
                  <td className="px-5 py-3 text-muted">
                    {r.items.map((i) => `${i.product.name} ×${i.quantity} (${i.condition})`).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-muted">{r.reason}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "PENDING" ? "text-warning bg-warning/10" : "text-muted bg-line/40"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  {canReceiveReturn && (
                    <td className="px-5 py-3 text-right">
                      {r.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => receiveReturn.mutate({ id: r.id, status: "RECEIVED" })}
                          >
                            Receive
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => receiveReturn.mutate({ id: r.id, status: "REJECTED" })}
                          >
                            Reject
                          </Button>
                        </div>
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
