"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/catalyst-api";
import {
  buildInterview,
  isAnswered,
  progressFor,
  spineLabel,
  spineFor,
  type InterviewStep,
} from "@/lib/interview";
import type { OrbState } from "./SageOrb";
import SageReaction from "./SageReaction";
import { saveSession } from "./session";
import styles from "./catalyst.module.css";

/* ---------------------------------------------------------------------------
 * The deep interview. Same rhythm as the mini scan on purpose: one question a
 * screen, taps over typing, Sage replying between answers. It is the second
 * half of one conversation, not a form bolted to the end of a scan.
 *
 * Two things it does that the mini does not:
 *
 *  - Saves as it goes. The interview is long enough that people will abandon
 *    it, and a partial interview is still a warm lead with real answers in it.
 *  - Gates the report. Nothing releases the full report except the completion
 *    call at the end, and that call is server-side idempotent.
 * ------------------------------------------------------------------------- */

const SAVE_DEBOUNCE_MS = 900;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export default function InterviewFlow({
  sessionId,
  sector,
  initialIdx = 0,
  initialAnswers = {},
  onComplete,
  onOrb,
  onProgress,
}: {
  sessionId: string | null;
  sector: string | null;
  initialIdx?: number;
  initialAnswers?: Record<string, unknown>;
  onComplete: () => void;
  onOrb?: (state: OrbState) => void;
  onProgress?: (fraction: number) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const steps = useMemo(() => buildInterview(sector), [sector]);
  const [idx, setIdx] = useState(Math.min(Math.max(0, initialIdx), steps.length));
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [reaction, setReaction] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const saveTimer = useRef<number | null>(null);
  const step = steps[idx] as InterviewStep | undefined;

  useEffect(() => {
    onProgress?.(progressFor(steps, idx));
  }, [idx, steps, onProgress]);

  // Persist locally on every change so a closed tab never costs them progress.
  useEffect(() => {
    saveSession({ phase: "interview", interviewIdx: idx, interviewAnswers: answers });
  }, [idx, answers]);

  /* Debounced server save. Fire-and-forget: a failed save must never block
     someone mid-question, and the next save resends the same answers because
     the endpoint merges rather than replaces. */
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void api.saveInterview(sessionId, answersRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, [sessionId]);

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  // Declared before advance() so the last question can close the interview
  // directly rather than via an effect watching the index. Guarded by a ref so
  // a double-tap on the final Continue cannot fire two completions.
  const finishedRef = useRef(false);
  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    onOrb?.("thinking");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    // Save everything one last time, then close the gate. Order matters: the
    // completion call is what releases the report, so the answers have to be on
    // the row before it fires.
    await api.saveInterview(sessionId, answersRef.current);
    await api.completeInterview(sessionId);
    saveSession({ phase: "confirmed" });
    onComplete();
  }, [onComplete, onOrb, sessionId]);

  const advance = useCallback(() => {
    setReaction(null);
    const next = idx + 1;
    if (next >= steps.length) {
      void finish();
      return;
    }
    setIdx(next);
    onOrb?.("listening");
  }, [finish, idx, onOrb, steps.length]);

  const commit = useCallback(
    (id: string, value: unknown, reply: string | null) => {
      setAnswers((a) => ({ ...a, [id]: value }));
      scheduleSave();
      if (reply && !reduced) {
        setReaction(reply);
        onOrb?.("detection");
        return;
      }
      advance();
    },
    [advance, onOrb, reduced, scheduleSave],
  );

  if (finishing || idx >= steps.length || !step) {
    return (
      <div className={styles.shell}>
        <div className={styles.entry}>
          <h2 className="h2">Thank you. That is everything Sage needs.</h2>
          <p className="lead" style={{ maxWidth: "46ch" }}>
            Your full diagnostic is being built from your answers and the live checks Sage ran
            while you were talking. It lands in your inbox, with a walkthrough.
          </p>
        </div>
      </div>
    );
  }

  const answer = answers[step.id];
  const canContinue = isAnswered(step, answer);
  const numbersBlock = step.block === "numbers";

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.sageAsk} aria-hidden="true">
          <span className={styles.sageAskDot} />
          <span>Sage</span>
        </div>

        <div className={styles.kicker}>
          {step.kicker ?? spineLabel(spineFor(sector))} · {idx + 1} of {steps.length}
        </div>
        <h2 className={styles.question}>{step.question}</h2>
        {step.hint && <p className={styles.hint}>{step.hint}</p>}

        {reaction ? (
          <SageReaction text={reaction} reduced={reduced} onContinue={advance} />
        ) : (
          <>
            {step.kind === "single" && (
              <div className={styles.options}>
                {(step.options ?? []).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`${styles.option} ${answer === o.value ? styles.optionSel : ""}`}
                    onClick={() =>
                      commit(
                        step.id,
                        o.value,
                        // The numbers block gets no chatty reply: they are
                        // concentrating on figures and a quip between each one
                        // makes eight questions feel like sixteen.
                        numbersBlock ? null : replyFor(step, o.value),
                      )
                    }
                  >
                    <span className={styles.optionLabel}>{o.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step.kind === "multi" && (
              <>
                <div className={styles.options}>
                  {(step.options ?? []).map((o) => {
                    const picked = Array.isArray(answer) && (answer as string[]).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        className={`${styles.option} ${picked ? styles.optionSel : ""}`}
                        aria-pressed={picked}
                        onClick={() => {
                          const current = Array.isArray(answer) ? [...(answer as string[])] : [];
                          const at = current.indexOf(o.value);
                          if (at >= 0) current.splice(at, 1);
                          else current.push(o.value);
                          setAnswers((a) => ({ ...a, [step.id]: current }));
                          scheduleSave();
                        }}
                      >
                        <span className={styles.optionLabel}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  style={{ marginTop: 18 }}
                  disabled={!canContinue}
                  onClick={() => commit(step.id, answer ?? [], replyFor(step, ""))}
                >
                  Continue
                </button>
              </>
            )}

            {step.kind === "text" && (
              <>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  maxLength={1000}
                  value={typeof answer === "string" ? answer : ""}
                  onChange={(e) => {
                    setAnswers((a) => ({ ...a, [step.id]: e.target.value }));
                    scheduleSave();
                  }}
                  placeholder="Type your answer"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  style={{ marginTop: 14 }}
                  onClick={() => commit(step.id, answer ?? "", null)}
                >
                  {step.optional && !canContinue ? "Skip" : "Continue"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* Sage's line back. Deliberately sparse: the mini earns its personality with 13
 * questions, but a reply after every one of thirty is noise, so most steps get
 * nothing and the flow just moves. */
function replyFor(step: InterviewStep, value: string): string | null {
  if (step.id === "out_of_hours" && (value === "monday" || value === "lost")) {
    return "That gap is where most of the money goes. Noted.";
  }
  if (step.id === "where_it_is_recorded" && (value === "in_my_head" || value === "nowhere")) {
    return "Then the business is running on your memory. That is a risk, not a system.";
  }
  if (step.id === "retyping" && value === "constantly") {
    return "Retyping is the cheapest thing in the world to remove.";
  }
  if (step.id === "quote_followup_count" && (value === "none" || value === "once")) {
    return "Most quotes are won on the third touch. One is leaving money there.";
  }
  if (step.id === "no_shows" && value === "not_tracked") {
    return "If it is not tracked it cannot be fixed. We will start by counting it.";
  }
  return null;
}
