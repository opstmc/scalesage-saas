import { pageMetadata } from "@/lib/seo";
import CatalystExperience from "@/components/catalyst/CatalystExperience";

// The Catalyst mini-scan must be the fastest page on the site (brief §9):
// no background video, no heavy hero — the Sage orb is CSS-only. The entry
// copy and "Begin scan." CTA live in <CatalystExperience> so the transition
// into the scan flows without a hard cut ("Jarvis flow").
export const generateMetadata = pageMetadata({
  path: "/catalyst",
  title: "Catalyst scan",
  description:
    "Sage is ready to scan your business. A short tap-first scan and a directional leak map in minutes. No payment to begin, full roadmap within an hour.",
  socialDescription:
    "Sage is ready to scan your business. A directional leak map in minutes. No payment to begin.",
});

export default function CatalystPage() {
  return (
    <main id="top" className="subpage">
      <CatalystExperience />
    </main>
  );
}
