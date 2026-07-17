import type { Metadata } from "next";
import Pricing from "@/components/Pricing";
import PricingStandalone, { AfterYouPayTimeline } from "@/components/PricingStandalone";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Starter £597, Pro £1,497, Max £4,997, public, monthly pricing, every tier accountable to a number. Plus straight answers to the real questions.",
  alternates: { canonical: "/pricing" },
};

// FAQPage structured data lives here, where the FAQ actually renders.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is this different from buying a £99 AI receptionist tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A tool is a part. We diagnose which leak is costing you the most, install the system that closes it, monitor it, and prove it moved your numbers. You buy the outcome, not the part.",
      },
    },
    {
      "@type": "Question",
      name: "We're a small business, is this overkill for us?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Starter exists for exactly this: one acute leak, plugged, with a monthly ROI report. The Catalyst diagnostic shows you what your biggest leak is worth before you commit to anything.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if it doesn't work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every system has a number against it, with a baseline measured at install. We guarantee implementation. We target performance. We report both honestly.",
      },
    },
    {
      "@type": "Question",
      name: "Is our data safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GDPR-compliant by design, UK and EU. We disclose exactly what the site loads, you own your data, and nothing is sold or used to train external AI.",
      },
    },
  ],
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
