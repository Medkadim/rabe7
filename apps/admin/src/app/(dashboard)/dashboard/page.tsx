"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/use-api-query";

interface PaginatedMeta {
  meta: { total: number };
}

function StatCard({ label, path, queryKey }: { label: string; path: string; queryKey: string }) {
  const { data, isLoading } = useApiQuery<PaginatedMeta>([queryKey, "count"], `${path}?pageSize=1`);

  return (
    <Card className="p-[18px]">
      <div className="mb-2 text-xs font-semibold text-muted">{label}</div>
      <div className="font-mono text-2xl font-bold tabular-nums text-ink">
        {isLoading ? "…" : (data?.meta.total ?? 0)}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-extrabold text-ink">Overview</h1>
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
          Revenue charts, top customers and top products are next on the roadmap for this overview.
        </CardContent>
      </Card>
    </div>
  );
}
