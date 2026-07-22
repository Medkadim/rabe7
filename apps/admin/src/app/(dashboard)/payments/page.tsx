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

interface Payment {
  id: string;
  method: string;
  amount: string;
  reference: string | null;
  receivedAt: string;
  customer: { name: string; code: string };
  invoice: { invoiceNumber: string } | null;
}

interface PaymentListResponse {
  data: Payment[];
  meta: { total: number };
}

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface CustomerListResponse {
  data: Customer[];
}

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT"] as const;

const recordPaymentSchema = z.object({
  customerId: z.string().min(1, "Choose a customer"),
  method: z.enum(PAYMENT_METHODS),
  amount: z.string().min(1, "Required"),
  invoiceId: z.string().optional(),
  reference: z.string().optional(),
});

type RecordPaymentForm = z.infer<typeof recordPaymentSchema>;

function methodLabel(method: string) {
  return method.charAt(0) + method.slice(1).toLowerCase().replace("_", " ");
}

export default function PaymentsPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useApiQuery<PaymentListResponse>(["payments", "list"], "/payments?pageSize=50");
  const { data: customers } = useApiQuery<CustomerListResponse>(
    ["customers", "for-select"],
    "/customers?pageSize=100",
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordPaymentForm>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { method: "CASH" },
  });

  const recordPayment = useMutation({
    mutationFn: (values: RecordPaymentForm) =>
      apiFetch<Payment>("/payments", accessToken, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          amount: Number(values.amount),
          invoiceId: values.invoiceId || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      reset();
      setShowForm(false);
    },
  });

  const canCreate = hasPermission("payments.create");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Payments</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} payments recorded.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Record payment"}</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record a payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => recordPayment.mutate(values))}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customerId">Customer</Label>
                <Select id="customerId" {...register("customerId")}>
                  <option value="">Select a customer…</option>
                  {customers?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
                {errors.customerId && <p className="text-xs text-critical">{errors.customerId.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="method">Method</Label>
                <Select id="method" {...register("method")}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {methodLabel(m)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" {...register("amount")} />
                {errors.amount && <p className="text-xs text-critical">{errors.amount.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" placeholder="Cheque no. / transfer ref" {...register("reference")} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="invoiceId">Invoice ID (optional)</Label>
                <Input id="invoiceId" placeholder="Leave blank for a general payment" {...register("invoiceId")} />
                <p className="text-xs text-muted">
                  Paste an invoice ID from the Orders screen to apply this payment directly to that invoice's
                  balance.
                </p>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Recording…" : "Record payment"}
                </Button>
                {recordPayment.isError && (
                  <p className="text-sm text-critical">
                    {recordPayment.error instanceof ApiError
                      ? recordPayment.error.message
                      : "Something went wrong."}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Received</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {data?.data.map((payment) => (
                <tr key={payment.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{payment.customer.name}</td>
                  <td className="px-5 py-3 text-muted">{methodLabel(payment.method)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {payment.invoice?.invoiceNumber ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-muted">{payment.reference ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{new Date(payment.receivedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{payment.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
