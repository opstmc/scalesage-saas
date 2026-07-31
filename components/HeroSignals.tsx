"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Hero "live activity" feed — a glass panel that reads like a real-time ops log:
 * illustrative events stream in at the top with ticking timestamps and a live
 * clock, older rows age and dim down the stack. This replaced the earlier
 * slow-rotating signal carousel (Jordan: wanted it to feel more live / real-time).
 *
 * Motion: a new row arrives every FEED_MS (fades in via the shared ssFade
 * keyframe), timestamps re-render each second so rows visibly age, and the header
 * clock ticks. prefers-reduced-motion → a static, complete list with fixed
 * timestamps and no streaming. Every event stays labelled Illustrative (hard rule).
 */

type FeedEvent = { text: React.ReactNode; ok?: boolean };

const EVENTS: FeedEvent[] = [
  {
    text: (
      <>
        Missed call → <span className="accent">booked</span>
      </>
    ),
    ok: true,
  },
  {
    text: (
      <>
        Quote follow-up sent · <span className="accent">Day 3</span>
      </>
    ),
  },
  { text: <>Review request sent</>, ok: true },
  { text: <>New lead captured</> },
  {
    text: (
      <>
        Surfaced on <span className="accent">AI search</span>
      </>
    ),
  },
  { text: <>Voice AI answered · 24/7</>, ok: true },
  { text: <>Reactivation reply received</> },
  { text: <>Booking confirmed</>, ok: true },
];

const ROWS = 5;
const FEED_MS = 2300;
// Seed ages (seconds) so the feed starts populated and staggered, not empty.
const SEED_AGES = [3, 12, 27, 44, 61];

type Row = { key: number; ev: FeedEvent; age: number };

function ago(sec: number): string {
  if (sec <= 0) return "now";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m`;
}

function clock(d: Date): string {
  return d.toTimeString().slice(0, 8); // HH:MM:SS
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

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

function seedRows(): Row[] {
  return Array.from({ length: ROWS }, (_, i) => ({
    key: i,
    ev: EVENTS[i % EVENTS.length],
    age: SEED_AGES[i] ?? (i + 1) * 15,
  }));
}

export default function HeroSignals() {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );
  const [rows, setRows] = useState<Row[]>(seedRows);
  const [now, setNow] = useState<Date>(() => new Date());
  const nextEvent = useRef(ROWS); // next event to pull from the pool
  const nextKey = useRef(ROWS); // monotonic keys so new rows mount fresh

  useEffect(() => {
    if (reduced) return;

    // Age every visible row each second (timestamps tick) + advance the clock.
    const ageTimer = window.setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, age: r.age + 1 })));
      setNow(new Date());
    }, 1000);

    // A new event arrives at the top; the oldest drops off the bottom.
    const feedTimer = window.setInterval(() => {
      setRows((prev) => {
        const ev = EVENTS[nextEvent.current % EVENTS.length];
        nextEvent.current += 1;
        const row: Row = { key: nextKey.current, ev, age: 0 };
        nextKey.current += 1;
        return [row, ...prev].slice(0, ROWS);
      });
    }, FEED_MS);

    return () => {
      window.clearInterval(ageTimer);
      window.clearInterval(feedTimer);
    };
  }, [reduced]);

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
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
            animation: reduced ? undefined : "ssPulse 1.8s ease-in-out infinite",
          }}
        />
        <span className="eyebrow" style={{ margin: 0, fontSize: 11 }}>
          Live activity
        </span>
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            border: "1px solid var(--border-hair)",
            borderRadius: 6,
            padding: "2px 6px",
          }}
        >
          Illustrative
        </span>
      </div>
      <span
        style={{
          fontSize: 12,
          letterSpacing: ".08em",
          color: "var(--text-faint)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {clock(now)}
      </span>
    </div>
  );

  return (
    <div className="glass" style={panelStyle}>
      {header}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((r, i) => (
          <div
            key={r.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--border-hair)",
              opacity: reduced ? 1 : Math.max(0.4, 1 - i * 0.15),
              animation: reduced ? undefined : "ssFade .5s cubic-bezier(.2,.7,.2,1)",
            }}
          >
            <span
              style={{
                flex: "none",
                width: 40,
                fontSize: 12,
                textAlign: "right",
                color: "var(--text-faint)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {reduced ? `${SEED_AGES[i] ?? (i + 1) * 15}s` : ago(r.age)}
            </span>
            <span
              style={{
                flex: "none",
                width: 16,
                height: 16,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: r.ev.ok ? "var(--on-accent)" : "var(--text-faint)",
                background: r.ev.ok
                  ? "var(--accent-primary)"
                  : "color-mix(in srgb, var(--text-faint) 20%, transparent)",
                boxShadow: r.ev.ok
                  ? "0 0 8px color-mix(in srgb, var(--accent-primary) 60%, transparent)"
                  : "none",
              }}
              aria-hidden="true"
            >
              {r.ev.ok ? "✓" : "•"}
            </span>
            <span
              style={{
                fontSize: "clamp(14px, 1.6vw, 15.5px)",
                color: "var(--text-primary)",
                lineHeight: 1.35,
              }}
            >
              {r.ev.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
