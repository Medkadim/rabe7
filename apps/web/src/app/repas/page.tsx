import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { MenuTabs } from "./menu-tabs";
import { Ban, Leaf, Wheat } from "lucide-react";

export const metadata: Metadata = {
  title: "Nos repas",
  description: "Découvrez nos menus de la semaine : des plats marocains et internationaux faits maison, préparés chaque jour à Tanger.",
};

const NOTES = [
  { icon: Leaf, title: "Ingrédients frais", text: "Sélectionnés chaque matin auprès de producteurs locaux." },
  { icon: Wheat, title: "Options adaptées", text: "Sans gluten, végétarien ou allergies signalées à l'abonnement." },
  { icon: Ban, title: "Zéro additif", text: "Des recettes maison, sans conservateurs ni arômes artificiels." },
];

export default function MealsPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="Nos repas"
          title="Des menus variés, chaque semaine"
          subtitle="Des recettes marocaines et internationales qui changent chaque semaine, préparées avec des ingrédients frais et de saison."
        />

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <MenuTabs />
          </div>
        </section>

        <section className="bg-cream-soft py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <SectionHeading title="Pensé pour votre bien-être" />
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {NOTES.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-white p-7 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-green-950">{title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <div className="pt-16 sm:pt-20">
          <CtaBanner />
        </div>
      </main>
      <Footer />
    </>
  );
}
