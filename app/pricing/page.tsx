import type { Metadata } from "next";
import Pricing from "@/components/Pricing";
import PricingStandalone, { AfterYouPayTimeline } from "@/components/PricingStandalone";
import Faq, { FAQS } from "@/components/Faq";
import FinalCta from "@/components/FinalCta";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Starter £597 plus £297 setup, Pro £1,497 plus £747, Max £4,997 plus £2,497. Public, monthly pricing, every tier accountable to a number. Plus straight answers to the real questions.",
  alternates: { canonical: "/pricing" },
};

// FAQPage structured data, generated from the same answers the page renders so
// the two cannot drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <main id="top" className="subpage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Anchoring order: tiers first (the bundle deal), then the
          standalone table (proves subscribers save), then the
          "after you pay" timeline. */}
      <Pricing />
      <PricingStandalone />
      <AfterYouPayTimeline />
      <Faq />
      <FinalCta />
    </main>
  );
}
