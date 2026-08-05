import Hero from "@/components/Hero";
import HomeTeasers from "@/components/HomeTeasers";
import FinalCta from "@/components/FinalCta";
import VideoBackground from "@/components/VideoBackground";
import MiniCatalyst from "@/components/home/MiniCatalyst";
import GrowthSystemRail from "@/components/home/GrowthSystemRail";
import MechanismShowcase from "@/components/home/MechanismShowcase";
import ProofCards from "@/components/home/ProofCards";
import DiagnoseBuildProveJourney from "@/components/home/DiagnoseBuildProveJourney";
import FitSection from "@/components/home/FitSection";
import ImproveStrip from "@/components/home/ImproveStrip";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_DESCRIPTION, pageMetadata } from "@/lib/seo";

// No `title`: the homepage keeps the root layout's untemplated default title
// rather than picking up the "%s · ScaleSage" suffix.
export const generateMetadata = pageMetadata({
  path: "/",
  description: DEFAULT_DESCRIPTION,
  socialDescription: DEFAULT_SOCIAL_DESCRIPTION,
});

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
      <MechanismShowcase />
      <ProofCards />
      <DiagnoseBuildProveJourney />
      <HomeTeasers />
      <FitSection />
      <ImproveStrip />
      <FinalCta />
    </main>
  );
}
