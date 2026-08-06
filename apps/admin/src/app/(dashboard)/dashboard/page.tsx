"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/lib/use-api-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";

interface OverviewResponse {
  period: { from: string; to: string };
  kpis: {
    revenue: number;
    deliveredOrders: number;
    ordersPlaced: number;
    avgOrderValue: number;
    pendingOrders: number;
    activeCustomers: number;
  };
  revenueByDay: { date: string; value: number }[];
  topProducts: { id: string; name: string; revenue: number; quantity: number }[];
  topCustomers: { id: string; name: string; revenue: number }[];
  revenueByCity: { city: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
}

interface PlatformFeeResponse {
  period: { from: string; to: string };
  deliveredOrdersTotal: number;
  deliveredOrdersCount: number;
  feeRate: number;
  feeAmount: number;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "text-muted bg-line/40",
  PENDING: "text-warning bg-warning/10",
  CONFIRMED: "text-success bg-success-soft",
  PROCESSING: "text-success bg-success-soft",
  DELIVERED: "text-success bg-success-soft",
  CANCELLED: "text-critical bg-critical/10",
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-[18px]">
      <div className="mb-2 text-xs font-semibold text-muted">{label}</div>
      <div className="font-mono text-2xl font-bold tabular-nums text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

function RevenueChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No delivered orders in this period yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-[150px] items-end gap-1.5 overflow-x-auto">
      {data.map((d) => (
        <div key={d.date} className="flex h-full min-w-[22px] flex-1 flex-col items-center justify-end gap-1.5">
          <span className="font-mono text-[9.5px] text-muted">{d.value > 0 ? Math.round(d.value) : ""}</span>
          <div
            className="w-full rounded-t-[3px] bg-brand"
            style={{ height: `${d.value > 0 ? Math.max((d.value / max) * 100, 3) : 0}%` }}
          />
          <span className="text-[10px] text-muted">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function BarList({
  items,
  valueLabel,
}: {
  items: { label: string; value: number; sub?: string }[];
  valueLabel: (v: number) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">
              {item.label}
              {item.sub && <span className="ml-1.5 text-xs text-muted">{item.sub}</span>}
            </span>
            <span className="font-mono text-xs text-muted">{valueLabel(item.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-soft">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlatformFeeCard() {
  const { accessToken } = useAuth();
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const [result, setResult] = useState<PlatformFeeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  async function calculate() {
    setLoading(true);
    setFeeError(null);
    try {
      const res = await apiFetch<PlatformFeeResponse>(`/stats/platform-fee?from=${from}&to=${to}`, accessToken);
      setResult(res);
    } catch (e) {
      setFeeError(e instanceof ApiError ? e.message : "Failed to calculate the platform fee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform commission (1%)</CardTitle>
        <p className="mt-1 text-sm text-muted">1% of the total value of delivered orders over a period you choose.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="feeFrom" className="text-xs">
              From
            </Label>
            <Input id="feeFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="feeTo" className="text-xs">
              To
            </Label>
            <Input id="feeTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <Button onClick={() => void calculate()} disabled={loading}>
            {loading ? "Calculating…" : "Calculate"}
          </Button>
        </div>
        {feeError && <p className="text-sm text-critical">{feeError}</p>}
        {result && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-muted">Delivered orders total</div>
              <div className="font-mono text-lg font-bold text-ink">{formatNumber(result.deliveredOrdersTotal)}</div>
              <div className="text-xs text-muted">{result.deliveredOrdersCount} orders</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted">Fee rate</div>
              <div className="font-mono text-lg font-bold text-ink">{(result.feeRate * 100).toFixed(0)}%</div>
            </div>
            <div className="rounded-[10px] bg-brand-soft p-3">
              <div className="text-xs font-semibold text-brand-ink">Platform commission owed</div>
              <div className="font-mono text-xl font-bold text-brand-ink">{formatNumber(result.feeAmount)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());

  const { data, isLoading, error } = useApiQuery<OverviewResponse>(
    ["stats", "overview", from, to],
    `/stats/overview?from=${from}&to=${to}`,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold text-ink">Overview</h1>
          <p className="text-sm text-muted">A live snapshot of your distribution business.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="statsFrom" className="text-xs">
              From
            </Label>
            <Input id="statsFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="statsTo" className="text-xs">
              To
            </Label>
            <Input id="statsTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
          </div>
        </div>
      </div>

      {!!error && (
        <p className="text-sm text-critical">{error instanceof ApiError ? error.message : "Failed to load statistics."}</p>
      )}
      {isLoading && <p className="text-sm text-muted">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Revenue (delivered)" value={formatNumber(data.kpis.revenue)} />
            <StatCard label="Delivered orders" value={String(data.kpis.deliveredOrders)} />
            <StatCard label="Orders placed" value={String(data.kpis.ordersPlaced)} />
            <StatCard label="Avg order value" value={formatNumber(data.kpis.avgOrderValue)} />
            <StatCard label="Pending orders" value={String(data.kpis.pendingOrders)} hint="current" />
            <StatCard label="Active customers" value={String(data.kpis.activeCustomers)} hint="current" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by day</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={data.revenueByDay} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top products</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  items={data.topProducts.map((p) => ({ label: p.name, value: p.revenue, sub: `× ${p.quantity}` }))}
                  valueLabel={formatNumber}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top customers</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={data.topCustomers.map((c) => ({ label: c.name, value: c.revenue }))} valueLabel={formatNumber} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by city</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={data.revenueByCity.map((c) => ({ label: c.city, value: c.revenue }))} valueLabel={formatNumber} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Orders by status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.ordersByStatus.map((s) => (
                  <span
                    key={s.status}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLE[s.status] ?? ""}`}
                  >
                    {s.status} · {s.count}
                  </span>
                ))}
                {data.ordersByStatus.length === 0 && <p className="text-sm text-muted">No orders in this period.</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <PlatformFeeCard />
    </div>
  );
}
