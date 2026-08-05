"use client";

/**
 * SPIKE — /lab/hero. Throwaway. Not wired into the homepage.
 *
 * The WebGL half. This module is *only* reached through a dynamic import in
 * capture-field.tsx, and that import is not started until after first
 * contentful paint. Nothing here is on the critical path; if this chunk 404s,
 * fails to parse, or throws, capture-field keeps the poster on screen and the
 * page above the fold is unchanged.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAUGHT_AT, LOOP_SECONDS, PALETTE, RELEASED_AT } from "./lab-constants";

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

type Uniforms = Record<string, { value: unknown }>;

/** Loop position held on the frozen frame: just after the latch, label showing. */
const REDUCED_FRAME = 0.68;

function CaptureField(props: CaptureCanvasProps & { quality: number }) {
  const [src, setSrc] = useState<{ vert: string; frag: string } | null>(null);

  // Second lazy hop: the GLSL lands in its own chunk so it can be weighed
  // separately from three/R3F/drei in the network trace.
  useEffect(() => {
    let alive = true;
    import("./capture-shader")
      .then((m) => {
        if (alive) setSrc({ vert: m.vertexShader, frag: m.fragmentShader });
      })
      .catch(() => {
        /* the shell keeps the poster up; nothing to recover here */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!src) return null;
  return <CapturePass {...props} src={src} />;
}

function CapturePass({
  src,
  onPhase,
  reduced,
  onStats,
  quality,
}: CaptureCanvasProps & { src: { vert: string; frag: string }; quality: number }) {
  const { size, gl, invalidate } = useThree();

  const uniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uLoop: { value: reduced ? REDUCED_FRAME : 0 },
      uSeed: { value: Math.random() * 100 },
      uAspect: { value: 1 },
      uQuality: { value: 1 },
      uReveal: { value: reduced ? 1 : 0 },
      uBg: { value: PALETTE.bg },
      uAccent: { value: PALETTE.accent },
      uGlow: { value: PALETTE.glow },
    }),
    [reduced],
  );

  // Aspect tracks the drawing buffer, not a camera: the vertex shader writes
  // clip space directly, so a resize needs no camera bookkeeping.
  useEffect(() => {
    uniforms.uAspect.value = size.width / Math.max(size.height, 1);
    invalidate();
  }, [size.width, size.height, uniforms, invalidate]);

  useEffect(() => {
    uniforms.uQuality.value = quality;
    invalidate();
  }, [quality, uniforms, invalidate]);

  // The frozen frame is already the caught frame, so say so once.
  useEffect(() => {
    if (reduced) onPhase("caught");
  }, [reduced, onPhase]);

  const phaseRef = useRef<Phase>("seeking");
  const clock = useRef(0);

  // --- telemetry (measurement scaffolding; goes when the route goes) --------
  const samples = useRef<number[]>([]);
  const lastAt = useRef(0);
  const reportedAt = useRef(0);

  useFrame((state, delta) => {
    if (reduced) return;

    clock.current += Math.min(delta, 0.1); // a backgrounded tab must not jump the beat
    const u = (clock.current % LOOP_SECONDS) / LOOP_SECONDS;

    if (u < (uniforms.uLoop.value as number)) {
      // Loop wrapped: reseed, so no two passes share a substrate.
      uniforms.uSeed.value = Math.random() * 100;
    }

    uniforms.uTime.value = clock.current;
    uniforms.uLoop.value = u;
    uniforms.uReveal.value = Math.min(1, (uniforms.uReveal.value as number) + delta * 1.1);

    const next: Phase = u >= CAUGHT_AT && u < RELEASED_AT ? "caught" : "seeking";
    if (next !== phaseRef.current) {
      phaseRef.current = next;
      onPhase(next);
    }

    const now = state.clock.elapsedTime;
    if (lastAt.current) {
      const ms = (now - lastAt.current) * 1000;
      if (ms > 0 && ms < 500) samples.current.push(ms);
      if (samples.current.length > 900) samples.current.shift();
    }
    lastAt.current = now;

    if (now - reportedAt.current > 1) {
      reportedAt.current = now;
      const arr = [...samples.current].sort((a, b) => a - b);
      if (arr.length > 20) {
        const dpr = gl.getPixelRatio();
        const stats: LabStats = {
          fps: Math.round(1000 / arr[Math.floor(arr.length / 2)]),
          medianFrameMs: Math.round(arr[Math.floor(arr.length / 2)] * 100) / 100,
          p95FrameMs: Math.round(arr[Math.floor(arr.length * 0.95)] * 100) / 100,
          samples: arr.length,
          dpr: Math.round(dpr * 100) / 100,
          quality,
          pixels: Math.round(size.width * dpr * size.height * dpr),
        };
        (window as unknown as { __lab?: LabStats }).__lab = stats;
        onStats?.(stats);
      }
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={src.vert}
        fragmentShader={src.frag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function CaptureCanvas(props: CaptureCanvasProps) {
  const [quality, setQuality] = useState(1);
  const [dpr, setDpr] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    // Phones ship dpr 3 with a fraction of the fill rate. Cap hard.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    return Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
  });

  // Two steps down before giving up: shader octaves first, then pixels.
  const onDecline = useCallback(() => {
    setQuality((q) => {
      if (q > 0) return 0;
      setDpr((d) => Math.max(0.7, Math.round(d * 0.8 * 100) / 100));
      return 0;
    });
  }, []);

  const frameloop = props.reduced || props.paused ? "demand" : "always";

  return (
    <Canvas
      // A fullscreen fragment pass needs no MSAA, no alpha, no depth, no stencil.
      gl={{
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      }}
      dpr={dpr}
      frameloop={frameloop}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 120 } }}
      style={{ position: "absolute", inset: 0, display: "block" }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={onDecline}
        onIncline={() => setQuality(1)}
        flipflops={3}
        onFallback={() => {
          setQuality(0);
          setDpr(0.7);
        }}
      />
      <CaptureField {...props} quality={quality} />
    </Canvas>
  );
}
