"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Quote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote: "Des repas délicieux, toujours livrés à l'heure. Nos équipes sont ravies !",
    name: "Sarah",
    role: "Responsable RH",
  },
  {
    quote: "La qualité est au rendez-vous, et la variété chaque semaine est un vrai plus.",
    name: "Youssef",
    role: "Directeur d'agence",
  },
  {
    quote: "Un service fiable, flexible et surtout des plats sains et savoureux.",
    name: "Leila",
    role: "Office Manager",
  },
  {
    quote: "GreenBox a changé notre pause déjeuner. Simple, bon, et sans stress.",
    name: "Amine",
    role: "Fondateur de startup",
  },
];

function TestimonialCard({ quote, name, role }: (typeof TESTIMONIALS)[number]) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-card-muted p-7">
      <Quote className="h-7 w-7 fill-green-700 text-green-700" />
      <p className="flex-1 text-sm italic leading-relaxed text-ink-soft">&ldquo;{quote}&rdquo;</p>
      <p className="text-sm font-semibold text-green-900">
        — {name}, <span className="font-normal text-muted">{role}</span>
      </p>
    </div>
  );
}

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading title="Ils nous font confiance" />
        </Reveal>

        {/* mobile / tablet carousel */}
        <div className="mt-10 overflow-hidden lg:hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="min-w-0 shrink-0 basis-[88%] sm:basis-[55%]">
                <TestimonialCard {...t} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 lg:hidden">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              aria-label={`Aller au témoignage ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full bg-green-800/25 transition-all",
                selected === i ? "w-6 bg-green-800" : "w-2",
              )}
            />
          ))}
        </div>

        {/* desktop static grid */}
        <div className="mt-10 hidden gap-5 lg:grid lg:grid-cols-3">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <TestimonialCard {...t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
