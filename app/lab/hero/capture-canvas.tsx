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
import type { ShaderMaterial } from "three";
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

/** ?loop=0..1 freezes the beat at one position, so a specific frame can be reviewed. */
function frozenAt(): number | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("loop");
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

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

  const frozen = useMemo(() => frozenAt(), []);

  // R3F does NOT keep the uniforms object you hand it: applyProps copies each
  // entry into the material's own `uniforms` ({ ...uniform }, fiber's events
  // bundle ~L435). Mutating the object below therefore does nothing once the
  // material exists — every write has to go through the material ref. The
  // symptom is a hero that renders one correct frame and then never moves.
  const mat = useRef<ShaderMaterial>(null);

  const uniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uLoop: { value: frozen ?? (reduced ? REDUCED_FRAME : 0) },
      // Seeded on mount, not here: Math.random() during render is impure and
      // would differ between the render pass and any replay of it.
      uSeed: { value: 0 },
      uAspect: { value: 1 },
      uQuality: { value: 1 },
      // A frozen frame has no chance to fade itself in.
      uReveal: { value: reduced || frozen !== null ? 1 : 0 },
      uBg: { value: PALETTE.bg },
      uAccent: { value: PALETTE.accent },
      uGlow: { value: PALETTE.glow },
    }),
    [reduced, frozen],
  );

  // First seed, once the material exists. Every later loop reseeds in useFrame.
  useEffect(() => {
    if (!mat.current) return;
    mat.current.uniforms.uSeed.value = Math.random() * 100;
    invalidate();
  }, [invalidate]);

  // Aspect tracks the drawing buffer, not a camera: the vertex shader writes
  // clip space directly, so a resize needs no camera bookkeeping.
  useEffect(() => {
    if (!mat.current) return;
    mat.current.uniforms.uAspect.value = size.width / Math.max(size.height, 1);
    invalidate();
  }, [size.width, size.height, invalidate]);

  useEffect(() => {
    if (!mat.current) return;
    mat.current.uniforms.uQuality.value = quality;
    invalidate();
  }, [quality, invalidate]);

  // A frozen frame never crosses a phase boundary, so announce it once.
  useEffect(() => {
    const at = frozen ?? (reduced ? REDUCED_FRAME : null);
    if (at !== null) onPhase(at >= CAUGHT_AT && at < RELEASED_AT ? "caught" : "seeking");
  }, [reduced, frozen, onPhase]);

  const phaseRef = useRef<Phase>("seeking");
  const clock = useRef(0);

  // --- telemetry (measurement scaffolding; goes when the route goes) --------
  const samples = useRef<number[]>([]);
  const lastAt = useRef(0);
  const reportedAt = useRef(0);

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m || reduced || frozen !== null) return;
    const U = m.uniforms;

    clock.current += Math.min(delta, 0.1); // a backgrounded tab must not jump the beat
    const u = (clock.current % LOOP_SECONDS) / LOOP_SECONDS;

    if (u < (U.uLoop.value as number)) {
      // Loop wrapped: reseed, so no two passes share a substrate.
      U.uSeed.value = Math.random() * 100;
    }

    U.uTime.value = clock.current;
    U.uLoop.value = u;
    U.uReveal.value = Math.min(1, (U.uReveal.value as number) + delta * 1.1);

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
        ref={mat}
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
  // ?adapt=0 pins quality and DPR, so a fill-rate sweep measures the shader
  // rather than the degrade ladder reacting to it.
  const adapt =
    typeof window === "undefined" ||
    new URLSearchParams(window.location.search).get("adapt") !== "0";
  const [dpr, setDpr] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    // ?dpr=N forces the pixel count, to find the fill-rate ceiling. Measurement
    // scaffolding: CPU throttling in devtools does not touch the GPU, so the
    // only way to size the fragment cost is to make the GPU do more of it.
    const forced = Number(new URLSearchParams(window.location.search).get("dpr"));
    if (forced > 0) return forced;
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

  const frameloop = props.reduced || props.paused || frozenAt() !== null ? "demand" : "always";

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
      {adapt ? (
        <PerformanceMonitor
          onDecline={onDecline}
          onIncline={() => setQuality(1)}
          flipflops={3}
          onFallback={() => {
            setQuality(0);
            setDpr(0.7);
          }}
        />
      ) : null}
      <CaptureField {...props} quality={quality} />
    </Canvas>
  );
}
