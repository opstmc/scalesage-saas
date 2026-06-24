import SiteHome from "@/components/SiteHome";
import VideoBackground from "@/components/VideoBackground";

export default function Home() {
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
