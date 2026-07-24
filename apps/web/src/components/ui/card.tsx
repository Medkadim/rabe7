import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-line bg-card-muted p-6 transition-all duration-300",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };
