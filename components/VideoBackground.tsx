"use client";

import { useEffect, useRef } from "react";

/**
 * Optimized looping background video for the video-hero variants (/video,
 * /mesh, /fiber). Muted/looping/inline autoplay, pauses when scrolled
 * offscreen (battery + processor friendly), and falls back to the poster
 * frame for prefers-reduced-motion. A navy/teal tint keeps headline text
 * legible and the clip on-brand. Sources are 720p H.264 MP4s (~0.2–1.5 MB).
 * `src`/`poster` default to the original hero clip so /video is unchanged.
 */
export default function VideoBackground({
  src = "/hero/hero-bg.mp4",
  poster = "/hero/hero-poster.jpg",
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
