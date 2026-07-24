import { Leaf } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function PageHero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-12 pt-14 text-center sm:px-8 sm:pt-20">
      <Reveal>
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-green-700">
            <Leaf className="h-3.5 w-3.5" strokeWidth={2.5} />
            {kicker}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-green-950 sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-xl text-base leading-relaxed text-ink-soft">{subtitle}</p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
