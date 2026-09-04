import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Every price in this app is Moroccan dirhams — matches
// apps/storefront/src/lib/utils.ts's formatPrice.
export function formatPrice(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return `${amount.toFixed(2)} د.م.`;
}
