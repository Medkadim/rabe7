"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Order {
  id: string;
  orderNumber: string;
}

export default function CartPage() {
  const router = useRouter();
  const { accessToken, user, isApproved } = useAuth();
  const { items, updateQuantity, removeItem, clear, total } = useCart();
  const [error, setError] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: async () => {
      const order = await apiFetch<Order>("/orders", accessToken, {
        method: "POST",
        body: JSON.stringify({
          customerId: user?.customerId,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      // Two steps mirror how the admin dashboard works — a draft order, then
      // a confirm step that runs the credit-limit check and creates the
      // invoice. Here it just happens back-to-back as one "place order" action.
      await apiFetch(`/orders/${order.id}/confirm`, accessToken, { method: "POST" });
      return order;
    },
    onSuccess: () => {
      clear();
      router.push("/orders");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not place the order."),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">Your cart</h1>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Your cart is empty.{" "}
          <Link href="/catalog" className="text-accent-ink underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <Card>
          <div className="divide-y divide-line">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.unitPrice} each</p>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 0)}
                  className="h-9 w-20"
                />
                <p className="w-24 text-right font-medium text-ink">{(item.unitPrice * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line p-4">
            <span className="text-sm text-muted">Total</span>
            <span className="text-lg font-semibold text-ink">{total.toFixed(2)}</span>
          </div>
        </Card>
      )}

      {!isApproved && items.length > 0 && (
        <p className="text-sm text-warning">
          Your account is still pending approval — you'll be able to place this order once it's approved.
        </p>
      )}
      {error && <p className="text-sm text-critical">{error}</p>}

      {items.length > 0 && (
        <Button
          onClick={() => checkout.mutate()}
          disabled={checkout.isPending || !isApproved}
          className="self-start"
        >
          {checkout.isPending ? "Placing order…" : "Place order"}
        </Button>
      )}
    </div>
  );
}
