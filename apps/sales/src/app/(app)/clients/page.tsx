"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomerAddress {
  city: string;
  isDefault: boolean;
}

interface Customer {
  id: string;
  name: string;
  legalName: string | null;
  phone: string | null;
  status: string;
  addresses: CustomerAddress[];
}

interface CustomerListResponse {
  data: Customer[];
  meta: { total: number };
}

function statusLabel(status: string): string {
  if (status === "ACTIVE") return "نشط";
  if (status === "PENDING_APPROVAL") return "بانتظار الموافقة";
  if (status === "SUSPENDED") return "موقوف";
  return status;
}

function statusColor(status: string): string {
  if (status === "ACTIVE") return "text-success bg-success-soft";
  if (status === "SUSPENDED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function ClientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams({ pageSize: "50" });
  if (search) params.set("search", search);

  const { data, isLoading } = useApiQuery<CustomerListResponse>(
    ["customers", "list", search],
    `/customers?${params.toString()}`,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">العملاء</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} عميل</p>
        </div>
        <Link href="/clients/new">
          <Button>عميل جديد</Button>
        </Link>
      </div>

      <Input
        type="search"
        placeholder="ابحث بالاسم أو الهاتف…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!isLoading && data?.data.length === 0 && <p className="text-sm text-muted">لا يوجد عملاء بعد.</p>}

      <div className="flex flex-col gap-2">
        {data?.data.map((customer) => {
          const city = customer.addresses.find((a) => a.isDefault)?.city ?? customer.addresses[0]?.city;
          return (
            <Link key={customer.id} href={`/clients/${customer.id}`}>
              <Card className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-ink">{customer.name}</p>
                  <p className="text-xs text-muted">
                    {customer.legalName ? `${customer.legalName} · ` : ""}
                    {city ?? "—"}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(customer.status)}`}>
                  {statusLabel(customer.status)}
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
