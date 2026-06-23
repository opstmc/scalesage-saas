import type { Metadata } from "next";
import SiteHome from "@/components/SiteHome";
import VideoBackground from "@/components/VideoBackground";

export const metadata: Metadata = {
  title: "ScaleSage — fiber hero",
  description:
    "Fiber-optic data-stream background variant of the ScaleSage homepage. Diagnose. Build. Prove.",
  alternates: { canonical: "/fiber" },
  // comparison variant — keep it out of the index to avoid duplicate content
  robots: { index: false, follow: true },
};

export default function FiberHome() {
  return (
    <SiteHome
      heroBackground={
        <VideoBackground
          src="/backgrounds/fiber.mp4"
          poster="/backgrounds/fiber-poster.jpg"
        />
      }
    />
  );
}
