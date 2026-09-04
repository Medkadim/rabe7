import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Every price in the storefront is Moroccan dirhams — this is the one
// place that formatting lives, so a second currency (or a different
// abbreviation) only ever needs to change here.
export function formatPrice(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return `${amount.toFixed(2)} د.م.`;
}
