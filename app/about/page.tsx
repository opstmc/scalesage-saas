import type { Metadata } from "next";
import WhyNotAgency from "@/components/WhyNotAgency";
import Proof from "@/components/Proof";
import FinalCta from "@/components/FinalCta";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why ScaleSage isn't a normal AI agency, we don't sell tools or promise outcomes, we prove them. The difference, and the founding-client proof discipline.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main id="top" className="subpage">
      <WhyNotAgency />
      <Proof />
      <FinalCta />
    </main>
  );
}
