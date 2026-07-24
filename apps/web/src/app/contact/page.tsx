import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe GreenBox pour toute question sur nos abonnements, nos menus ou nos offres entreprises à Tanger.",
};

const INFO = [
  { icon: Phone, title: "Téléphone", value: "+212 6 12 34 56 78" },
  { icon: Mail, title: "Email", value: "contact@greenbox.ma" },
  { icon: MapPin, title: "Adresse", value: "Tanger, Maroc" },
  { icon: Clock, title: "Horaires", value: "Lun – Ven, 8h – 18h" },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          kicker="Contact"
          title="Parlons de votre pause déjeuner"
          subtitle="Une question, une envie de tester GreenBox ou un projet pour votre entreprise ? Écrivez-nous."
        />

        <section className="pb-20 sm:pb-28">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <div className="flex flex-col gap-4">
                {INFO.map(({ icon: Icon, title, value }) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-card-muted p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted">{title}</p>
                      <p className="text-sm font-semibold text-green-950">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-line bg-white p-7 sm:p-9">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
