"use client";

import type { CSSProperties } from "react";
import styles from "./catalyst.module.css";

/**
 * Sage orb — premium, faceless, silent presence for the /catalyst scan.
 * Five states (brief §2.4):
 *   idle       — soft breathing glow (the only loop)
 *   listening  — awaiting / receiving input, gentle brighten
 *   thinking   — scan-ring, shown for the ~500ms beat between questions
 *   detection  — single pulse when a leak upgrades / an answer lands
 *   handover   — steady bright, at result
 *
 * A progress ring (0..1) traces the orb during the scan. It is a static
 * stroke value (no loop); the only auto-loop is the breathing halo. No face,
 * no mascot, no sound. Under prefers-reduced-motion the orb is a static glow
 * (handled in catalyst.module.css) and the ring simply snaps without easing.
 */
export type OrbState = "idle" | "listening" | "thinking" | "detection" | "handover";

// Geometry of the progress ring SVG (viewBox is 100x100, r below).
const R = 47;
const C = 2 * Math.PI * R;

export default function SageOrb({
  state = "idle",
  size = 120,
  label,
  progress,
}: {
  state?: OrbState;
  size?: number;
  /** 0..1 — when provided, traces a progress ring around the orb. */
  progress?: number;
  label?: string;
}) {
  const hasProgress = typeof progress === "number" && progress >= 0;
  const pct = hasProgress ? Math.max(0, Math.min(1, progress!)) : 0;
  const offset = C * (1 - pct);

  return (
    <div className={styles.orbWrap}>
      <div
        className={styles.orb}
        data-state={state}
        style={{ "--orb": `${size}px` } as CSSProperties}
        role="img"
        aria-label={label ?? `Sage: ${state}`}
      >
        <span className={styles.orbHalo} aria-hidden="true" />
        <span className={styles.orbRing} aria-hidden="true" />
        <span className={styles.orbCore} aria-hidden="true" />
        {hasProgress && (
          <svg className={styles.orbProgress} viewBox="0 0 100 100" aria-hidden="true">
            <circle className={styles.orbProgressTrack} cx="50" cy="50" r={R} />
            <circle
              className={styles.orbProgressFill}
              cx="50"
              cy="50"
              r={R}
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
