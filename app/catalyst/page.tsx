import type { Metadata } from "next";
import CatalystExperience from "@/components/catalyst/CatalystExperience";

// The Catalyst mini-scan must be the fastest page on the site (brief §9):
// no background video, no heavy hero — the Sage orb is CSS-only. The entry
// copy and "Begin scan." CTA live in <CatalystExperience> so the transition
// into the scan flows without a hard cut ("Jarvis flow").
export const metadata: Metadata = {
  title: "Catalyst scan",
  description:
    "Sage is ready to scan your business. Ten sharp questions, mostly taps, and a directional leak map in minutes. No payment to begin — full roadmap within 24 hours.",
  alternates: { canonical: "/catalyst" },
  openGraph: {
    type: "website",
    url: "https://scalesage.ai/catalyst",
    title: "Catalyst scan · ScaleSage",
    description:
      "Sage is ready to scan your business. A directional leak map in minutes. No payment to begin.",
  },
  robots: { index: true, follow: true },
};

export default function CatalystPage() {
  return (
    <main id="top" className="subpage">
      <CatalystExperience />
    </main>
  );
}
