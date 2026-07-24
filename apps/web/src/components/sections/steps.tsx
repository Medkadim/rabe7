import { ClipboardList, SlidersHorizontal, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Choisissez votre formule",
    subtitle: "5 jours par semaine (du lundi au vendredi)",
  },
  {
    icon: SlidersHorizontal,
    title: "Indiquez vos préférences",
    subtitle: "Allergies, ingrédients à éviter, préférences...",
  },
  {
    icon: CreditCard,
    title: "Confirmez & payez",
    subtitle: "Paiement simple et sécurisé en ligne",
  },
  {
    icon: ShoppingBag,
    title: "Recevez vos repas",
    subtitle: "Livrés chaque matin au bureau avant 12h",
  },
];

export function Steps() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading title="Comment s'abonner ?" />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4">
          {STEPS.map(({ icon: Icon, title, subtitle }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && (
                  <ArrowRight className="absolute -right-6 top-8 hidden h-5 w-5 text-green-500/40 lg:block" />
                )}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-green-800 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-sm font-bold text-green-950">{title}</h3>
                <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-muted">{subtitle}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
