"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Hero "live signal" monitor — a single glass panel that auto-cycles through the
 * three proof-signals (Capture / Convert / Be found) every CYCLE_MS, reading like
 * a live ops dashboard: a thin teal progress tick fills across the cycle, the
 * active signal fades in (reusing the ssFade keyframe), and small dot indicators
 * mark position (and let you jump between signals).
 *
 * Motion principle: exactly ONE continuously-moving element (the progress tick).
 * prefers-reduced-motion → no auto-rotation; all three signals shown, still.
 */

type Signal = {
  tag: string;
  headline: React.ReactNode;
  meta: string;
};

const SIGNALS: Signal[] = [
  {
    tag: "Capture",
    headline: (
      <>
        Missed call → <span className="accent">booked in 00:12</span>
      </>
    ),
    meta: "Voice AI · 24/7 coverage",
  },
  {
    tag: "Convert",
    headline: (
      <>
        Quote follow-up · <span className="accent">Day 1 · 3 · 7</span>
      </>
    ),
    meta: "Sequenced until it converts",
  },
  {
    tag: "Be found",
    headline: (
      <>
        You&rsquo;re the <span className="accent">answer</span> on AI search
      </>
    ),
    meta: "ChatGPT · Perplexity · Google",
  },
];

const CYCLE_MS = 3500;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

// Subscribe to the reduced-motion preference via useSyncExternalStore — the
// lint-clean way to read an external store, with no setState-in-effect and a
// stable SSR snapshot (false) that matches the animated first paint.
function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_QUERY).matches
    : false;
}

function getReducedMotionServer(): boolean {
  return false;
}

const panelStyle: React.CSSProperties = {
  width: "min(420px, 100%)",
  padding: "clamp(18px, 2.4vw, 26px)",
  display: "flex",
  flexDirection: "column",
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 11,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  fontWeight: 600,
  color: "var(--accent-primary)",
  background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 999,
  padding: "5px 11px",
};

const headlineStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "clamp(19px, 2.2vw, 23px)",
  lineHeight: 1.28,
  color: "var(--text-headline)",
};

export default function HeroSignals() {
  const [active, setActive] = useState(0);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );
  const activeRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) return;

    // The cycle clock is derived from the rAF timestamp (no performance.now()):
    // a null start means "re-base to the next frame", used on mount and on jump.
    startRef.current = null;
    const loop = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      let frac = (now - startRef.current) / CYCLE_MS;
      if (frac >= 1) {
        activeRef.current = (activeRef.current + 1) % SIGNALS.length;
        setActive(activeRef.current);
        startRef.current = now;
        frac = 0;
      }
      if (fillRef.current) {
        fillRef.current.style.width = `${Math.min(frac, 1) * 100}%`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduced]);

  const goTo = (i: number) => {
    activeRef.current = i;
    setActive(i);
    // Re-base the clock on the next rAF frame instead of reading performance.now().
    startRef.current = null;
    if (fillRef.current) fillRef.current.style.width = "0%";
  };

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--accent-primary)",
            boxShadow: "0 0 10px var(--accent-primary)",
            flex: "none",
          }}
        />
        <span className="eyebrow" style={{ margin: 0, fontSize: 11 }}>
          Live signal
        </span>
        <span style={{ fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-faint)", border: "1px solid var(--border-hair)", borderRadius: 6, padding: "2px 6px" }}>
          Illustrative
        </span>
      </div>
      {!reduced && (
        <span
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            color: "var(--text-faint)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(active + 1).padStart(2, "0")} / {String(SIGNALS.length).padStart(2, "0")}
        </span>
      )}
    </div>
  );

  // Reduced motion: no rotation — show all three signals, calm and complete.
  if (reduced) {
    return (
      <div className="glass" style={panelStyle}>
        {header}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SIGNALS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "14px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border-hair)",
              }}
            >
              <div style={{ ...tagStyle, marginBottom: 9 }}>{s.tag}</div>
              <div style={headlineStyle}>{s.headline}</div>
              <div className="small" style={{ marginTop: 7, color: "var(--text-faint)" }}>
                {s.meta}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = SIGNALS[active];
  return (
    <div className="glass" style={panelStyle}>
      {header}

      {/* the single continuously-moving element: the progress tick */}
      <div
        style={{
          height: 2,
          borderRadius: 2,
          background: "var(--border-hair)",
          overflow: "hidden",
          marginBottom: 22,
        }}
      >
        <div
          ref={fillRef}
          style={{
            height: "100%",
            width: "0%",
            borderRadius: 2,
            background: "linear-gradient(90deg, var(--accent-deep), var(--accent-primary))",
            boxShadow: "0 0 10px var(--accent-primary)",
          }}
        />
      </div>

      {/* active signal, re-keyed so the ssFade keyframe replays on each switch */}
      <div
        key={active}
        style={{
          minHeight: 100,
          animation: "ssFade .5s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <div style={{ ...tagStyle, marginBottom: 12 }}>{s.tag}</div>
        <div style={headlineStyle}>{s.headline}</div>
        <div className="small" style={{ marginTop: 10, color: "var(--text-faint)" }}>
          {s.meta}
        </div>
      </div>

      {/* position indicators, active is a teal pill; tap to jump */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {SIGNALS.map((sig, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show signal: ${sig.tag}`}
            onClick={() => goTo(i)}
            style={{
              flex: "none",
              height: 6,
              width: i === active ? 26 : 6,
              padding: 0,
              border: "none",
              cursor: "pointer",
              borderRadius: 999,
              background: i === active ? "var(--accent-primary)" : "var(--text-faint)",
              opacity: i === active ? 1 : 0.4,
              boxShadow: i === active ? "0 0 10px var(--accent-primary)" : "none",
              transition:
                "width .4s cubic-bezier(.2,.7,.2,1), opacity .3s ease, background .3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
