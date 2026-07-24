"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MealThumb, type MealVariant } from "@/components/illustrations/meal-thumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const DAYS: { day: string; title: string; variant: MealVariant }[] = [
  { day: "Lundi", title: "Tajine de poulet aux haricots verts", variant: "tajine" },
  { day: "Mardi", title: "Riz aux légumes et poulet", variant: "rice" },
  { day: "Mercredi", title: "Seffa medfouna", variant: "seffa" },
  { day: "Jeudi", title: "Brochettes de poulet, salade de légumes", variant: "brochette" },
  { day: "Vendredi", title: "Couscous marocain (poulet ou bœuf)", variant: "couscous" },
];

export function WeeklyMenu() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    breakpoints: {
      "(min-width: 1024px)": { active: false },
    },
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading title="Nos menus de la semaine" />
        </Reveal>

        <div className="relative mt-10">
          <button
            aria-label="Précédent"
            onClick={() => emblaApi?.scrollPrev()}
            className={cn(
              "absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-green-800 shadow-sm transition-opacity hover:bg-green-50 lg:flex",
              !canPrev && "opacity-0",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-5 lg:grid lg:grid-cols-5">
              {DAYS.map(({ day, title, variant }, i) => (
                <Reveal key={day} delay={i * 0.06} className="min-w-0 shrink-0 basis-[45%] sm:basis-[30%] lg:basis-auto">
                  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                    <div className="overflow-hidden">
                      <MealThumb
                        variant={variant}
                        className="aspect-square w-full transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="text-sm font-bold text-green-950">{day}</p>
                      <p className="text-xs leading-snug text-muted">{title}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <button
            aria-label="Suivant"
            onClick={() => emblaApi?.scrollNext()}
            className={cn(
              "absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-green-800 shadow-sm transition-opacity hover:bg-green-50 lg:flex",
              !canNext && "opacity-0",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-9 flex justify-center">
          <Link
            href="/repas"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
          >
            Voir le menu complet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
