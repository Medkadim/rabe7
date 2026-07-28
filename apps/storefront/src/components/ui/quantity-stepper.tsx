"use client";

import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
}

// A −/+ stepper reads far better than a bare number input on a touchscreen —
// no keyboard pop-up, no risk of typing a stray non-numeric character, and a
// much bigger tap target than the tiny spinner arrows browsers draw on
// <input type="number">.
export function QuantityStepper({ value, onChange, min = 1, className }: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(value + 1);

  return (
    <div className={cn("flex h-9 items-stretch overflow-hidden rounded-md border border-line", className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex w-9 shrink-0 items-center justify-center text-ink hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-40"
      >
        −
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center px-1 text-sm tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        aria-label="Increase quantity"
        className="flex w-9 shrink-0 items-center justify-center text-ink hover:bg-accent-soft"
      >
        +
      </button>
    </div>
  );
}
