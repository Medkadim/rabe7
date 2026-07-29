"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApiQuery } from "@/lib/use-api-query";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/use-favorites";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  basePrice: string;
  currentStock: number;
  isFeatured: boolean;
  isPromotion: boolean;
  category: { name: string } | null;
  images: { url: string }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { favoritedIds, toggle, error: favoriteError } = useFavorites();
  const { data: product, isLoading } = useApiQuery<ProductDetail>(["products", "detail", id], `/products/${id}`);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
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
            <div className="flex items-start justify-between gap-3">
              <div>
                {(product.isPromotion || product.isFeatured) && (
                  <span
                    className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                      product.isPromotion ? "bg-critical" : "bg-brand"
                    }`}
                  >
                    {product.isPromotion ? "Promo" : "Featured"}
                  </span>
                )}
                <h1 className="text-2xl font-semibold text-ink">{product.name}</h1>
              </div>
              <FavoriteButton
                active={favoritedIds.has(product.id)}
                onToggle={() => toggle(product.id)}
                className="border border-line"
              />
            </div>
            <p className="text-sm text-muted">
              {product.sku} · per {product.unit}
              {product.category && ` · ${product.category.name}`}
            </p>
            {favoriteError && <p className="mt-1 text-xs text-critical">{favoriteError}</p>}
          </div>

          <p className="text-3xl font-semibold text-ink">{product.basePrice}</p>

          {product.description && <p className="whitespace-pre-line text-sm text-muted">{product.description}</p>}

          {outOfStock ? (
            <p className="text-sm font-medium text-critical">Out of stock</p>
          ) : (
            <div className="flex items-center gap-3">
              <QuantityStepper value={quantity} onChange={setQuantity} />
              <Button
                onClick={() => {
                  addItem({ productId: product.id, name: product.name, unitPrice: Number(product.basePrice) }, quantity);
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
