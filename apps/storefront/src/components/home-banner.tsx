import { WaslaMark } from "./wasla-mark";
import { useApiQuery } from "@/lib/use-api-query";

interface SettingsResponse {
  bannerImageUrl: string | null;
}

// The catalog page doubles as the storefront home page (the root route
// redirects straight here), so this is the first thing a customer sees.
// An admin-uploaded image (see apps/admin's Settings page) takes over here
// when set; otherwise this falls back to the generated design below, built
// as markup rather than a static asset so it always matches the brand
// tokens and never breaks in dark mode.
export function HomeBanner() {
  const { data } = useApiQuery<SettingsResponse>(["settings"], "/settings");

  if (data?.bannerImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.bannerImageUrl}
        alt=""
        className="h-40 w-full rounded-2xl object-cover sm:h-52"
      />
    );
  }

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
