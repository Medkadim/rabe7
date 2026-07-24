import { MapPin, SlidersHorizontal, CalendarClock, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: MapPin, title: "À Tanger", subtitle: "Livraison quotidienne" },
  { icon: SlidersHorizontal, title: "Repas personnalisables", subtitle: "selon vos goûts & besoins" },
  { icon: CalendarClock, title: "Programme hebdomadaire", subtitle: "varié et équilibré" },
  { icon: ShieldCheck, title: "Sans engagement", subtitle: "Flexible et sans stress" },
];

export function InfoStrip() {
  return (
    <section className="bg-green-800">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 divide-y divide-white/10 px-5 py-8 sm:grid-cols-2 sm:gap-6 sm:divide-y-0 sm:px-8 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, subtitle }, i) => (
          <div
            key={title}
            className={`flex items-center gap-4 pt-8 first:pt-0 sm:pt-0 sm:px-4 ${
              i > 0 ? "sm:border-l sm:border-white/10" : ""
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/25 text-white">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/70">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
