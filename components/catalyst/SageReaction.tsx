"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./catalyst.module.css";

/**
 * Sage's per-answer reply, delivered like a live chat: a brief typing indicator,
 * then the line types out character by character with a caret, then a read pause.
 * This is what makes the scan feel like a conversation rather than a form
 * (Jordan: "as interactive as possible / a real conversation").
 *
 * ---------------------------------------------------------------------------
 * AUTO-ADVANCE, AND THE BUG IT MUST NOT REPRODUCE
 *
 * An early version cleared itself on a timer that started when the reply
 * started, and the duration was a guess at reading speed. A long reply spent
 * most of its own budget typing, so Sage's line could vanish while someone was
 * still halfway through it. That is why the timer was ripped out entirely and
 * the reply sat until Continue was pressed.
 *
 * The timer is back, for accessibility (a slow reader must not have to hunt for
 * a button), but it is built so that failure mode cannot recur:
 *
 *  1. The reading window starts when the LAST character has landed, never when
 *     the line started. Typing time is not spent out of reading time. Pressing
 *     "Skip" to reveal the line instantly also starts the window from scratch.
 *  2. The window is the LONGER of ~10s and the line's own measured reading time
 *     (~60ms a character, roughly 200 words a minute, plus a tail). A long reply
 *     gets more time, never less.
 *  3. Any sign of a live human resets the window to full: pointer movement, a
 *     tap, a wheel, a key, a scroll, a focus change, or a text selection in
 *     progress.
 *  4. It does not run at all while the tab is hidden, while the window is not
 *     focused, or while the bubble is scrolled out of view. The deadline is
 *     pushed forward for as long as any of those hold, so a backgrounded tab
 *     burns nothing.
 *  5. prefers-reduced-motion disables it outright. Other accessibility signals
 *     (forced colours, more contrast, reduced transparency, a slow display)
 *     only ever multiply the window UP.
 *  6. It is visible before it happens: a quiet progress line under the reply
 *     fills across the window and snaps back to zero every time the window
 *     resets, so a pause is legible rather than mysterious.
 *  7. Continue always wins, at any moment.
 *
 * Under prefers-reduced-motion the full text shows at once with no animation
 * and no timer (and in practice ScanFlow and InterviewFlow skip the reply beat
 * entirely under reduced motion).
 */

export const SAGE_DOTS_MS = 420; // typing indicator before the line begins
export const SAGE_CHAR_MS = 18; // per-character type speed
export const SAGE_READ_PAUSE_MS = 1100; // dwell after the line finishes, before advancing

/** Floor for the post-typing reading window. The "~10 seconds" from the brief. */
export const AUTO_ADVANCE_FLOOR_MS = 10_000;
/** ~200 words a minute at ~5 characters a word. Deliberately unhurried. */
const READ_MS_PER_CHAR = 60;
/** Tail on top of the measured read, so the last word is never the last moment. */
const READ_TAIL_MS = 1_500;
/** How often the deadline is checked. Cheap: it writes to the DOM, not to state. */
const TICK_MS = 100;

/** How long ScanFlow should hold before settling the orb, for a given reply. */
export function sageReactDurationMs(text: string): number {
  return Math.min(SAGE_DOTS_MS + text.length * SAGE_CHAR_MS + SAGE_READ_PAUSE_MS, 4200);
}

/**
 * The reading window for a finished line: never below the floor, and longer for
 * a longer line. `extend` is the accessibility multiplier and is never < 1.
 */
export function readingWindowMs(text: string, extend = 1): number {
  const measured = text.length * READ_MS_PER_CHAR + READ_TAIL_MS;
  return Math.max(AUTO_ADVANCE_FLOOR_MS, measured) * Math.max(1, extend);
}

type Phase = "dots" | "typing" | "done";

function mediaMatches(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/**
 * Accessibility signals that mean "give me more time". Read once, when the
 * window is armed. Every one of these can only stretch the window.
 */
function accessibilityExtension(): number {
  let extend = 1;
  // Windows high-contrast / forced colours is a strong assistive-tech signal.
  if (mediaMatches("(forced-colors: active)")) extend = Math.max(extend, 3);
  if (mediaMatches("(prefers-contrast: more)")) extend = Math.max(extend, 1.6);
  if (mediaMatches("(prefers-reduced-transparency: reduce)")) extend = Math.max(extend, 1.6);
  // A slow-updating display (e-ink and friends) is slower to read from.
  if (mediaMatches("(update: slow)")) extend = Math.max(extend, 2);
  return extend;
}

/**
 * A media query read at RENDER time, subscribed rather than polled, and safe on
 * the server (false). It has to be render-time: the progress line and the "this
 * moves on by itself" note must never appear when the timer is not going to run.
 */
function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  const get = useCallback(() => mediaMatches(query), [query]);
  return useSyncExternalStore(subscribe, get, () => false);
}

