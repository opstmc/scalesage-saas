"use client";

/**
 * SPIKE — /lab/hero. Throwaway. Not wired into the homepage.
 *
 * The WebGL half, now hand rolled. Reached only through a dynamic import in
 * capture-field.tsx which is not started until after first contentful paint.
 * Nothing here is on the critical path: if this chunk 404s, fails to parse or
 * throws, the shell keeps the poster and the page above the fold is unchanged.
 *
 * This replaced three, React Three Fiber and drei. The spike measured them at
 * 191.6 KB brotli to run one fullscreen fragment pass with no scene graph, no
 * geometry, no loaders and no lights, and estimated a hand rolled equivalent at
 * around 4 KB. This is that equivalent, built to do everything the R3F version
 * did rather than the flattering subset: DPR handling, resize, visibility
 * pause, context loss recovery and a degrade ladder.
 *
 * The props and the LabStats shape are unchanged, so capture-field.tsx and the
 * measurement harness did not have to move with it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAUGHT_AT, LOOP_SECONDS, PALETTE, RELEASED_AT } from "./lab-constants";
import { createRenderer, type GLHandle } from "./gl";

type Phase = "seeking" | "caught";

export type LabStats = {
  fps: number;
  medianFrameMs: number;
  p95FrameMs: number;
  samples: number;
  dpr: number;
  quality: number;
  pixels: number;
};

export type CaptureCanvasProps = {
  /** Fires on loop transitions only (twice per loop), never per frame. */
  onPhase: (phase: Phase) => void;
  /** Frozen single frame for prefers-reduced-motion. */
  reduced: boolean;
  /** Scrolled out of view — stop burning frames. */
  paused: boolean;
  onStats?: (stats: LabStats) => void;
};

/** Loop position held on the frozen frame: just after the latch, label showing. */
const REDUCED_FRAME = 0.68;

/** ?loop=0..1 freezes the beat at one position, so a specific frame can be reviewed. */
function frozenAt(): number | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("loop");
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

function initialDpr(): number {
  if (typeof window === "undefined") return 1;
  const forced = Number(new URLSearchParams(window.location.search).get("dpr"));
  if (forced > 0) return forced;
  // Phones ship dpr 3 with a fraction of the fill rate. Cap hard.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
}

