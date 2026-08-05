import { pageMetadata } from "@/lib/seo";
import Framework from "@/components/Framework";
import Leaking from "@/components/Leaking";
import Fixes from "@/components/Fixes";
import CatalystEntry from "@/components/CatalystEntry";
import FinalCta from "@/components/FinalCta";

export const generateMetadata = pageMetadata({
  path: "/how-it-works",
  title: "How it works",
  description:
    "Diagnose. Build. Prove., the ScaleSage method. We find where revenue leaks, install the systems that close it, and prove the result in numbers.",
});

export default function HowItWorks() {
  return (
    <main id="top" className="subpage">
      <Framework />
      <Leaking />
      <Fixes />
      <CatalystEntry />
      <FinalCta />
    </main>
  );
}
