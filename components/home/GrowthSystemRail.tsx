"use client";

import { useSyncExternalStore } from "react";
import styles from "./GrowthSystemRail.module.css";

/**
 * "Your growth system, live" — a slow horizontal rail of cards, each a real
 * ScaleSage component showing an illustrative status. It is a SYSTEM PREVIEW,
 * never a live feed: every card carries an "Illustrative" label (hard rule).
 *
 * Motion: one continuously-drifting marquee track (paused on hover/focus) plus
 * a gentle status pulse. prefers-reduced-motion → a static, wrapping row with
 * no animation at all.
 */

type Card = {
  name: string;
  status: string;
  meta: string;
};

// Copy: JW to approve.
const CARDS: Card[] = [
  { name: "Catalyst", status: "Scan complete", meta: "Leak map generated" },
  { name: "Missed-call bot", status: "Active", meta: "Answering calls 24/7" },
  { name: "Quote follow-up", status: "Running", meta: "Day 1 · 3 · 7 sequence" },
  { name: "Review requests", status: "Queued", meta: "Sent after each job closes" },
  { name: "Frontier", status: "Scan complete", meta: "AI search visibility mapped" },
  { name: "Orbit", status: "Updated", meta: "Live dashboard refreshed" },
  { name: "Monthly report", status: "Generated", meta: "ROI proof compiled" },
];

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

function CardView({ c }: { c: Card }) {
  return (
    <div className={`${styles.card} glass`}>
      <div className={styles.cardHead}>
        <span className={styles.name}>{c.name}</span>
        <span className={styles.illus}>Illustrative</span>
      </div>
      <p className={styles.meta} style={{ marginTop: 0, marginBottom: 14 }}>
        {c.meta}
      </p>
      <div className={styles.statusRow}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.status}>{c.status}</span>
      </div>
    </div>
  );
}

export default function GrowthSystemRail() {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  return (
    <section className="section">
      <div className="inner" style={{ paddingBottom: 0 }}>
        <div className="section-head" data-reveal="" style={{ marginBottom: 32 }}>
          <div className="eyebrow">Your growth system, live</div>
          <h2 className="h2">The stack we build, running as one.</h2>
          <p className="lead">
            A preview of the systems we install and keep running. Each one closes a
            specific leak, and reports to a single dashboard.
          </p>
        </div>
      </div>

      <div className="inner" style={{ paddingTop: 0, paddingBottom: 96 }} data-reveal="">
        {reduced ? (
          <div className={styles.staticRow}>
            {CARDS.map((c) => (
              <CardView key={c.name} c={c} />
            ))}
          </div>
        ) : (
          <div className={styles.rail}>
            <div className={styles.track}>
              {[...CARDS, ...CARDS].map((c, i) => (
                <CardView key={`${c.name}-${i}`} c={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
