"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./catalyst.module.css";

/**
 * Sage's per-answer reply, delivered like a live chat: a brief typing indicator,
 * then the line types out character by character with a caret, then a read pause.
 * This is what makes the scan feel like a conversation rather than a form
 * (Jordan: "as interactive as possible / a real conversation").
 *
 * Timing is exported so ScanFlow can hold its auto-advance for exactly as long as
 * the reply takes to type + be read (sageReactDurationMs). Clicking the button
 * reveals the full line instantly while typing, and continues once done. Under
 * prefers-reduced-motion the full text shows at once with no animation (and in
 * practice ScanFlow skips the reply beat entirely under reduced motion).
 */

export const SAGE_DOTS_MS = 420; // typing indicator before the line begins
export const SAGE_CHAR_MS = 18; // per-character type speed
export const SAGE_READ_PAUSE_MS = 1100; // dwell after the line finishes, before advancing

/** How long ScanFlow should hold before auto-advancing, for a given reply. */
export function sageReactDurationMs(text: string): number {
  return Math.min(SAGE_DOTS_MS + text.length * SAGE_CHAR_MS + SAGE_READ_PAUSE_MS, 4200);
}

type Phase = "dots" | "typing" | "done";

export default function SageReaction({
  text,
  reduced,
  onContinue,
}: {
  text: string;
  reduced: boolean;
  onContinue: () => void;
}) {
  const [shown, setShown] = useState(reduced ? text : "");
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "dots");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    if (reduced) {
      setShown(text);
      setPhase("done");
      return clear;
    }
    setShown("");
    setPhase("dots");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("typing");
        let i = 0;
        const type = () => {
          i += 1;
          setShown(text.slice(0, i));
          if (i < text.length) {
            timers.current.push(window.setTimeout(type, SAGE_CHAR_MS));
          } else {
            setPhase("done");
          }
        };
        type();
      }, SAGE_DOTS_MS),
    );
    return clear;
  }, [text, reduced]);

  const onButton = () => {
    if (phase !== "done") {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setShown(text);
      setPhase("done");
    } else {
      onContinue();
    }
  };

  return (
    <div className={styles.reactionBubble} aria-live="polite">
      <span className={styles.sageNoteLabel}>Sage</span>
      {phase === "dots" ? (
        <span className={styles.typingDots} aria-label="Sage is typing">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <span className={styles.reactionText}>
          {shown}
          {phase === "typing" && <span className={styles.typeCaret} aria-hidden="true" />}
        </span>
      )}
      <button type="button" className={styles.reactionNext} onClick={onButton}>
        {phase === "done" ? "Continue →" : "Skip →"}
      </button>
    </div>
  );
}
