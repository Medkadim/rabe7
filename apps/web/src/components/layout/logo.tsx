import { cn } from "@/lib/utils";

function BoxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M24 4 42 14v20L24 44 6 34V14Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M6 14 24 24 42 14" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 24v20" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M30 30c0 4-3 6-6 6s-3-4 0-6 6-1 6 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  className,
  tagline = true,
  inverse = false,
}: {
  className?: string;
  tagline?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BoxMark className={cn("h-9 w-9 shrink-0", inverse ? "text-white" : "text-green-800")} />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight",
            inverse ? "text-white" : "text-green-900",
          )}
        >
          GreenBox
        </span>
        {tagline && (
          <span
            className={cn(
              "text-[9px] font-medium uppercase tracking-[0.12em] mt-0.5",
              inverse ? "text-white/70" : "text-muted",
            )}
          >
            Votre pause déjeuner, notre engagement
          </span>
        )}
      </div>
    </div>
  );
}
