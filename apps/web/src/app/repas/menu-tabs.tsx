"use client";

import { useState } from "react";
import { MealThumb, type MealVariant } from "@/components/illustrations/meal-thumb";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

type Meal = { day: string; title: string; variant: MealVariant; tags: string[] };

const WEEKS: Record<string, Meal[]> = {
  "Semaine 1": [
    { day: "Lundi", title: "Tajine de poulet aux haricots verts", variant: "tajine", tags: ["Sans gluten", "480 kcal"] },
    { day: "Mardi", title: "Riz aux légumes et poulet", variant: "rice", tags: ["Équilibré", "510 kcal"] },
    { day: "Mercredi", title: "Seffa medfouna", variant: "seffa", tags: ["Traditionnel", "540 kcal"] },
    { day: "Jeudi", title: "Brochettes de poulet, salade de légumes", variant: "brochette", tags: ["Riche en protéines", "460 kcal"] },
    { day: "Vendredi", title: "Couscous marocain (poulet ou bœuf)", variant: "couscous", tags: ["Fait maison", "560 kcal"] },
  ],
  "Semaine 2": [
    { day: "Lundi", title: "Poulet rôti, légumes de saison", variant: "brochette", tags: ["Sans gluten", "470 kcal"] },
    { day: "Mardi", title: "Riz cantonais au poulet", variant: "rice", tags: ["Rapide", "500 kcal"] },
    { day: "Mercredi", title: "Tajine de kefta aux œufs", variant: "tajine", tags: ["Riche en fer", "520 kcal"] },
    { day: "Jeudi", title: "Seffa aux amandes et poulet", variant: "seffa", tags: ["Traditionnel", "550 kcal"] },
    { day: "Vendredi", title: "Couscous aux sept légumes", variant: "couscous", tags: ["Végétarien dispo.", "530 kcal"] },
  ],
};

export function MenuTabs() {
  const weeks = Object.keys(WEEKS);
  const [active, setActive] = useState(weeks[0]);

  return (
    <div>
      <div className="flex justify-center gap-2">
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => setActive(w)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              active === w ? "bg-green-800 text-white" : "bg-card-muted text-ink-soft hover:bg-green-50",
            )}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {WEEKS[active].map(({ day, title, variant, tags }, i) => (
          <Reveal key={day} delay={i * 0.06}>
            <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
              <div className="overflow-hidden">
                <MealThumb variant={variant} className="aspect-square w-full transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-sm font-bold text-green-950">{day}</p>
                <p className="text-xs leading-snug text-muted">{title}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
