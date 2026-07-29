"use client";

import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

export function FavoriteButton({ active, onToggle, className }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-paper-raised/90 shadow-sm hover:bg-paper-raised",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={active ? "text-critical" : "text-muted"}
      >
        <path d="M12 21s-6.7-4.35-9.3-8.2C.8 9.6 1.9 5.9 5.1 4.9c2-.6 4 .2 5.1 1.8l1.8 2.5 1.8-2.5c1.1-1.6 3.1-2.4 5.1-1.8 3.2 1 4.3 4.7 2.4 7.9C18.7 16.65 12 21 12 21z" />
      </svg>
    </button>
  );
}
