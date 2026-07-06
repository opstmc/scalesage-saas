"use client";

import type { CSSProperties } from "react";
import styles from "./catalyst.module.css";

/**
 * Sage orb — premium, faceless, silent presence for the /catalyst scan.
 * Five states (brief §2.4):
 *   idle       — soft breathing glow (the only loop)
 *   listening  — awaiting / receiving input, gentle brighten
 *   thinking   — scan-ring, shown for the 700-900ms beat between questions
 *   detection  — single pulse when a leak upgrades / an answer lands
 *   handover   — steady bright, at result
 *
 * No face, no mascot, no sound. Under prefers-reduced-motion the orb is a
 * static glow (handled entirely in catalyst.module.css).
 */
export type OrbState = "idle" | "listening" | "thinking" | "detection" | "handover";

export default function SageOrb({
  state = "idle",
  size = 120,
  label,
}: {
  state?: OrbState;
  size?: number;
  label?: string;
}) {
  return (
    <div className={styles.orbWrap}>
      <div
        className={styles.orb}
        data-state={state}
        style={{ "--orb": `${size}px` } as CSSProperties}
        role="img"
        aria-label={label ?? `Sage — ${state}`}
      >
        <span className={styles.orbHalo} aria-hidden="true" />
        <span className={styles.orbRing} aria-hidden="true" />
        <span className={styles.orbCore} aria-hidden="true" />
      </div>
    </div>
  );
}
