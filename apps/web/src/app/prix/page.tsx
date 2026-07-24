import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { PricingCards } from "./pricing-cards";

export const metadata: Metadata = {
  title: "Nos prix",
  description: "Des formules simples et sans engagement, à partir de 300 DH par semaine pour 5 déjeuners équilibrés livrés au bureau.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="Nos prix"
          title="Une formule simple, sans engagement"
          subtitle="Choisissez la formule qui correspond à votre équipe. Vous pouvez suspendre ou modifier votre abonnement à tout moment."
        />

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <PricingCards />
            <p className="mt-8 text-center text-sm text-muted">
              Des questions sur nos formules ?{" "}
              <Link href="/faq" className="font-semibold text-green-800 hover:underline">
                Consultez notre FAQ
              </Link>
              .
            </p>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
