"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/use-api-query";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  basePrice: string;
  currentStock: number;
  images: { url: string }[];
}

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState("1");
  const [added, setAdded] = useState(false);
  const outOfStock = product.currentStock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0].url} alt={product.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-accent-soft" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="font-medium text-ink">{product.name}</p>
          <p className="text-xs text-muted">
            {product.sku} · per {product.unit}
          </p>
        </div>
        <p className="text-lg font-semibold text-ink">{product.basePrice}</p>
        {outOfStock ? (
          <p className="mt-auto text-xs font-medium text-critical">Out of stock</p>
        ) : (
          <div className="mt-auto flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9 w-16"
            />
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                const qty = Math.max(1, Number(quantity) || 1);
                addItem({ productId: product.id, name: product.name, unitPrice: Number(product.basePrice) }, qty);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
            >
              {added ? "Added ✓" : "Add to cart"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CatalogPage() {
  const { data, isLoading } = useApiQuery<ProductListResponse>(["products", "catalog"], "/products?pageSize=50");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Catalog</h1>
        <p className="text-sm text-muted">{data?.meta.total ?? 0} products available.</p>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && data?.data.length === 0 && <p className="text-sm text-muted">No products available yet.</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {data?.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
