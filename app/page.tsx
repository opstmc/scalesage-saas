import Hero from "@/components/Hero";
import HomeTeasers from "@/components/HomeTeasers";
import FinalCta from "@/components/FinalCta";
import VideoBackground from "@/components/VideoBackground";

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
      <HomeTeasers />
      <FinalCta />
    </main>
  );
}
