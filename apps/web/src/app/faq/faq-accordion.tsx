"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Comment fonctionne l'abonnement GreenBox ?",
    a: "Vous choisissez une formule (de 1 à 5 déjeuners par semaine), indiquez vos préférences alimentaires, puis payez en ligne. Vos repas sont ensuite livrés chaque matin au bureau.",
  },
  {
    q: "Puis-je modifier ou annuler mon abonnement ?",
    a: "Oui, nos formules sont sans engagement. Vous pouvez suspendre, modifier ou annuler votre abonnement à tout moment depuis votre espace client.",
  },
  {
    q: "Livrez-vous en dehors de Tanger ?",
    a: "Pour le moment, GreenBox livre uniquement à Tanger. Nous étudions l'ouverture de nouvelles villes prochainement.",
  },
  {
    q: "Proposez-vous des options végétariennes ou sans gluten ?",
    a: "Oui, indiquez vos préférences et restrictions alimentaires lors de l'abonnement et nous adaptons vos menus en conséquence.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le paiement se fait en ligne, de façon simple et sécurisée, au moment de la confirmation de votre abonnement.",
  },
  {
    q: "Que faire si je ne suis pas au bureau lors de la livraison ?",
    a: "Vous pouvez indiquer des consignes de livraison particulières, ou nous contacter pour reprogrammer la livraison du jour.",
  },
  {
    q: "Proposez-vous des offres pour les entreprises ?",
    a: "Oui, nous proposons des offres avec facturation groupée et menus dédiés par équipe. Contactez-nous pour en discuter.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-line bg-card-muted transition-colors"
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-sm font-semibold text-green-950">{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-green-700 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
