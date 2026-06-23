import Image from "next/image";

/**
 * Static image hero background (used by the /swirl variant). A full-bleed
 * cover image behind the same navy/teal tint the video variants use, so the
 * headline stays legible and the frame reads on-brand. No motion — safe for
 * prefers-reduced-motion by construction. next/image serves AVIF/WebP at the
 * right size; `priority` because it's the LCP element on that route.
 */
export default function ImageBackground({
  src,
  position = "center",
}: {
  src: string;
  position?: string;
}) {
  return (
    <>
      <Image
        className="hero-field"
        src={src}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: position, zIndex: 0 }}
      />
      <div className="hero-video-tint" aria-hidden="true" />
    </>
  );
}
