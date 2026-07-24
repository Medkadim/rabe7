import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
      <Reveal>
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-green-800 px-6 py-10 sm:px-10 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/25 text-white">
              <PackageOpen className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white sm:text-xl">
                Prêt à améliorer vos déjeuners au bureau ?
              </h3>
              <p className="mt-1 max-w-md text-sm text-white/75">
                Abonnez-vous dès maintenant et profitez de repas sains, livrés chaque jour à votre équipe.
              </p>
            </div>
          </div>
          <Link
            href="/prix"
            className={cn(buttonVariants({ variant: "inverse", size: "lg" }), "shrink-0 whitespace-nowrap")}
          >
            S&apos;abonner maintenant
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
