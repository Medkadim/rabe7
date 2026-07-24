import Link from "next/link";
import { ArrowRight, Leaf, Sprout, Truck, Heart, CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroBowlIllustration } from "@/components/illustrations/hero-bowl";
import { Reveal } from "@/components/ui/reveal";

const FEATURES = [
  { icon: Leaf, label: "Sain & équilibré" },
  { icon: Sprout, label: "Ingrédients frais" },
  { icon: Truck, label: "Livraison au bureau" },
  { icon: Heart, label: "Fait avec amour" },
];

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:pb-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <Reveal>
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-green-950 sm:text-5xl">
              Votre pause déjeuner saine, livrée au bureau.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              Des repas maison, équilibrés et variés préparés chaque jour avec amour par des
              femmes talentueuses.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-4">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-700">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-medium text-ink-soft sm:text-[13px]">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/repas" className={buttonVariants({ size: "lg" })}>
                Voir les menus
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/prix" className={buttonVariants({ variant: "outline", size: "lg" })}>
                S&apos;abonner maintenant
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-[2rem] shadow-xl shadow-green-950/10">
              <HeroBowlIllustration className="aspect-[4/3] w-full" />
            </div>

            <div className="absolute -top-6 right-4 flex w-44 flex-col items-center rounded-2xl bg-white p-4 text-center shadow-lg sm:-right-6 sm:w-48">
              <span className="text-xs font-medium text-muted">À partir de</span>
              <span className="flex items-baseline gap-1 text-green-800">
                <span className="text-3xl font-extrabold">300</span>
                <span className="text-sm font-bold">DH</span>
              </span>
              <span className="text-xs font-medium text-muted">/semaine</span>
              <div className="my-3 h-px w-full bg-line" />
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
                <CalendarDays className="h-3.5 w-3.5 text-green-700" />
                5 jours de déjeuners
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
