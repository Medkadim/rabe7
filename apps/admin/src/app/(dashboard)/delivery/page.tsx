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

const createRouteSchema = z.object({
  name: z.string().min(1, "Required"),
  scheduledDate: z.string().min(1, "Required"),
});
type CreateRouteForm = z.infer<typeof createRouteSchema>;

const DELIVERY_STATUS_STYLE: Record<string, string> = {
  PENDING: "text-muted bg-line/40",
  OUT_FOR_DELIVERY: "text-warning bg-warning/10",
  DELIVERED: "text-accent-ink bg-accent-soft",
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

  const { data, isLoading } = useApiQuery<RouteListResponse>(["delivery", "routes"], "/delivery/routes?pageSize=20");

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
        body: JSON.stringify({ ...values, scheduledDate: new Date(values.scheduledDate).toISOString() }),
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
    </div>
  );
}
