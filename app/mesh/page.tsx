import type { Metadata } from "next";
import SiteHome from "@/components/SiteHome";
import VideoBackground from "@/components/VideoBackground";

export const metadata: Metadata = {
  title: "ScaleSage — mesh hero",
  description:
    "Wireframe-terrain background variant of the ScaleSage homepage. Diagnose. Build. Prove.",
  alternates: { canonical: "/mesh" },
  // comparison variant — keep it out of the index to avoid duplicate content
  robots: { index: false, follow: true },
};

export default function MeshHome() {
  return (
    <SiteHome
      heroBackground={
        <VideoBackground
          src="/backgrounds/mesh.mp4"
          poster="/backgrounds/mesh-poster.jpg"
        />
      }
    />
  );
}
