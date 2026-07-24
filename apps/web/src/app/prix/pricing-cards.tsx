import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";

const PLANS = [
  {
    name: "Découverte",
    price: "80",
    unit: "/jour",
    description: "Idéal pour tester GreenBox sans engagement.",
    features: ["1 déjeuner à la carte", "Livraison au bureau", "Sans engagement"],
    highlighted: false,
  },
  {
    name: "Essentiel",
    price: "300",
    unit: "/semaine",
    description: "5 déjeuners équilibrés du lundi au vendredi.",
    features: [
      "5 déjeuners par semaine",
      "Menus personnalisables",
      "Livraison quotidienne au bureau",
      "Sans engagement",
    ],
    highlighted: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    unit: "",
    description: "Pour vos équipes, avec facturation groupée.",
    features: [
      "Volume et tarifs adaptés",
      "Facturation mensuelle unique",
      "Menus dédiés par équipe",
      "Interlocuteur dédié",
    ],
    highlighted: false,
  },
];

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {PLANS.map((plan, i) => (
        <Reveal key={plan.name} delay={i * 0.08}>
          <div
            className={cn(
              "flex h-full flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5",
              plan.highlighted
                ? "border-green-800 bg-green-800 text-white shadow-xl hover:shadow-2xl"
                : "border-line bg-white hover:shadow-lg",
            )}
          >
            {plan.highlighted && (
              <span className="mb-4 w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                Le plus populaire
              </span>
            )}
            <h3 className={cn("text-lg font-bold", plan.highlighted ? "text-white" : "text-green-950")}>
              {plan.name}
            </h3>
            <p className={cn("mt-1 text-sm", plan.highlighted ? "text-white/75" : "text-muted")}>
              {plan.description}
            </p>
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              {plan.price !== "Sur devis" && <span className="text-base font-bold">DH</span>}
              {plan.unit && (
                <span className={cn("text-sm font-semibold", plan.highlighted ? "text-white/80" : "text-muted")}>
                  {plan.unit}
                </span>
              )}
            </div>

            <ul className="mt-7 flex flex-1 flex-col gap-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className={cn("mt-0.5 h-4 w-4 shrink-0", plan.highlighted ? "text-white" : "text-green-700")} />
                  <span className={plan.highlighted ? "text-white/90" : "text-ink-soft"}>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: plan.highlighted ? "inverse" : "primary", size: "lg" }),
                "mt-8 w-full",
              )}
            >
              S&apos;abonner
            </Link>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
