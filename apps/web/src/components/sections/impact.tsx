import Link from "next/link";
import { CalendarDays, ArrowRight, Leaf } from "lucide-react";
import { KitchenScene } from "@/components/illustrations/kitchen-scene";
import { Reveal } from "@/components/ui/reveal";

export function Impact() {
  return (
    <section className="bg-cream pb-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px] lg:items-stretch lg:gap-8">
          <Reveal>
            <div className="flex h-full flex-col items-center justify-center gap-5 rounded-3xl bg-card-muted p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
                <CalendarDays className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted">À partir de</p>
                <p className="flex items-baseline justify-center gap-1 text-green-800">
                  <span className="text-4xl font-extrabold">300</span>
                  <span className="text-base font-bold">DH</span>
                </p>
                <p className="text-sm font-medium text-muted">/semaine</p>
              </div>
              <div className="rounded-full bg-green-800 px-5 py-2.5 text-xs font-semibold leading-snug text-white">
                5 déjeuners équilibrés
                <br />
                du lundi au vendredi
              </div>
              <Leaf className="h-5 w-5 text-green-500/60" strokeWidth={2} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-64 overflow-hidden rounded-3xl shadow-lg shadow-green-950/10 lg:h-full">
              <KitchenScene className="h-full w-full object-cover" />
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="flex h-full flex-col justify-center gap-4 py-2">
              <h3 className="text-2xl font-bold text-green-950">Un projet à impact</h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                GreenBox est un projet local à Tanger qui valorise le talent des femmes.
              </p>
              <p className="text-sm leading-relaxed text-ink-soft">
                Nos repas sont préparés avec passion par des femmes cheffes cuisinières
                expérimentées.
              </p>
              <p className="text-sm leading-relaxed text-ink-soft">
                En choisissant GreenBox, vous soutenez l&apos;autonomisation des femmes et
                l&apos;économie locale.
              </p>
              <Link
                href="/a-propos"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-green-800 hover:underline"
              >
                En savoir plus sur notre mission
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