export default function CaptureCanvas({ onPhase, reduced, paused, onStats }: CaptureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const frozen = useMemo(() => frozenAt(), []);

  // Everything the frame loop touches lives in refs. A uniform write must never
  // cost a React render: at 60fps that would be 60 reconciliations a second to
  // move one float, which is part of the overhead this rewrite removes.
  const gl = useRef<GLHandle | null>(null);
  const clock = useRef(0);
  // Seeded on mount, not here: Math.random() during render is impure, so a
  // replay of the render pass would produce a different substrate.
  const seed = useRef(0);
  const reveal = useRef(reduced || frozen !== null ? 1 : 0);
  const loop = useRef(frozen ?? (reduced ? REDUCED_FRAME : 0));
  const phase = useRef<Phase>("seeking");
  const quality = useRef(1);
  const dpr = useRef(1);

  const onPhaseRef = useRef(onPhase);
  const onStatsRef = useRef(onStats);
  useEffect(() => {
    onPhaseRef.current = onPhase;
    onStatsRef.current = onStats;
  }, [onPhase, onStats]);

  const pausedRef = useRef(paused);
  const reducedRef = useRef(reduced);
  useEffect(() => {
    pausedRef.current = paused;
    reducedRef.current = reduced;
  }, [paused, reduced]);

  // ?adapt=0 pins quality and DPR so a fill-rate sweep measures the shader
  // rather than the degrade ladder reacting to it.
  const adapt = useMemo(
    () =>
      typeof window === "undefined" ||
      new URLSearchParams(window.location.search).get("adapt") !== "0",
    [],
  );

  const paint = useCallback((handle: GLHandle) => {
    handle.setFloat("uTime", clock.current);
    handle.setFloat("uLoop", loop.current);
    handle.setFloat("uSeed", seed.current);
    handle.setFloat("uQuality", quality.current);
    handle.setFloat("uReveal", reveal.current);
    const { width, height } = handle.size();
    handle.setFloat("uAspect", width / Math.max(height, 1));
    handle.draw();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: GLHandle | null = null;
    let raf = 0;
    let alive = true;
    let last = 0;
    let painted = false;

    // Frame times, for the HUD and the degrade ladder. Same shape the R3F
    // version reported, so the measurement harness is unchanged.
    const samples: number[] = [];
    let reportedAt = 0;
    let declines = 0;

    // Second lazy hop: the GLSL lands in its own chunk so it can be weighed
    // separately from the renderer in the network trace.
    import("./capture-shader")
      .then((mod) => {
        if (!alive) return;
        seed.current = Math.random() * 100;
        dpr.current = initialDpr();
        handle = createRenderer(canvas, mod.fragmentShader, dpr.current);
        if (!handle) return; // no WebGL, or the shader would not compile
        gl.current = handle;

        handle.setVec3("uBg", PALETTE.bg);
        handle.setVec3("uAccent", PALETTE.accent);
        handle.setVec3("uGlow", PALETTE.glow);
        setReady(true);

        // A frozen frame never crosses a phase boundary, so announce it once.
        const at = frozen ?? (reducedRef.current ? REDUCED_FRAME : null);
        if (at !== null) {
          onPhaseRef.current(at >= CAUGHT_AT && at < RELEASED_AT ? "caught" : "seeking");
        }

        const frame = (now: number) => {
          if (!alive || !handle) return;
          raf = requestAnimationFrame(frame);

          const still = reducedRef.current || frozen !== null;

          // A paused, hidden or lost canvas keeps the rAF alive so it notices
          // when it is un-paused, but advances nothing and draws nothing.
          // Resetting `last` is what stops the beat jumping forward on return.
          if (pausedRef.current || document.hidden || handle.isLost()) {
            last = 0;
            return;
          }

          if (still) {
            if (!painted) {
              paint(handle);
              painted = true;
            }
            return;
          }

          const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
          last = now;
          clock.current += delta;

          const u = (clock.current % LOOP_SECONDS) / LOOP_SECONDS;
          // Loop wrapped: reseed, so no two passes share a substrate.
          if (u < loop.current) seed.current = Math.random() * 100;
          loop.current = u;
          reveal.current = Math.min(1, reveal.current + delta * 1.1);

          const next: Phase = u >= CAUGHT_AT && u < RELEASED_AT ? "caught" : "seeking";
          if (next !== phase.current) {
            phase.current = next;
            onPhaseRef.current(next);
          }

          paint(handle);

          if (delta > 0) {
            const ms = delta * 1000;
            if (ms < 500) samples.push(ms);
            if (samples.length > 900) samples.shift();
          }

          if (now - reportedAt > 1000 && samples.length > 20) {
            reportedAt = now;
            const sorted = [...samples].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const { width, height, dpr: ratio } = handle.size();
            const stats: LabStats = {
              fps: Math.round(1000 / median),
              medianFrameMs: Math.round(median * 100) / 100,
              p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100,
              samples: sorted.length,
              dpr: Math.round(ratio * 100) / 100,
              quality: quality.current,
              pixels: width * height,
            };
            (window as unknown as { __lab?: LabStats }).__lab = stats;
            onStatsRef.current?.(stats);

            // The degrade ladder drei's PerformanceMonitor used to run. Two
            // steps down before giving up: shader octaves first, then pixels.
            // Three consecutive bad seconds are required, so one stutter caused
            // by something else on the page cannot permanently downgrade it.
            if (adapt) {
              if (median > 20) {
                declines += 1;
                if (declines >= 3) {
                  declines = 0;
                  if (quality.current > 0) {
                    quality.current = 0;
                  } else {
                    dpr.current = Math.max(0.7, Math.round(dpr.current * 0.8 * 100) / 100);
                    handle.setDpr(dpr.current);
                  }
                }
              } else {
                declines = 0;
              }
            }
          }
        };
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {
        /* the shell keeps the poster up; nothing to recover here */
      });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      handle?.dispose();
      gl.current = null;
    };
  }, [adapt, frozen, paint]);

  // Redraw the still frame when reduced motion changes, since the loop is not
  // running to do it.
  useEffect(() => {
    if (ready && gl.current && (reduced || frozen !== null)) paint(gl.current);
  }, [ready, reduced, frozen, paint]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%" }}
    />
  );
}
