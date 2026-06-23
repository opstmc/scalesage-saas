import type { Metadata } from "next";
import SiteHome from "@/components/SiteHome";
import ImageBackground from "@/components/ImageBackground";

export const metadata: Metadata = {
  title: "ScaleSage — swirl hero",
  description:
    "Electric-blue light-swirl background variant of the ScaleSage homepage. Diagnose. Build. Prove.",
  alternates: { canonical: "/swirl" },
  // comparison variant — keep it out of the index to avoid duplicate content
  robots: { index: false, follow: true },
};

export default function SwirlHome() {
  return (
    <SiteHome
      heroBackground={
        <ImageBackground src="/backgrounds/swirl.jpg" position="78% 42%" />
      }
    />
  );
}
