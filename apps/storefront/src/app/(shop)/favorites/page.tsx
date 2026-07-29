"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/use-favorites";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Card } from "@/components/ui/card";

function FavoriteRow({ favorite, onRemove }: { favorite: ReturnType<typeof useFavorites>["favorites"][number]; onRemove: () => void }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { product } = favorite;
  const outOfStock = product.currentStock <= 0;

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <Link href={`/catalog/${product.id}`} className="flex flex-1 items-center gap-3">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.name} className="h-14 w-14 rounded-md object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-md bg-brand-soft" />
        )}
        <div>
          <p className="font-medium text-ink hover:underline">{product.name}</p>
          <p className="text-xs text-muted">
            {product.sku} · {product.basePrice}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        {outOfStock ? (
          <p className="text-xs font-medium text-critical">Out of stock</p>
        ) : (
          <>
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <Button
              size="sm"
              onClick={() => {
                addItem({ productId: product.id, name: product.name, unitPrice: Number(product.basePrice) }, quantity);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
            >
              {added ? "Added ✓" : "Add to cart"}
            </Button>
          </>
        )}
        <FavoriteButton active onToggle={onRemove} className="border border-line" />
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { favorites, isLoading, toggle, error } = useFavorites();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">My favorites</h1>

      {error && <p className="text-sm text-critical">{error}</p>}
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && favorites.length === 0 && (
        <p className="text-sm text-muted">
          No favorites yet.{" "}
          <Link href="/catalog" className="text-accent-ink underline">
            Browse the catalog
          </Link>{" "}
          and tap the heart on a product to save it here.
        </p>
      )}

      {favorites.length > 0 && (
        <Card>
          <div className="divide-y divide-line">
            {favorites.map((favorite) => (
              <FavoriteRow key={favorite.id} favorite={favorite} onRemove={() => toggle(favorite.productId)} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
