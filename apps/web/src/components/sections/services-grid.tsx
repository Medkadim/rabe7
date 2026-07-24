import { Leaf, UtensilsCrossed, UserCog, Truck } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const SERVICES = [
  {
    icon: Leaf,
    title: "Repas sains & faits maison",
    description: "Des plats équilibrés préparés chaque jour avec des ingrédients frais et de qualité.",
  },
  {
    icon: UtensilsCrossed,
    title: "Menus variés chaque semaine",
    description: "Des recettes marocaines et internationales qui changent chaque jour.",
  },
  {
    icon: UserCog,
    title: "Personnalisation",
    description: "Adaptez vos repas selon vos goûts, vos régimes ou vos restrictions alimentaires.",
  },
  {
    icon: Truck,
    title: "Livraison au bureau",
    description: "Livraison quotidienne à Tanger, à l'heure du déjeuner, directement à votre bureau.",
  },
];

export function ServicesGrid() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading title="Nos services" />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-card-muted p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-green-200 hover:shadow-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-sm font-bold text-green-950">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
