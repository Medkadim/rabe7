"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      return `${promo.discountPercent}% off`;
    case "FIXED_AMOUNT":
      return `${promo.discountAmount} off`;
    case "VOLUME_DISCOUNT":
      return `${promo.discountPercent}% off when buying ${promo.minQuantity}+`;
    case "BUY_X_GET_Y":
      return promo.rewardProduct
        ? `Buy ${promo.buyQuantity}, get ${promo.getQuantity} ${promo.rewardProduct.name} free`
        : `Buy ${promo.buyQuantity}, get ${promo.getQuantity} free`;
    default:
      return promo.type;
  }
}

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useApiQuery<Promotion[]>(["promotions", "active"], "/promotions/active");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Promotions</h1>
        <p className="text-sm text-muted">Deals currently available on your account.</p>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && promotions?.length === 0 && (
        <p className="text-sm text-muted">No active promotions right now — check back soon.</p>
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
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">Applies to</span>
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
                <p className="text-xs text-muted">Ends {new Date(promo.endsAt).toLocaleDateString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
