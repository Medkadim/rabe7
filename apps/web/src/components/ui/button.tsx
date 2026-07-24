import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-green-800 text-white shadow-sm hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5",
        outline:
          "bg-transparent text-ink border border-ink/15 hover:border-green-800 hover:text-green-800 hover:-translate-y-0.5",
        inverse:
          "bg-white text-green-900 shadow-sm hover:bg-green-50 hover:-translate-y-0.5",
        link: "text-green-800 font-semibold underline-offset-4 hover:underline gap-1.5 px-0",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
