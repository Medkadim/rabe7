import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Receipt, Users, HeartHandshake } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Entreprises",
  description: "GreenBox pour les entreprises : des déjeuners sains et livrés pour vos équipes, avec facturation groupée et menus dédiés.",
};

const BENEFITS = [
  {
    icon: Users,
    title: "Le bien-être de vos équipes",
    text: "Des repas sains et variés qui améliorent la satisfaction et l'énergie de vos collaborateurs.",
  },
  {
    icon: Receipt,
    title: "Facturation simplifiée",
    text: "Une facture mensuelle unique pour toute l'entreprise, sans notes de frais à gérer.",
  },
  {
    icon: Building2,
    title: "Menus dédiés par équipe",
    text: "Adaptez les menus par département ou par site, selon les préférences de chacun.",
  },
  {
    icon: HeartHandshake,
    title: "Un interlocuteur dédié",
    text: "Un contact GreenBox unique pour gérer votre abonnement et répondre à vos besoins.",
  },
];

export default function CompaniesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="Entreprises"
          title="Des déjeuners sains pour toute votre équipe"
          subtitle="GreenBox accompagne les entreprises de Tanger avec une offre adaptée : menus variés, facturation groupée et livraison quotidienne au bureau."
        />

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <SectionHeading title="Pourquoi les entreprises nous choisissent" />
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-card-muted p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
                      <Icon className="h-7 w-7" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-5 text-sm font-bold text-green-950">{title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-soft py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-green-950 sm:text-3xl">
                Discutons de vos besoins
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Nombre de collaborateurs, sites, préférences alimentaires... Contactez-nous pour
                construire une offre sur mesure pour votre entreprise.
              </p>
              <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
                Demander un devis
              </Link>
            </Reveal>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
