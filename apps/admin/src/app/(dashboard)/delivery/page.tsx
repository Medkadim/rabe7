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

interface Delivery {
  id: string;
  status: string;
  cashCollected: string | null;
  order: { orderNumber: string; total: string; customer: { name: string } };
}
interface Route {
  id: string;
  name: string;
  scheduledDate: string;
  status: string;
  driver: { firstName: string; lastName: string } | null;
  deliveries: Delivery[];
}
interface RouteListResponse {
  data: Route[];
  meta: { total: number };
}
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customer: { name: string };
}
interface OrderListResponse {
  data: Order[];
}
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
}

const createRouteSchema = z.object({
  name: z.string().min(1, "Required"),
  scheduledDate: z.string().min(1, "Required"),
  driverUserId: z.string().optional(),
});
type CreateRouteForm = z.infer<typeof createRouteSchema>;

// Shared by the per-route and global-recap buttons — both hit a PDF
// endpoint directly (not through apiFetch, which assumes JSON) and open
// the result in a new tab the same way the order PDF download already does.
async function downloadPdf(url: string, accessToken: string | null) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}${url}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Could not generate the PDF.");
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}

const DELIVERY_STATUS_STYLE: Record<string, string> = {
  PENDING: "text-muted bg-line/40",
  OUT_FOR_DELIVERY: "text-warning bg-warning/10",
  DELIVERED: "text-success bg-success-soft",
  PARTIALLY_DELIVERED: "text-warning bg-warning/10",
  FAILED: "text-critical bg-critical/10",
};

function AssignOrderRow({ routeId }: { routeId: string }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState("");
  const { data: orders } = useApiQuery<OrderListResponse>(["orders", "assignable"], "/orders?pageSize=50");

  const assignableOrders = orders?.data.filter((o) => o.status === "CONFIRMED" || o.status === "PROCESSING") ?? [];

  const assign = useMutation({
    mutationFn: () =>
      apiFetch(`/delivery/routes/${routeId}/orders`, accessToken, {
        method: "POST",
        body: JSON.stringify({ orderId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      setOrderId("");
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Select className="max-w-xs" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
        <option value="">Add an order to this route…</option>
        {assignableOrders.map((o) => (
          <option key={o.id} value={o.id}>
            {o.orderNumber} — {o.customer.name}
          </option>
        ))}
      </Select>
      <Button size="sm" variant="outline" disabled={!orderId || assign.isPending} onClick={() => assign.mutate()}>
        Add
      </Button>
      {assign.isError && (
        <p className="text-xs text-critical">
          {assign.error instanceof ApiError ? assign.error.message : "Failed."}
        </p>
      )}
    </div>
  );
}

function DeliveryRow({ delivery }: { delivery: Delivery }) {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission("delivery.update_status");

  const updateStatus = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/delivery/deliveries/${delivery.id}/status`, accessToken, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return (
    <div className="flex items-center justify-between rounded-md border border-line px-3 py-2">
      <div>
        <p className="text-sm font-medium text-ink">
          {delivery.order.orderNumber} — {delivery.order.customer.name}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${DELIVERY_STATUS_STYLE[delivery.status] ?? ""}`}
        >
          {delivery.status.replace(/_/g, " ")}
        </span>
      </div>
      {canUpdate && delivery.status !== "DELIVERED" && delivery.status !== "FAILED" && (
        <div className="flex gap-2">
          {delivery.status === "PENDING" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ status: "OUT_FOR_DELIVERY" })}>
              Out for delivery
            </Button>
          )}
          {delivery.status === "OUT_FOR_DELIVERY" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateStatus.mutate({ status: "DELIVERED", cashCollected: Number(delivery.order.total) })
                }
              >
                Delivered (cash collected)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ status: "FAILED" })}>
                Failed
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeliveryPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [recapDate, setRecapDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recapError, setRecapError] = useState<string | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);

  const { data, isLoading } = useApiQuery<RouteListResponse>(["delivery", "routes"], "/delivery/routes?pageSize=20");
  const { data: drivers } = useApiQuery<Driver[]>(["staff", "drivers"], "/staff?role=DELIVERY_DRIVER");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRouteForm>({ resolver: zodResolver(createRouteSchema) });

  const createRoute = useMutation({
    mutationFn: (values: CreateRouteForm) =>
      apiFetch("/delivery/routes", accessToken, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          driverUserId: values.driverUserId || undefined,
          scheduledDate: new Date(values.scheduledDate).toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      reset();
      setShowForm(false);
    },
  });

  const canManage = hasPermission("delivery.routes.manage");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Delivery</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} routes.</p>
        </div>
        {canManage && <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New route"}</Button>}
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Global loading recap</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Every product needed across every driver&apos;s route for one day — one prep sheet for the whole
              warehouse instead of one per driver.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recapDate">Date</Label>
                <Input
                  id="recapDate"
                  type="date"
                  value={recapDate}
                  onChange={(e) => setRecapDate(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setRecapError(null);
                  downloadPdf(`/delivery/loading-slip?date=${recapDate}`, accessToken).catch(() =>
                    setRecapError("Could not generate the recap."),
                  );
                }}
              >
                Download global recap
              </Button>
            </div>
            {recapError && <p className="text-sm text-critical">{recapError}</p>}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New delivery route</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => createRoute.mutate(v))} className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Route name</Label>
                <Input id="name" placeholder="North district run" {...register("name")} />
                {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scheduledDate">Date</Label>
                <Input id="scheduledDate" type="date" {...register("scheduledDate")} />
                {errors.scheduledDate && <p className="text-xs text-critical">{errors.scheduledDate.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driverUserId">Driver (optional)</Label>
                <Select id="driverUserId" {...register("driverUserId")}>
                  <option value="">Not assigned yet</option>
                  {drivers?.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create route"}
                </Button>
                {createRoute.isError && (
                  <p className="text-sm text-critical">
                    {createRoute.error instanceof ApiError ? createRoute.error.message : "Something went wrong."}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && data?.data.length === 0 && <p className="text-sm text-muted">No delivery routes yet.</p>}

      <div className="flex flex-col gap-4">
        {data?.data.map((route) => (
          <Card key={route.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{route.name}</CardTitle>
                <p className="text-sm text-muted">
                  {new Date(route.scheduledDate).toLocaleDateString()} · {route.status}
                  {route.driver ? ` · ${route.driver.firstName} ${route.driver.lastName}` : ""}
                </p>
              </div>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSlipError(null);
                    downloadPdf(`/delivery/routes/${route.id}/loading-slip`, accessToken).catch(() =>
                      setSlipError(`Could not generate the loading slip for ${route.name}.`),
                    );
                  }}
                >
                  Loading slip
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {route.deliveries.length === 0 && <p className="text-sm text-muted">No stops on this route yet.</p>}
              {route.deliveries.map((d) => (
                <DeliveryRow key={d.id} delivery={d} />
              ))}
              {canManage && <AssignOrderRow routeId={route.id} />}
            </CardContent>
          </Card>
        ))}
      </div>
      {slipError && <p className="text-sm text-critical">{slipError}</p>}
    </div>
  );
}
