"use client";

import { useEffect, useRef } from "react";

/**
 * Optimized looping hero background video. Muted/looping/inline autoplay,
 * pauses when scrolled offscreen (battery + processor friendly), and falls
 * back to the poster frame for prefers-reduced-motion. A navy/teal tint keeps
 * headline text legible and the clip on-brand. `src`/`poster` default to the
 * homepage particles clip (1080p H.264 MP4, ~3.9 MB, faststart).
 */
export default function VideoBackground({
  src = "/backgrounds/particles.mp4",
  poster = "/backgrounds/particles-poster.jpg",
}: {
  src?: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      try {
        v.pause();
      } catch {
        /* ignore */
      }
      return; // poster frame stands in
    }

    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) v.play().catch(() => {});
            else v.pause();
          });
        },
        { threshold: 0.05 }
      );
      io.observe(v);
    } else {
      v.play().catch(() => {});
    }
    return () => {
      if (io) io.disconnect();
    };
  }, []);

  return (
    <>
      <video
        ref={ref}
        className="hero-field hero-video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden="true"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="hero-video-tint" aria-hidden="true" />
    </>
  );
}
