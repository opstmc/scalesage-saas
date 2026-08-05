"use client";

/**
 * SPIKE — /lab/hero. Throwaway. Not wired into the homepage.
 *
 * The eager half: everything that is allowed to be in the initial client
 * bundle. It knows nothing about three — no static import reaches R3F from
 * here, so the route's first-load JS is unchanged by the existence of the
 * canvas.
 *
 * Responsibilities, in order of importance:
 *  1. Never block or delay the headline. It renders a fixed-size absolutely
 *     positioned layer behind text that is already painted.
 *  2. Decide whether WebGL is worth attempting at all.
 *  3. Wait for first contentful paint, then idle, then fetch the canvas chunk.
 *  4. Survive the canvas failing, at any stage, with the poster still up.
 *
 * Query flags, for measuring (all default off):
 *   ?canvas=off  — never load the canvas. Proves the page stands without it.
 *   ?hud=1       — frame-time readout.
 *   ?rm=canvas   — force the frozen-canvas path instead of the poster under
 *                  prefers-reduced-motion.
 */

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Poster from "./poster";
import s from "./lab.module.css";
import { HOTSPOT_LABEL, LOCUS } from "./lab-constants";
import type { LabStats } from "./capture-canvas";

const CaptureCanvas = dynamic(() => import("./capture-canvas"), {
  ssr: false,
  loading: () => null,
});

/** Cheap capability probe. A throwaway context is ~1 ms and avoids shipping 500 KB to a device that cannot use it. */
function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Resolves on first contentful paint, or immediately if it has already happened. */
function afterFirstContentfulPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === "undefined") {
      setTimeout(resolve, 200);
      return;
    }
    const done = performance
      .getEntriesByType("paint")
      .some((e) => e.name === "first-contentful-paint");
    if (done) {
      resolve();
      return;
    }
    const po = new PerformanceObserver((list) => {
      if (list.getEntries().some((e) => e.name === "first-contentful-paint")) {
        po.disconnect();
        resolve();
      }
    });
    try {
      po.observe({ type: "paint", buffered: true });
    } catch {
      setTimeout(resolve, 200);
      return;
    }
    // Belt and braces: a tab that is never painted (backgrounded) must still settle.
    setTimeout(() => {
      po.disconnect();
      resolve();
    }, 3000);
  });
}

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }> {
  state = { dead: false };
  static getDerivedStateFromError() {
    return { dead: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.dead ? null : this.props.children;
  }
}

type Mode = "poster" | "poster-final" | "canvas";

export default function CaptureFieldShell() {
  const [mode, setMode] = useState<Mode>("poster");
  const [reduced, setReduced] = useState(false);
  const [caught, setCaught] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<LabStats | null>(null);
  const [hud, setHud] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setHud(q.get("hud") === "1");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rm = mq.matches;
    setReduced(rm);

    if (q.get("canvas") === "off" || !webglAvailable()) {
      setMode("poster-final");
      return;
    }
    // Reduced motion: hold the still and download nothing. Shipping half a
    // megabyte of WebGL to draw one frozen frame would be absurd.
    if (rm && q.get("rm") !== "canvas") {
      setMode("poster-final");
      return;
    }

    let cancelled = false;
    afterFirstContentfulPaint().then(() => {
      if (cancelled) return;
      const go = () => !cancelled && setMode("canvas");
      if ("requestIdleCallback" in window) {
        (window as Window & typeof globalThis).requestIdleCallback(go, { timeout: 1200 });
      } else {
        setTimeout(go, 120);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stop rendering once the hero has scrolled away.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || mode !== "canvas" || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  const onError = useCallback(() => setMode("poster-final"), []);
  const onPhase = useCallback((p: "seeking" | "caught") => setCaught(p === "caught"), []);

  return (
    <div className={s.field} ref={hostRef}>
      {/* The still stays mounted underneath the canvas: no flash if WebGL dies
          mid-session (context loss on a phone waking from sleep is routine). */}
      <Poster rich={mode === "poster-final"} />

      {mode === "canvas" ? (
        <CanvasBoundary onError={onError}>
          <CaptureCanvas
            onPhase={onPhase}
            reduced={reduced}
            paused={paused}
            onStats={setStats}
          />
        </CanvasBoundary>
      ) : null}

      {/* The hotspot. DOM, not texture: real text, selectable, translatable,
          crisp at any DPR, and it survives the canvas dying. */}
      <div
        className={s.hotspot}
        data-on={caught || mode === "poster-final" ? "" : undefined}
        style={{ left: `${LOCUS.leftPct}%`, top: `${LOCUS.topPct}%` }}
      >
        <span className={s.hotspotStem} />
        <span className={s.hotspotText}>{HOTSPOT_LABEL}</span>
      </div>

      {hud ? (
        <div className={s.hud}>
          <div>mode {mode}</div>
          {stats ? (
            <>
              <div>{stats.fps} fps (median)</div>
              <div>med {stats.medianFrameMs} ms · p95 {stats.p95FrameMs} ms</div>
              <div>
                dpr {stats.dpr} · q{stats.quality} · {(stats.pixels / 1e6).toFixed(2)} Mpx
              </div>
            </>
          ) : (
            <div>no frames yet</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
