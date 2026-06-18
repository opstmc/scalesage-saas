import type { Metadata } from "next";
import SiteHome from "@/components/SiteHome";
import VideoBackground from "@/components/VideoBackground";

export const metadata: Metadata = {
  title: "ScaleSage — video hero",
  description:
    "Video-background variant of the ScaleSage homepage. Diagnose. Build. Prove.",
  alternates: { canonical: "/video" },
  // variant for comparison — keep it out of the index to avoid duplicate content
  robots: { index: false, follow: true },
};

export default function VideoHome() {
  return <SiteHome heroBackground={<VideoBackground />} />;
}
