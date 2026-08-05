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
 *  1. Never block or delay the headline. It renders an absolutely positioned
 *     layer behind text that is already painted and already laid out.
 *  2. Decide whether WebGL is worth attempting at all.
 *  3. Wait for first contentful paint, then idle, then fetch the canvas chunk.
 *  4. Survive the canvas failing, at any stage, with the still still up.
 *
 * Query flags, for measuring (all default off):
 *   ?canvas=off  — never load the canvas. Proves the page stands without it.
 *   ?hud=1       — frame-time readout.
 *   ?rm=canvas   — force the frozen-canvas path instead of the still under
 *                  prefers-reduced-motion.
 *   ?loop=0..1   — freeze the beat at one position, to review a single frame.
 *   ?dpr=N       — force the pixel count, for the fill-rate sweep.
 *   ?adapt=0     — pin quality and DPR so a sweep measures the shader rather
 *                  than the degrade ladder reacting to it.
 */

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Poster from "./poster";
import s from "./lab.module.css";
import { HOTSPOT_LABEL, LOCUS } from "./lab-constants";
import type { LabStats } from "./capture-canvas";

const CaptureCanvas = dynamic(() => import("./capture-canvas"), {
  ssr: false,
  loading: () => null,
});

/**
 * One-shot facts about this client: URL flags, the motion preference, and
 * whether WebGL exists at all. Read through useSyncExternalStore rather than an
 * effect plus setState, so the first client render already knows the answer
 * instead of rendering once and immediately re-rendering.
 */
type Env = {
  hud: boolean;
  reduced: boolean;
  canvasOff: boolean;
  rmCanvas: boolean;
  webgl: boolean;
};

/** What the server assumes: no WebGL, so SSR emits the static still. */
const SERVER_ENV: Env = {
  hud: false,
  reduced: false,
  canvasOff: false,
  rmCanvas: false,
  webgl: false,
};

let cachedEnv: Env | null = null;

function readEnv(): Env {
  // Cached because getSnapshot must return a referentially stable value.
  if (cachedEnv) return cachedEnv;
  const q = new URLSearchParams(window.location.search);
  let webgl = false;
  try {
    // A throwaway context costs about a millisecond, and saves shipping half a
    // megabyte to a device that cannot use a byte of it.
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  cachedEnv = {
    hud: q.get("hud") === "1",
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    canvasOff: q.get("canvas") === "off",
    rmCanvas: q.get("rm") === "canvas",
    webgl,
  };
  return cachedEnv;
}

/** None of the above changes within a page view, so there is nothing to subscribe to. */
const subscribeEnv = () => () => {};

/** Resolves on first contentful paint, or immediately if it has already happened. */
function afterFirstContentfulPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === "undefined") {
      setTimeout(resolve, 200);
      return;
    }
    const painted = performance
      .getEntriesByType("paint")
      .some((e) => e.name === "first-contentful-paint");
    if (painted) {
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
    // Belt and braces: a tab opened in the background never paints, and must
    // still settle rather than wait forever on a paint that is not coming.
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
  const env = useSyncExternalStore(subscribeEnv, readEnv, () => SERVER_ENV);

  const [canvasUp, setCanvasUp] = useState(false);
  const [failed, setFailed] = useState(false);
  const [caught, setCaught] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<LabStats | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // Reduced motion holds the still and downloads nothing. Shipping half a
  // megabyte of WebGL to draw one frozen frame would be absurd.
  const wantsCanvas =
    env.webgl && !env.canvasOff && !failed && (!env.reduced || env.rmCanvas);

  const mode: Mode = !wantsCanvas ? "poster-final" : canvasUp ? "canvas" : "poster";

  useEffect(() => {
    if (!wantsCanvas) return;
    let cancelled = false;
    afterFirstContentfulPaint().then(() => {
      if (cancelled) return;
      const go = () => {
        if (!cancelled) setCanvasUp(true);
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(go, { timeout: 1200 });
      } else {
        setTimeout(go, 120);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wantsCanvas]);

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

  const onError = useCallback(() => setFailed(true), []);
  const onPhase = useCallback((p: "seeking" | "caught") => setCaught(p === "caught"), []);

  return (
    <div className={s.field} ref={hostRef}>
      {/* Server-rendered, so the still exists in the HTML and needs no JS at
          all: a visitor with WebGL blocked, JS broken, or a hydration failure
          still gets the composed frame rather than flat navy. It unmounts only
          once the canvas is actually up. */}
      <Poster rich={mode !== "canvas"} />

      {mode === "canvas" ? (
        <CanvasBoundary onError={onError}>
          <CaptureCanvas
            onPhase={onPhase}
            reduced={env.reduced}
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

      {env.hud ? (
        <div className={s.hud}>
          <div>mode {mode}</div>
          {stats ? (
            <>
              <div>{stats.fps} fps (median)</div>
              <div>
                med {stats.medianFrameMs} ms · p95 {stats.p95FrameMs} ms
              </div>
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
