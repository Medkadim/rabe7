"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: string;
  discountPercent: string | null;
  discountAmount: string | null;
  minQuantity: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  startsAt: string;
  endsAt: string | null;
  rewardProduct: { id: string; name: string } | null;
  products: { product: { id: string; name: string; sku: string } }[];
}

// Mirrors the same summary shown to staff on the admin Promotions page —
// one human-readable line per discount type.
function summarize(promo: Promotion): string {
  switch (promo.type) {
    case "PERCENTAGE":
      return `خصم ${promo.discountPercent}%`;
    case "FIXED_AMOUNT":
      return `خصم ${formatPrice(promo.discountAmount ?? 0)}`;
    case "VOLUME_DISCOUNT":
      return `خصم ${promo.discountPercent}% عند شراء ${promo.minQuantity}+`;
    case "BUY_X_GET_Y":
      return promo.rewardProduct
        ? `اشترِ ${promo.buyQuantity} واحصل على ${promo.getQuantity} ${promo.rewardProduct.name} مجانًا`
        : `اشترِ ${promo.buyQuantity} واحصل على ${promo.getQuantity} مجانًا`;
    default:
      return promo.type;
  }
}

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useApiQuery<Promotion[]>(["promotions", "active"], "/promotions/active");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">العروض</h1>
        <p className="text-sm text-muted">العروض المتاحة حاليًا لحسابك.</p>
      </div>

      {isLoading && <p className="text-sm text-muted">جارٍ التحميل…</p>}
      {!isLoading && promotions?.length === 0 && (
        <p className="text-sm text-muted">لا توجد عروض نشطة حاليًا — تحقق لاحقًا.</p>
      )}

      <div className="flex flex-col gap-4">
        {promotions?.map((promo) => (
          <Card key={promo.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{promo.name}</CardTitle>
                <span className="shrink-0 rounded-full bg-critical px-2.5 py-1 text-xs font-medium text-white">
                  {summarize(promo)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {promo.description && <p className="text-sm text-muted">{promo.description}</p>}
              {promo.products.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">ينطبق على</span>
                  <div className="flex flex-wrap gap-2">
                    {promo.products.map(({ product }) => (
                      <Link
                        key={product.id}
                        href={`/catalog/${product.id}`}
                        className="rounded-full border border-line bg-paper-raised px-3 py-1 text-xs text-ink hover:border-brand"
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {promo.endsAt && (
                <p className="text-xs text-muted">ينتهي في {new Date(promo.endsAt).toLocaleDateString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
