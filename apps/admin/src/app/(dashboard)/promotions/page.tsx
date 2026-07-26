"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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

interface Promotion {
  id: string;
  name: string;
  type: string;
  discountPercent: string | null;
  discountAmount: string | null;
  minQuantity: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  products: { product: { name: string } }[];
}
interface PromotionListResponse {
  data: Promotion[];
  meta: { total: number };
}
interface Product {
  id: string;
  sku: string;
  name: string;
}
interface ProductListResponse {
  data: Product[];
}

const PROMOTION_TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "VOLUME_DISCOUNT", "BUY_X_GET_Y"] as const;

const createPromotionSchema = z
  .object({
    name: z.string().min(1, "Required"),
    type: z.enum(PROMOTION_TYPES),
    discountPercent: z.string().optional(),
    discountAmount: z.string().optional(),
    minQuantity: z.string().optional(),
    buyQuantity: z.string().optional(),
    getQuantity: z.string().optional(),
    rewardProductId: z.string().optional(),
    region: z.string().optional(),
    startsAt: z.string().min(1, "Required"),
    endsAt: z.string().optional(),
    productIds: z.array(z.string()).min(1, "Select at least one product"),
  })
  .refine((v) => v.type !== "PERCENTAGE" || !!v.discountPercent, {
    message: "Discount percent is required",
    path: ["discountPercent"],
  })
  .refine((v) => v.type !== "FIXED_AMOUNT" || !!v.discountAmount, {
    message: "Discount amount is required",
    path: ["discountAmount"],
  })
  .refine((v) => v.type !== "VOLUME_DISCOUNT" || (!!v.minQuantity && !!v.discountPercent), {
    message: "Minimum quantity and discount percent are required",
    path: ["minQuantity"],
  })
  .refine((v) => v.type !== "BUY_X_GET_Y" || (!!v.buyQuantity && !!v.getQuantity && !!v.rewardProductId), {
    message: "Buy quantity, get quantity and a reward product are required",
    path: ["buyQuantity"],
  });

type CreatePromotionForm = z.infer<typeof createPromotionSchema>;

function summarize(promo: Promotion): string {
  switch (promo.type) {
    case "PERCENTAGE":
      return `${promo.discountPercent}% off`;
    case "FIXED_AMOUNT":
      return `${promo.discountAmount} off`;
    case "VOLUME_DISCOUNT":
      return `${promo.discountPercent}% off when buying ${promo.minQuantity}+`;
    case "BUY_X_GET_Y":
      return `Buy ${promo.buyQuantity}, get ${promo.getQuantity} free`;
    default:
      return promo.type;
  }
}

export default function PromotionsPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useApiQuery<PromotionListResponse>(["promotions", "list"], "/promotions?pageSize=50");
  const { data: products } = useApiQuery<ProductListResponse>(["products", "for-select"], "/products?pageSize=100");

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePromotionForm>({
    resolver: zodResolver(createPromotionSchema),
    defaultValues: { type: "PERCENTAGE", productIds: [] },
  });
  const type = watch("type");

  const createPromotion = useMutation({
    mutationFn: (values: CreatePromotionForm) =>
      apiFetch<Promotion>("/promotions", accessToken, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          discountPercent: values.discountPercent ? Number(values.discountPercent) : undefined,
          discountAmount: values.discountAmount ? Number(values.discountAmount) : undefined,
          minQuantity: values.minQuantity ? Number(values.minQuantity) : undefined,
          buyQuantity: values.buyQuantity ? Number(values.buyQuantity) : undefined,
          getQuantity: values.getQuantity ? Number(values.getQuantity) : undefined,
          startsAt: new Date(values.startsAt).toISOString(),
          endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      reset({ type: "PERCENTAGE", productIds: [] });
      setShowForm(false);
    },
  });

  const canCreate = hasPermission("promotions.create");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Promotions</h1>
          <p className="text-sm text-muted">{data?.meta.total ?? 0} promotions configured.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New promotion"}</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New promotion</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createPromotion.mutate(values))}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Summer 20% off" {...register("name")} />
                {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" {...register("type")}>
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED_AMOUNT">Fixed amount off</option>
                  <option value="VOLUME_DISCOUNT">Volume discount</option>
                  <option value="BUY_X_GET_Y">Buy X, get Y free (incl. gifts)</option>
                </Select>
              </div>

              {type === "PERCENTAGE" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="discountPercent">Discount percent</Label>
                  <Input id="discountPercent" type="number" step="0.01" {...register("discountPercent")} />
                  {errors.discountPercent && (
                    <p className="text-xs text-critical">{errors.discountPercent.message}</p>
                  )}
                </div>
              )}

              {type === "FIXED_AMOUNT" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="discountAmount">Discount amount</Label>
                  <Input id="discountAmount" type="number" step="0.01" {...register("discountAmount")} />
                  {errors.discountAmount && (
                    <p className="text-xs text-critical">{errors.discountAmount.message}</p>
                  )}
                </div>
              )}

              {type === "VOLUME_DISCOUNT" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="minQuantity">Minimum quantity</Label>
                    <Input id="minQuantity" type="number" {...register("minQuantity")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="discountPercent">Discount percent</Label>
                    <Input id="discountPercent" type="number" step="0.01" {...register("discountPercent")} />
                  </div>
                  {errors.minQuantity && <p className="text-xs text-critical">{errors.minQuantity.message}</p>}
                </>
              )}

              {type === "BUY_X_GET_Y" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="buyQuantity">Buy quantity</Label>
                    <Input id="buyQuantity" type="number" {...register("buyQuantity")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="getQuantity">Get quantity (free)</Label>
                    <Input id="getQuantity" type="number" {...register("getQuantity")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rewardProductId">Reward / gift product</Label>
                    <Select id="rewardProductId" {...register("rewardProductId")}>
                      <option value="">Select a product…</option>
                      {products?.data.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </Select>
                  </div>
                  {errors.buyQuantity && <p className="text-xs text-critical">{errors.buyQuantity.message}</p>}
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startsAt">Starts</Label>
                <Input id="startsAt" type="date" {...register("startsAt")} />
                {errors.startsAt && <p className="text-xs text-critical">{errors.startsAt.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endsAt">Ends (optional)</Label>
                <Input id="endsAt" type="date" {...register("endsAt")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="region">Region (optional)</Label>
                <Input id="region" placeholder="Leave blank for everywhere" {...register("region")} />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Applies to these products</Label>
                <Controller
                  control={control}
                  name="productIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-3 rounded-md border border-line p-3">
                      {products?.data.map((p) => (
                        <label key={p.id} className="flex items-center gap-1.5 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(p.id)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(field.value ?? []), p.id]
                                : (field.value ?? []).filter((id) => id !== p.id);
                              field.onChange(next);
                            }}
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.productIds && <p className="text-xs text-critical">{errors.productIds.message}</p>}
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create promotion"}
                </Button>
                {createPromotion.isError && (
                  <p className="text-sm text-critical">
                    {createPromotion.error instanceof ApiError
                      ? createPromotion.error.message
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
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Applies to</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Window</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    No promotions yet.
                  </td>
                </tr>
              )}
              {data?.data.map((promo) => (
                <tr key={promo.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{promo.name}</td>
                  <td className="px-5 py-3 text-muted">
                    {promo.products.map((p) => p.product.name).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-muted">{summarize(promo)}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(promo.startsAt).toLocaleDateString()}
                    {promo.endsAt ? ` – ${new Date(promo.endsAt).toLocaleDateString()}` : " – ongoing"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        promo.isActive ? "text-success bg-success-soft" : "text-muted bg-line/40"
                      }`}
                    >
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
