import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Framework from "@/components/Framework";
import Leaking from "@/components/Leaking";
import CatalystEntry from "@/components/CatalystEntry";
import Fixes from "@/components/Fixes";
import Industries from "@/components/Industries";
import Pricing from "@/components/Pricing";
import Proof from "@/components/Proof";
import WhyNotAgency from "@/components/WhyNotAgency";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

/**
 * Shared homepage composition. `heroBackground` swaps the hero's visual
 * signature — the homepage passes the looping particles video; if omitted,
 * the hero falls back to the animated data-stream canvas.
 */
export default function SiteHome({ heroBackground }: { heroBackground?: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero background={heroBackground} />
        <Framework />
        <Leaking />
        <CatalystEntry />
        <Fixes />
        <Industries />
        <Pricing />
        <Proof />
        <WhyNotAgency />
        <Faq />
      </main>
      <Footer />
      <ScrollReveal />
    </>
  );
}
