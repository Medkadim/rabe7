import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { InfoStrip } from "@/components/sections/info-strip";
import { WeeklyMenu } from "@/components/sections/weekly-menu";
import { Steps } from "@/components/sections/steps";
import { ServicesGrid } from "@/components/sections/services-grid";
import { Impact } from "@/components/sections/impact";
import { Testimonials } from "@/components/sections/testimonials";
import { CtaBanner } from "@/components/sections/cta-banner";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <InfoStrip />
        <WeeklyMenu />
        <Steps />
        <ServicesGrid />
        <Impact />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
