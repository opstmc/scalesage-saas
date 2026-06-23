/**
 * Static image hero background (used by the /swirl variant). A full-bleed
 * cover image behind the same navy/teal tint the video variants use, so the
 * headline stays legible and the frame reads on-brand. No motion — safe for
 * prefers-reduced-motion by construction, and zero JS.
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="hero-field hero-image"
        src={src}
        alt=""
        aria-hidden="true"
        style={{ objectPosition: position }}
      />
      <div className="hero-video-tint" aria-hidden="true" />
    </>
  );
}
