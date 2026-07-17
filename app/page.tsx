import Hero from "@/components/Hero";
import HomeTeasers from "@/components/HomeTeasers";
import FinalCta from "@/components/FinalCta";
import VideoBackground from "@/components/VideoBackground";
import MiniCatalyst from "@/components/home/MiniCatalyst";
import GrowthSystemRail from "@/components/home/GrowthSystemRail";
import ProofCards from "@/components/home/ProofCards";
import DiagnoseBuildProveJourney from "@/components/home/DiagnoseBuildProveJourney";
import FitSection from "@/components/home/FitSection";
import ImproveStrip from "@/components/home/ImproveStrip";

export default function Home() {
  return (
    <main id="top">
      <Hero
        background={
          <VideoBackground
            src="/backgrounds/particles.mp4"
            poster="/backgrounds/particles-poster.jpg"
          />
        }
      />
      <MiniCatalyst />
      <GrowthSystemRail />
      <ProofCards />
      <DiagnoseBuildProveJourney />
      <HomeTeasers />
      <FitSection />
      <ImproveStrip />
      <FinalCta />
    </main>
  );
}
