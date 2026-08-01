import { WaslaMark } from "./wasla-mark";

// The catalog page doubles as the storefront home page (the root route
// redirects straight here), so this is the first thing a customer sees.
// Built as markup, not an uploaded image, so it inherits the same brand
// tokens as the rest of the app and never goes stale or breaks in dark
// mode like a static asset would.
export function HomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-8 sm:px-10 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-8 -top-10 opacity-20 sm:-start-4 sm:-top-6"
      >
        <WaslaMark size={180} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 end-1/3 opacity-10"
      >
        <WaslaMark size={140} />
      </div>
      <div className="relative flex flex-col gap-2">
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
          الجملة بكل بساطة
        </span>
        <h1 className="max-w-md text-2xl font-semibold text-white sm:text-3xl">
          كل ما تحتاجه رفوفك، في طلب واحد.
        </h1>
        <p className="max-w-md text-sm text-white/80">
          تصفح كامل المنتجات، تابع العروض الخاصة، وأعد طلب منتجاتك المعتادة بضغطات قليلة.
        </p>
      </div>
    </div>
  );
}
