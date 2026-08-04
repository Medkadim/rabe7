"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface DashboardResponse {
  targets: { dailyTarget: number; weeklyTarget: number; monthlyTarget: number };
  today: { achieved: number };
  week: { achieved: number };
  month: { achieved: number };
  period: { from: string; to: string; achieved: number };
}

function ProgressBar({ achieved, target }: { achieved: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-soft">
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>{formatPrice(achieved)}</span>
        <span>{target > 0 ? `${pct}٪ من ${formatPrice(target)}` : "لا يوجد هدف محدد"}</span>
      </div>
    </div>
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const { data, isLoading, error } = useApiQuery<DashboardResponse>(["sales", "dashboard"], "/sales/dashboard");

  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());
  const [customResult, setCustomResult] = useState<DashboardResponse["period"] | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customLoading, setCustomLoading] = useState(false);

  async function loadCustomPeriod() {
    setCustomLoading(true);
    setCustomError(null);
    try {
      const result = await apiFetch<DashboardResponse>(
        `/sales/dashboard?from=${customFrom}&to=${customTo}`,
        accessToken,
      );
      setCustomResult(result.period);
    } catch (e) {
      setCustomError(e instanceof ApiError ? e.message : "تعذر تحميل البيانات.");
    } finally {
      setCustomLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">لوحة المندوب</h1>
        <p className="text-sm text-muted">أهدافك ومبيعاتك المحققة.</p>
      </div>

      {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!!error && <p className="text-sm text-critical">{error instanceof ApiError ? error.message : "تعذر تحميل اللوحة."}</p>}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>هدف اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar achieved={data.today.achieved} target={data.targets.dailyTarget} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">هذا الأسبوع</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressBar achieved={data.week.achieved} target={data.targets.weeklyTarget} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">هذا الشهر</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressBar achieved={data.month.achieved} target={data.targets.monthlyTarget} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>فترة مخصصة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="from">من</Label>
              <Input id="from" type="date" dir="ltr" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="to">إلى</Label>
              <Input id="to" type="date" dir="ltr" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
            <Button onClick={() => void loadCustomPeriod()} disabled={customLoading}>
              {customLoading ? "جارٍ الحساب…" : "احسب"}
            </Button>
          </div>
          {customError && <p className="text-sm text-critical">{customError}</p>}
          {customResult && (
            <p className="text-lg font-semibold text-ink">
              رقم المعاملات المحقق: <span className="font-mono font-bold">{formatPrice(customResult.achieved)}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
