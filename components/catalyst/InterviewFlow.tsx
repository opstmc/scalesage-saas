"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { type ChecksResult, type LookupMatch } from "@/lib/catalyst-api";
import {
  ambientEvidence,
  buildInterview,
  buildPages,
  figuresFrom,
  pageComplete,
  type InterviewEvidence,
  type InterviewPage,
  type InterviewStep,
} from "@/lib/interview";
import type { OrbState } from "./SageOrb";
import SageReaction from "./SageReaction";
import { saveSession } from "./session";
import styles from "./catalyst.module.css";

/* ---------------------------------------------------------------------------
 * The deep interview, a page of related questions at a time.
 *
 * It used to be one question a screen, which is right for the 13-question mini
 * where every answer earns a reply from Sage. Twenty screens is a different
 * thing: it reads as long before it reads as thorough, and each screen is
 * another chance to close the tab. Questions are now grouped by topic, so the
 * whole interview is five pages rather than twenty screens.
 *
 * Two things it does that the mini does not:
 *
 *  - Saves as it goes. The interview is long enough that people will abandon
 *    it, and a partial interview is still a warm lead with real answers in it.
 *  - Gates the report. Nothing releases the full report except the completion
 *    call at the end, and that call is server-side idempotent.
 *
 * It also asks about what the live checks found while they were on the mini
 * (phase 2). That evidence is optional in every direction: passed in as props
 * if the parent has it, otherwise read back out of the session the mini wrote,
 * otherwise absent. When it is absent the interview is exactly the one that
 * shipped in phase 1 rather than a form with holes in it, because the questions
 * that depend on a finding are not rendered at all unless the finding exists.
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
  checks,
  lookup,
  initialIdx = 0,
  initialAnswers = {},
  onComplete,
  onOrb,
  onProgress,
}: {
  sessionId: string | null;
  sector: string | null;
  /** What the mini's live checks found. Omit it and the interview falls back to
   *  the session the mini wrote; omit that too and it simply asks less. */
  checks?: ChecksResult | null;
  /** The Q1 lookup match, which carries public Google review data of its own. */
  lookup?: LookupMatch | null;
  /** Resume point, in PAGES. */
  initialIdx?: number;
  initialAnswers?: Record<string, unknown>;
  onComplete: () => void;
  onOrb?: (state: OrbState) => void;
  onProgress?: (fraction: number) => void;
}) {
  const reduced = usePrefersReducedMotion();

  /* The mini already ran the checks and wrote them to the session, so the
     interview can read them back without the parent having to hand them over.
     Read once, in a lazy initialiser: this is the fallback, and re-reading the
     session on every render would just be the same answer again.

     The props are NOT read once. The mini's checks can defer and land late —
     the browser goes back for them, and the parent hands the better answer down
     here while the interview is already running. `idx` below is what keeps that
     from disturbing anyone: it tracks the page they are on by identity, so a
     question set that grows underneath them never moves them. */
  const [storedEvidence] = useState<InterviewEvidence>(ambientEvidence);
  const evidence = useMemo<InterviewEvidence>(
    () => ({
      checks: checks !== undefined ? checks : (storedEvidence.checks ?? null),
      lookup: lookup !== undefined ? lookup : (storedEvidence.lookup ?? null),
    }),
    [checks, lookup, storedEvidence],
  );

  const steps = useMemo(() => buildInterview(sector, evidence), [sector, evidence]);
  const pages = useMemo(() => buildPages(steps), [steps]);

  /* Where they are, held as a page number AND the id of the first question on
   * it. The number alone is not enough, because the question set can change
   * underneath them — see `idx` below. */
  const [position, setPosition] = useState<{ idx: number; anchor: string | null }>(() => {
    const start = Math.min(Math.max(0, initialIdx), Math.max(0, pages.length - 1));
    return { idx: start, anchor: pages[start]?.steps[0]?.id ?? null };
  });
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [reaction, setReaction] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const saveTimer = useRef<number | null>(null);

  /* The page they are actually on — resolved by identity, not by number.
   *
   * The question set can change underneath them. Late evidence adds the "What
   * Sage found" block in the middle of the interview, which renumbers every
   * page after it: someone on page 3 of 5 giving us their numbers would find
   * themselves on page 3 of 6, looking at a different topic, mid-answer. So we
   * re-find the question they were actually looking at and stay on it.
   *
   * It also covers the resume case the old clamp handled alone: a session saved
   * when the interview had a different shape has to land on something real.
   *
   * Someone already PAST where the evidence questions belong simply never sees
   * them. That is the right trade — the interview is shorter rather than
   * rewinding a person who is nearly finished, and the evidence still reaches
   * the report regardless of whether it earned a question. */
  const idx = useMemo(() => {
    if (position.anchor) {
      const at = pages.findIndex((p) => p.steps.some((s) => s.id === position.anchor));
      if (at >= 0) return at;
    }
    return Math.min(position.idx, Math.max(0, pages.length - 1));
  }, [pages, position]);
  const page = pages[idx];

  useEffect(() => {
    onProgress?.(pages.length ? Math.min(1, idx / pages.length) : 1);
  }, [idx, pages.length, onProgress]);

  // Persist locally on every change so a closed tab never costs them progress.
  useEffect(() => {
    saveSession({ phase: "interview", interviewIdx: idx, interviewAnswers: answers });
  }, [idx, answers]);

  /* Debounced server save. Fire-and-forget: a failed save must never block
     someone mid-question, and the next save resends the same answers because
     the endpoint merges rather than replaces. Figures ride along so the report
     can price leaks in the client's own numbers. */
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void api.saveInterview(
        sessionId,
        answersRef.current,
        figuresFrom(steps, answersRef.current),
      );
    }, SAVE_DEBOUNCE_MS);
  }, [sessionId, steps]);

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

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
    await api.saveInterview(sessionId, answersRef.current, figuresFrom(steps, answersRef.current));
    await api.completeInterview(sessionId);
    saveSession({ phase: "confirmed" });
    onComplete();
  }, [onComplete, onOrb, sessionId, steps]);

  const goToNextPage = useCallback(() => {
    setReaction(null);
    const next = idx + 1;
    if (next >= pages.length) {
      void finish();
      return;
    }
    // Re-anchor as we move, from the page list as it stands right now.
    setPosition({ idx: next, anchor: pages[next]?.steps[0]?.id ?? null });
    onOrb?.("listening");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [finish, onOrb, idx, pages]);

  /* Sage speaks once per page rather than once per answer. A reply after every
     one of twenty questions is noise; a reply when a topic closes is a
     conversation. */
  const continueFromPage = useCallback(() => {
    const line = replyForPage(page, answersRef.current);
    if (line && !reduced) {
      setReaction(line);
      onOrb?.("detection");
      return;
    }
    goToNextPage();
  }, [goToNextPage, onOrb, page, reduced]);

  const setAnswer = useCallback(
    (id: string, value: unknown) => {
      setAnswers((a) => ({ ...a, [id]: value }));
      scheduleSave();
    },
    [scheduleSave],
  );

  if (finishing || !page) {
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

  const canContinue = pageComplete(page, answers);
  const isLastPage = idx === pages.length - 1;

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.sageAsk} aria-hidden="true">
          <span className={styles.sageAskDot} />
          <span>Sage</span>
        </div>

        <div className={styles.kicker}>
          {page.title} · page {idx + 1} of {pages.length}
        </div>

        {reaction ? (
          <SageReaction text={reaction} reduced={reduced} onContinue={goToNextPage} />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 18 }}>
              {page.steps.map((step) => (
                <Question
                  key={step.id}
                  step={step}
                  answer={answers[step.id]}
                  onAnswer={(value) => setAnswer(step.id, value)}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-md"
              style={{ marginTop: 28, alignSelf: "flex-start" }}
              disabled={!canContinue}
              onClick={continueFromPage}
            >
              {isLastPage ? "Finish" : "Continue"}
            </button>
            {!canContinue && (
              <p className={styles.hint} style={{ marginTop: 10 }}>
                Answer the questions above to carry on. Every one has a &ldquo;not sure&rdquo;
                if you would rather not guess.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---- one question, rendered inside a page ---- */
function Question({
  step,
  answer,
  onAnswer,
}: {
  step: InterviewStep;
  answer: unknown;
  onAnswer: (value: unknown) => void;
}) {
  return (
    <div>
      <h2 className={styles.question} style={{ fontSize: "clamp(19px,2.4vw,23px)" }}>
        {step.question}
      </h2>
      {step.hint && <p className={styles.hint}>{step.hint}</p>}

      {step.kind === "single" && (
        <div className={styles.options}>
          {(step.options ?? []).map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${styles.option} ${answer === o.value ? styles.optionSel : ""}`}
              aria-pressed={answer === o.value}
              onClick={() => onAnswer(o.value)}
            >
              <span className={styles.optionLabel}>{o.label}</span>
            </button>
          ))}
        </div>
      )}

      {step.kind === "multi" && (
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
                  onAnswer(current);
                }}
              >
                <span className={styles.optionLabel}>{o.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {step.kind === "text" && (
        <textarea
          className={styles.textarea}
          rows={3}
          maxLength={1000}
          value={typeof answer === "string" ? answer : ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer"
        />
      )}
    </div>
  );
}

/* Sage's line when a topic closes. Deliberately sparse: it fires on what the
 * page revealed, and stays quiet when there is nothing worth saying. */
function replyForPage(page: InterviewPage, answers: Record<string, unknown>): string | null {
  /* Only what THIS page asked. Reading the whole answer set meant a line could
     fire again several pages later, so Sage repeated itself verbatim on the way
     to the finish. */
  const onPage = new Set(page.steps.map((s) => s.id));
  const has = (id: string, ...values: string[]) =>
    onPage.has(id) && values.includes(String(answers[id] ?? ""));

  if (has("out_of_hours", "monday", "lost") || has("where_it_is_recorded", "in_my_head", "nowhere")) {
    return "That is the gap where most of the money goes. Noted.";
  }
  if (has("quote_followup_count", "none", "once")) {
    return "Most quotes are won on the third touch. One is leaving money there.";
  }
  if (has("no_shows", "not_tracked") || has("repeat_purchase", "not_tracked")) {
    return "If it is not counted it cannot be fixed. We will start by counting it.";
  }
  if (page.steps.some((s) => s.block === "evidence")) {
    return "Thank you. Sage could only see that part from the outside.";
  }
  if (page.steps.some((s) => s.block === "numbers")) {
    return "Good. Those numbers are what let the report price this in pounds rather than guesses.";
  }
  return null;
}
