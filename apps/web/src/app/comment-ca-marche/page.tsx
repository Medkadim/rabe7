import type { Metadata } from "next";
import { ClipboardList, SlidersHorizontal, CreditCard, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Comment ça marche ?",
  description: "Découvrez comment fonctionne l'abonnement GreenBox, du choix de votre formule à la livraison de vos repas au bureau.",
};

const STEPS = [
  {
    icon: ClipboardList,
    title: "1. Choisissez votre formule",
    text: "Sélectionnez le nombre de déjeuners par semaine qui correspond à votre rythme : de 1 à 5 jours, du lundi au vendredi.",
  },
  {
    icon: SlidersHorizontal,
    title: "2. Indiquez vos préférences",
    text: "Allergies, ingrédients à éviter, régime spécifique... Nous adaptons vos menus selon vos besoins et vos goûts.",
  },
  {
    icon: CreditCard,
    title: "3. Confirmez & payez",
    text: "Paiement simple et sécurisé en ligne. Sans engagement, vous pouvez modifier ou suspendre votre abonnement à tout moment.",
  },
  {
    icon: ShoppingBag,
    title: "4. Recevez vos repas",
    text: "Vos repas sont livrés chaque matin, directement au bureau, avant midi, prêts à être dégustés à la pause déjeuner.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="Comment ça marche ?"
          title="De l'inscription à votre déjeuner, en 4 étapes"
          subtitle="Un processus pensé pour être simple, rapide et flexible — sans engagement de votre part."
        />

        <section className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="flex flex-col gap-10">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="flex flex-col items-start gap-5 rounded-3xl border border-line bg-card-muted p-7 sm:flex-row sm:items-center sm:p-8">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                      <Icon className="h-7 w-7" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-950">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
