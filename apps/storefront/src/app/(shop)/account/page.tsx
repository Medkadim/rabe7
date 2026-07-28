"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-success bg-success-soft";
  if (status === "BLOCKED") return "text-critical bg-critical/10";
  return "text-warning bg-warning/10";
}

export default function AccountPage() {
  const { customer, user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">My account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Business name</span>
            <span className="text-ink">{customer?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Customer code</span>
            <span className="font-mono text-ink">{customer?.code ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Phone</span>
            <span className="text-ink">{customer?.phone ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Email</span>
            <span className="text-ink">{customer?.email ?? user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Status</span>
            {customer && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(customer.status)}`}>
                {customer.status}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery addresses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!customer?.addresses.length && <p className="text-sm text-muted">No addresses on file yet.</p>}
          {customer?.addresses.map((address) => (
            <div key={address.id} className="rounded-md border border-line p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{address.label}</span>
                {address.isDefault && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-ink">
                    Default
                  </span>
                )}
              </div>
              <p className="text-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-muted">
                {address.city}
                {address.region ? `, ${address.region}` : ""}, {address.country}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
