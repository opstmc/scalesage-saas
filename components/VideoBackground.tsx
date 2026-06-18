"use client";

import { useEffect, useRef } from "react";

/**
 * Optimized looping background video for the /video variant of the hero.
 * Muted/looping/inline autoplay, pauses when scrolled offscreen (battery +
 * processor friendly), and falls back to the poster frame for
 * prefers-reduced-motion. A navy/teal tint keeps headline text legible and
 * the clip on-brand. Source is a 720p H.264 MP4 (~0.75 MB).
 */
export default function VideoBackground() {
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
        poster="/hero/hero-poster.jpg"
        aria-hidden="true"
      >
        <source src="/hero/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-tint" aria-hidden="true" />
    </>
  );
}
