import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Reveal } from "@/components/ui/reveal";
import { FaqAccordion } from "./faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Les réponses aux questions les plus fréquentes sur l'abonnement, la livraison et les menus GreenBox.",
};

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="FAQ"
          title="Questions fréquentes"
          subtitle="Vous ne trouvez pas de réponse à votre question ? Contactez-nous directement."
        />

        <section className="pb-20 sm:pb-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <Reveal>
              <FaqAccordion />
            </Reveal>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
