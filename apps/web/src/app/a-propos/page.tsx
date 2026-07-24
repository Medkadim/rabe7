import type { Metadata } from "next";
import { Heart, Sprout, Users2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { KitchenScene } from "@/components/illustrations/kitchen-scene";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "À propos",
  description: "GreenBox est un projet local à Tanger qui valorise le talent des femmes cheffes cuisinières et livre des repas sains au bureau.",
};

const VALUES = [
  {
    icon: Sprout,
    title: "Alimentation saine",
    text: "Des repas équilibrés, préparés avec des ingrédients frais et de qualité, sans compromis.",
  },
  {
    icon: Users2,
    title: "Autonomisation des femmes",
    text: "Nos cheffes cuisinières sont au cœur du projet : un revenu stable et un savoir-faire valorisé.",
  },
  {
    icon: Heart,
    title: "Impact local",
    text: "Un projet ancré à Tanger, qui soutient l'économie locale à chaque étape, du producteur à la livraison.",
  },
];

const STATS = [
  { value: "50+", label: "Entreprises clientes" },
  { value: "12", label: "Femmes cheffes cuisinières" },
  { value: "10 000+", label: "Repas livrés" },
  { value: "4.8/5", label: "Satisfaction moyenne" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="À propos"
          title="Un projet à impact, né à Tanger"
          subtitle="GreenBox valorise le talent de femmes cheffes cuisinières pour offrir des déjeuners sains aux équipes de Tanger."
        />

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <Reveal>
                <div className="overflow-hidden rounded-3xl shadow-lg shadow-green-950/10">
                  <KitchenScene className="aspect-[4/3] w-full" />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-green-950 sm:text-3xl">Notre mission</h2>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    GreenBox est né d&apos;une conviction simple : bien manger au travail ne devrait
                    pas être un luxe. Nous préparons chaque jour des repas sains et équilibrés,
                    cuisinés avec passion par des femmes cheffes expérimentées.
                  </p>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    En choisissant GreenBox, les entreprises de Tanger soutiennent l&apos;autonomisation
                    des femmes et l&apos;économie locale, tout en offrant à leurs équipes une pause
                    déjeuner de qualité, livrée directement au bureau.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-cream-soft py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <SectionHeading title="Nos valeurs" />
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-white p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
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

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="grid grid-cols-2 gap-8 rounded-3xl bg-green-800 px-6 py-10 text-center sm:px-10 lg:grid-cols-4">
              {STATS.map(({ value, label }, i) => (
                <Reveal key={label} delay={i * 0.06}>
                  <p className="text-3xl font-extrabold text-white sm:text-4xl">{value}</p>
                  <p className="mt-1 text-xs font-medium text-white/70 sm:text-sm">{label}</p>
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
