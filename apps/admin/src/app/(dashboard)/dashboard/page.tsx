"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/use-api-query";

interface PaginatedMeta {
  meta: { total: number };
}

function StatCard({ label, path, queryKey }: { label: string; path: string; queryKey: string }) {
  const { data, isLoading } = useApiQuery<PaginatedMeta>([queryKey, "count"], `${path}?pageSize=1`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums text-ink">
          {isLoading ? "…" : (data?.meta.total ?? 0)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Overview</h1>
        <p className="text-sm text-muted">A live snapshot of your distribution business.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Customers" path="/customers" queryKey="customers" />
        <StatCard label="Products" path="/products" queryKey="products" />
        <StatCard label="Orders" path="/orders" queryKey="orders" />
        <StatCard label="Payments" path="/payments" queryKey="payments" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Revenue charts, top customers and top products land alongside the Warehouse and Delivery modules in
          Phase 2 — this view already reads live data from the same API those screens will use.
        </CardContent>
      </Card>
    </div>
  );
}
