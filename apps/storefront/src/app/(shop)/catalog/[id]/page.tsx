"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApiQuery } from "@/lib/use-api-query";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  basePrice: string;
  currentStock: number;
  images: { url: string }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { data: product, isLoading } = useApiQuery<ProductDetail>(["products", "detail", id], `/products/${id}`);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState("1");
  const [added, setAdded] = useState(false);

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!product) return <p className="text-sm text-muted">Product not found.</p>;

  const outOfStock = product.currentStock <= 0;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/catalog" className="text-sm text-muted hover:text-ink">
        ← Back to catalog
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-lg border border-line bg-brand-soft">
            {product.images[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[activeImage].url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.url}
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    index === activeImage ? "border-accent" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{product.name}</h1>
            <p className="text-sm text-muted">
              {product.sku} · per {product.unit}
            </p>
          </div>

          <p className="text-3xl font-semibold text-ink">{product.basePrice}</p>

          {product.description && <p className="whitespace-pre-line text-sm text-muted">{product.description}</p>}

          {outOfStock ? (
            <p className="text-sm font-medium text-critical">Out of stock</p>
          ) : (
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-10 w-20"
              />
              <Button
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
      </div>
    </div>
  );
}
