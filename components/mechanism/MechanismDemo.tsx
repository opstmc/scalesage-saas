"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./MechanismDemo.module.css";

/**
 * Animated mechanism-demo (Cy motion brief): a small, moving mini-demo of what a
 * service actually *does* — not decoration. Three variants:
 *   - pipeline: a lead advancing capture → reply → booked
 *   - handoff:  two agents passing a task between them
 *   - terminal: a build running, checks ticking green
 *
 * Implementation is deliberately lightweight and library-free: one
 * IntersectionObserver starts it when it scrolls into view, CSS keyframes drive
 * the motion, and a single requestAnimationFrame loop counts the terminal's
 * checks up. Under prefers-reduced-motion it renders the finished state with no
 * animation. Copy is process-descriptive only (no performance claims).
 */

type Variant = "pipeline" | "handoff" | "terminal";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReduced(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_QUERY).matches
    : false;
}

const PIPELINE_STEPS = ["Lead captured", "Reply drafted", "Call booked"];
const HANDOFF_STEPS = ["Enricher", "Writer", "Scheduler"];
const TERMINAL_STEPS = [
  "resolve dependencies",
  "provision service",
  "wire integrations",
  "run checks",
];

export default function MechanismDemo({ variant }: { variant: Variant }) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [running, setRunning] = useState(false);
  const [passed, setPassed] = useState(0);

  // Start when the demo scrolls into view (or immediately under reduced motion,
  // so the finished state is visible without any movement).
  useEffect(() => {
    if (reduced) {
      setRunning(true);
      setPassed(TERMINAL_STEPS.length);
      return;
    }
    const el = rootRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setRunning(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRunning(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // rAF count-up for the terminal's "checks passed" tally (brief: rAF counters).
  useEffect(() => {
    if (variant !== "terminal" || !running || reduced) return;
    const total = TERMINAL_STEPS.length;
    const durationMs = 900 * total; // roughly in step with the CSS check cadence
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setPassed(Math.round(p * total));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [variant, running, reduced]);

  const stateClass = running ? styles.running : "";

  return (
    <div ref={rootRef} className={`${styles.stage} ${stateClass}`} aria-hidden="true">
      {variant === "pipeline" && (
        <div className={styles.pipeline}>
          {PIPELINE_STEPS.map((label, i) => (
            <div key={label} className={styles.node} style={{ ["--i" as string]: i }}>
              <span className={styles.nodeDot} />
              <span className={styles.nodeLabel}>{label}</span>
              {i < PIPELINE_STEPS.length - 1 && (
                <span className={styles.wire}>
                  <span className={styles.pulse} style={{ ["--i" as string]: i }} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {variant === "handoff" && (
        <div className={styles.handoff}>
          {HANDOFF_STEPS.map((label, i) => (
            <div key={label} className={styles.agent} style={{ ["--i" as string]: i }}>
              <span className={styles.agentBox}>{label}</span>
            </div>
          ))}
          <span className={styles.token} />
        </div>
      )}

      {variant === "terminal" && (
        <div className={styles.terminal}>
          <div className={styles.termBar}>
            <span className={styles.termDot} />
            <span className={styles.termDot} />
            <span className={styles.termDot} />
            <span className={styles.termTally}>
              {passed}/{TERMINAL_STEPS.length} checks passed
            </span>
          </div>
          <ul className={styles.termBody}>
            {TERMINAL_STEPS.map((label, i) => (
              <li key={label} className={styles.termLine} style={{ ["--i" as string]: i }}>
                <span className={styles.termCheck}>✓</span>
                <span className={styles.termText}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
