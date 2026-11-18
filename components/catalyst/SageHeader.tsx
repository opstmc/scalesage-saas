"use client";

import { useId, useState, type ReactNode } from "react";
import SageOrb, { type OrbState } from "./SageOrb";
import styles from "./catalyst.module.css";

/* The sticky header of the conversation: Sage's orb (its ring shows how far the
 * scan has got), a live line saying what Sage is doing, and a panel that opens
 * downwards with the steps the research has reported, the findings so far and,
 * on phones, the live leak map. Every step it lists is one the research
 * reported; nothing is shown as running unless it is. */

export interface ResearchStep {
  label: string;
  done: boolean;
}

export default function SageHeader({
  orb,
  progress,
  line,
  live,
  steps,
  findings,
  note,
  map,
  onReset,
}: {
  orb: OrbState;
  progress: number;
  line: string;
  live: boolean;
  steps: ResearchStep[];
  findings: number | null;
  note: string | null;
  map: ReactNode;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={styles.sageHeader} data-sage-header>
      <div className={styles.sageHeaderBar}>
        <button
          type="button"
          className={styles.sageHeaderToggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <SageOrb state={orb} size={40} progress={progress} label="Sage" />
          <span className={styles.sageHeaderText}>
            <span className={styles.sageHeaderName}>Sage</span>
            <span className={styles.sageHeaderLine}>
              {live && <span className={styles.liveDot} aria-hidden="true" />}
              {line}
            </span>
          </span>
          <span className={`${styles.sageHeaderCaret} ${open ? styles.sageHeaderCaretOpen : ""}`} aria-hidden="true" />
          <span className={styles.visuallyHidden}>{open ? "Hide" : "Show"} what Sage is doing</span>
        </button>
        <button type="button" className={styles.back} onClick={onReset} aria-label="Start the scan over">
          Start over
        </button>
      </div>

      {open && (
        <div id={panelId} className={styles.sageHeaderPanel}>
          <p className={styles.sageHeaderPanelTitle}>What Sage is doing</p>
          {steps.length > 0 ? (
            <ul className={styles.sageSteps}>
              {steps.map((step) => (
                <li key={step.label} className={step.done ? styles.sageStepDone : styles.sageStepLive}>
                  <span aria-hidden="true">{step.done ? "✓" : "•"}</span>
                  {step.label}
                  {!step.done && <span className={styles.visuallyHidden}> (now)</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.sageHeaderNote}>{note ?? "Sage starts reading about you once you confirm your business."}</p>
          )}
          {steps.length > 0 && note && <p className={styles.sageHeaderNote}>{note}</p>}
          {findings !== null && (
            <p className={styles.sageHeaderNote}>
              {findings === 1 ? "1 finding so far." : `${findings} findings so far.`}
            </p>
          )}
          {map && <div className={styles.sageHeaderMap}>{map}</div>}
        </div>
      )}
    </div>
  );
}
