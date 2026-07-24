import { cn } from "@/lib/utils";
import { Leaf } from "lucide-react";

export function SectionHeading({
  title,
  className,
  light,
}: {
  title: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center gap-3", className)}>
      <h2
        className={cn(
          "text-2xl sm:text-3xl font-bold tracking-tight",
          light ? "text-white" : "text-green-950",
        )}
      >
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <span className="h-px w-7 bg-green-500/50" />
        <Leaf className="h-3.5 w-3.5 text-green-600" strokeWidth={2.5} />
        <span className="h-px w-7 bg-green-500/50" />
      </div>
    </div>
  );
}
