"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DiagnoseBuildProveJourney.module.css";

/**
 * The Diagnose -> Build -> Prove -> Improve scroll journey (brief §2 / item 4).
 * A "use client" component with its own IntersectionObserver: when the panel
 * scrolls into view it toggles a single `active` state, and CSS drives the
 * chaos-resolves-into-flow choreography with staggered delays (not a video).
 *
 * prefers-reduced-motion → activate immediately; the module strips transitions
 * so the final, calm state simply renders with no movement.
 */

// Copy: JW to approve.
const BEFORE = [
  { label: "Missed calls", tx: "-18px", ty: "-6px", rot: "-2.4deg" },
  { label: "Cold quotes, no follow-up", tx: "22px", ty: "5px", rot: "2deg" },
  { label: "No reviews asked for", tx: "-24px", ty: "2px", rot: "-1.4deg" },
  { label: "Invisible in AI search", tx: "16px", ty: "-5px", rot: "2.6deg" },
  { label: "Leads slipping through", tx: "-14px", ty: "6px", rot: "-2deg" },
  { label: "Owner buried in the work", tx: "20px", ty: "-3px", rot: "1.6deg" },
];

const BEATS = [
  { n: "01", title: "Diagnose", line: "We find every leak and put a number on it." },
  { n: "02", title: "Build", line: "We install the systems that close each leak." },
  { n: "03", title: "Prove", line: "Every system is measured against its baseline." },
  { n: "04", title: "Improve", line: "We run it, monitor it, and upgrade as AI moves." },
];

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export default function DiagnoseBuildProveJourney() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  // `armed` hides the pieces (only once JS runs, so no-JS keeps the final
  // state); `active` resolves them when the panel scrolls into view.
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia(REDUCED_QUERY).matches;
    // Reduced motion or no observer support: leave the calm state as-is.
    if (reduced || !("IntersectionObserver" in window)) {
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    // Arm on mount. The panel sits well below the fold, so hiding it here is
    // never seen; it is revealed by the observer as the user scrolls to it.
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">The shift</div>
          <h2 className="h2">Chaos, reorganised into a system that runs.</h2>
          <p className="lead">
            The old model leaves it all on you. Watch it resolve into the four-beat
            loop we install, then keep running.
          </p>
        </div>

        <div
          ref={rootRef}
          className={`${styles.grid} ${armed ? styles.armed : ""} ${active ? styles.active : ""}`}
        >
          {/* Before: the chaos column */}
          <div>
            <p className={`${styles.colLabel} ${styles.beforeLabel}`}>
              The old model
            </p>
            <div className={styles.beforeCol}>
              {BEFORE.map((b, i) => (
                <div
                  key={b.label}
                  className={styles.chip}
                  style={
                    {
                      "--tx": b.tx,
                      "--ty": b.ty,
                      "--rot": b.rot,
                      "--i": i,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.chipDot} aria-hidden="true" />
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className={styles.arrow} aria-hidden="true">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
              <path
                d="M2 12h33M27 4l8 8-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* After: the calm four-beat loop */}
          <div>
            <p className={`${styles.colLabel} ${styles.afterLabel}`}>
              The ScaleSage loop
            </p>
            <div className={styles.afterCol}>
              {BEATS.map((beat, i) => (
                <div
                  key={beat.n}
                  className={`${styles.beat} glass`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className={styles.beatNum}>{beat.n}</span>
                  <div>
                    <p className={styles.beatTitle}>{beat.title}</p>
                    <p className={styles.beatLine}>{beat.line}</p>
                  </div>
                </div>
              ))}
              <div className={styles.loopNote}>
                <span className={styles.loopDot} aria-hidden="true" />
                Improve feeds back into Diagnose. The loop does not end.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