export default function SageReaction({
  text,
  reduced,
  onContinue,
  autoAdvance = true,
}: {
  text: string;
  reduced: boolean;
  onContinue: () => void;
  /** Off switch for the reading timer. Continue is unaffected. */
  autoAdvance?: boolean;
}) {
  const motionReduced = useMedia("(prefers-reduced-motion: reduce)");
  const [shown, setShown] = useState(reduced ? text : "");
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "dots");
  const timers = useRef<number[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Held in a ref so a new callback identity from the parent (late evidence
  // landing mid-scan, say) never restarts the reading window.
  const continueRef = useRef(onContinue);
  useEffect(() => {
    continueRef.current = onContinue;
  }, [onContinue]);

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

  /* ---- the reading window ------------------------------------------------
   * Armed only once phase === "done", i.e. once the whole line is on screen.
   * Everything below writes to a ref or to the DOM; nothing sets React state,
   * so a 100ms tick costs no renders. */
  /* Reduced motion disables the timer whatever the caller passed: the prop is
     how ScanFlow and InterviewFlow say it, and the query is the belt to that
     braces. Read at render, so the bar and the note are never shown promising
     something that will not happen. */
  const armed = phase === "done" && autoAdvance && !reduced && !motionReduced;

  useEffect(() => {
    if (!armed) return;
    if (typeof window === "undefined") return;

    const windowMs = readingWindowMs(text, accessibilityExtension());
    let deadline = performance.now() + windowMs;
    let done = false;

    /** Push the whole window out again. Used by every interaction signal. */
    const reset = () => {
      deadline = performance.now() + windowMs;
    };

    // The bubble has to be on screen for its own timer to count. Someone who
    // has scrolled the reply out of view is not reading it.
    let onScreen = true;
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "function" && bubbleRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) onScreen = e.isIntersecting;
        },
        { threshold: 0.35 },
      );
      observer.observe(bubbleRef.current);
    }

    /** Any reason the clock should not be running right now. */
    const busy = (): boolean => {
      if (typeof document !== "undefined") {
        if (document.hidden) return true;
        if (typeof document.hasFocus === "function" && !document.hasFocus()) return true;
      }
      if (!onScreen) return true;
      try {
        const sel = window.getSelection?.();
        // Mid-selection means they are working with the text, not leaving it.
        if (sel && sel.toString().trim() !== "") return true;
      } catch {
        /* selection unavailable — not a reason to rush anyone */
      }
      return false;
    };

    const WINDOW_EVENTS = ["pointermove", "pointerdown", "wheel", "touchstart", "keydown", "scroll", "focusin"] as const;
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    WINDOW_EVENTS.forEach((name) => window.addEventListener(name, reset, opts));
    document.addEventListener("selectionchange", reset, opts);
    document.addEventListener("visibilitychange", reset, opts);

    const tick = () => {
      if (done) return;
      const now = performance.now();
      if (busy()) deadline = now + windowMs;
      const remaining = deadline - now;
      const progress = Math.max(0, Math.min(1, 1 - remaining / windowMs));
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      if (remaining <= 0) {
        done = true;
        continueRef.current();
      }
    };
    const id = window.setInterval(tick, TICK_MS);

    return () => {
      done = true;
      window.clearInterval(id);
      WINDOW_EVENTS.forEach((name) => window.removeEventListener(name, reset, opts));
      document.removeEventListener("selectionchange", reset, opts);
      document.removeEventListener("visibilitychange", reset, opts);
      observer?.disconnect();
    };
  }, [armed, text]);

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
    <div ref={bubbleRef} className={styles.reactionBubble} aria-live="polite">
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
      {armed && (
        <>
          {/* Quiet, not loud: a hairline that fills across the reading window and
              drops back to nothing whenever the window resets. */}
          <span className={styles.autoTrack} aria-hidden="true">
            <span ref={barRef} className={styles.autoFill} />
          </span>
          {/* Inside the polite live region and added after the line, so it is
              announced once, on its own, rather than re-reading the reply. */}
          <span className={styles.autoNote}>
            This moves on by itself in a moment. It waits while you are reading, scrolling or away
            from the tab. Continue takes you there now.
          </span>
        </>
      )}
    </div>
  );
}
