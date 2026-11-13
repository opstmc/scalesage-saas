"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Catalyst from "@/lib/catalyst";
import { STEPS, VALVE, buildResult, jobValueOf, type ScanAnswers, type ScanNode } from "@/lib/catalyst";
import api, { type LookupMatch, type LookupResult, type ChecksResult, type ResearchState } from "@/lib/catalyst-api";
import type { OrbState } from "./SageOrb";
import LiveDiagram from "./LiveDiagram";
import { saveSession, type LookupState } from "./session";
import { reactionForLookup } from "./reactions";
import SageReaction, { sageReactDurationMs } from "./SageReaction";
import SectionResult from "./SectionResult";
import { SECTIONS, evidenceFrom, type Section } from "./sections";
import styles from "./catalyst.module.css";

/* ---------------------------------------------------------------------------
 * Tolerant view of a step. lib/catalyst is built in parallel and may expose
 * either the 13-Q shape ({ kind, order, other, ... }) or the older 10-Q shape
 * ({ inputType, ... }); we read both so a field rename never blanks the UI.
 * ------------------------------------------------------------------------- */
type Raw = Record<string, unknown>;
const RAW = STEPS as unknown as Raw[];

const OTHER = "__other__";
const BEAT_MS = 520; // ~500ms (max 900ms) non-blocking reaction beat (brief)
const DEBOUNCE_MS = 340; // Q1 lookup debounce

// Which step ids the Q1 lookup can satisfy (for auto-skip / auto-confirm).
const LOOKUP_IDS = new Set(["business", "company", "business_name", "businessname", "name", "lookup"]);
const SECTOR_IDS = new Set(["sector", "industry", "trade"]);

type Kind = "lookup" | "single" | "multi" | "text" | "slide";

function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}
function stepKind(st: Raw, idx: number): Kind {
  const k = String(st.kind ?? "").toLowerCase();
  if (k === "lookup") return "lookup";
  if (k === "multi") return "multi";
  if (k === "single") return "single";
  if (k === "text") return "text";
  const it = String(st.inputType ?? "").toLowerCase();
  if (it === "lookup") return "lookup";
  if (it === "multi") return "multi";
  if (it === "slide") return "slide";
  if (it === "type" || it === "text") return "text";
  // id-based lookup detection so a 13-Q "business" step is a lookup even if the
  // kind field is missing; the 10-Q "sector" step is untouched (not in the set).
  if (idx === 0 && LOOKUP_IDS.has(String(st.id ?? "").toLowerCase())) return "lookup";
  return "single"; // "choose" and anything unknown render as single-select
}
interface UIOption {
  value: string;
  label: string;
  desc?: string;
}
function stepOptions(st: Raw): UIOption[] {
  const opts = Array.isArray(st.options) ? (st.options as Raw[]) : [];
  return opts.map((o) => ({
    value: String(o.value ?? ""),
    label: String(o.label ?? o.value ?? ""),
    desc: str(o.desc),
  }));
}
function stepOther(st: Raw): boolean {
  return st.other === true || st.allowOther === true || st.typeIn === true;
}
function stepId(st: Raw): string {
  return String(st.id ?? "");
}
function stepKicker(st: Raw): string | undefined {
  return str(st.kicker);
}
function stepHint(st: Raw): string | undefined {
  return str(st.helper) ?? str(st.hint);
}
/* pipe(text, a) resolves answer-driven tokens in copy; stemForAnswers swaps the
 * group-specific stem. Both are pulled tolerantly so a missing export is a
 * no-op, never a crash. */
const anyLib = Catalyst as unknown as {
  pipe?: (text: string, a: ScanAnswers) => string;
  stemForAnswers?: (step: unknown, a: ScanAnswers) => string;
};
function pipeText(text: string, a: ScanAnswers): string {
  if (typeof anyLib.pipe !== "function") return text;
  try {
    return anyLib.pipe(text, a) || text;
  } catch {
    return text;
  }
}
function stemText(st: Raw, a: ScanAnswers): string {
  const base = str(st.stem) ?? str(st.question) ?? "";
  let s = base;
  if (typeof anyLib.stemForAnswers === "function") {
    try {
      s = anyLib.stemForAnswers(st, a) || base;
    } catch {
      s = base;
    }
  }
  return pipeText(s, a);
}

/* ---- lookup -> answer prefill (auto-skip) ---- */
/** Answers the lookup can pre-fill, plus the ids to auto-skip past. */
function fillsFromLookup(match: LookupMatch): { fills: Record<string, string>; skip: Set<string> } {
  const fills: Record<string, string> = {};
  const skip = new Set<string>();
  for (const st of RAW) {
    const id = stepId(st).toLowerCase();
    const opts = stepOptions(st);
    if (SECTOR_IDS.has(id) && match.sector) {
      const hit = opts.find((o) => o.value === match.sector || o.label.toLowerCase() === String(match.sector).toLowerCase());
      if (hit) {
        fills[stepId(st)] = hit.value;
        skip.add(stepId(st));
      }
    }
  }
  return { fills, skip };
}

/* ---- screens: Q1 alone, then each section's questions and its result ---- */
type Screen =
  | { kind: "lookup"; steps: number[] }
  | { kind: "questions"; section: Section; steps: number[] }
  | { kind: "result"; section: Section };

const STEP_INDEX = new Map(RAW.map((st, i) => [stepId(st), i] as const));

/** The business's own site off the Q1 match, if it carries one.
 *
 *  Read tolerantly (`website` or `domain`) so the field arriving under either
 *  name still works, and so an older backend that sends neither is simply a
 *  null rather than a crash. Sending it matters: without a URL the background
 *  website check has nothing to open, so the load time, the tap-to-call proxy
 *  and "does your site load at all" are all null for the whole scan. */
function websiteOf(match: LookupMatch | null): string | null {
  if (!match) return null;
  const raw = match.website ?? (match as { domain?: unknown }).domain;
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
}

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

/* ========================================================================= */

export default function ScanFlow({
  initialIdx = 0,
  initialAnswers,
  initialLookup,
  initialChecks,
  onComplete,
  onOrb,
  onProgress,
  onLookup,
  onChecks,
}: {
  initialIdx?: number;
  initialAnswers?: ScanAnswers;
  initialLookup?: LookupState | null;
  initialChecks?: ChecksResult | null;
  onComplete: (answers: ScanAnswers, extras: { lookup: LookupState | null; checks: ChecksResult | null }) => void;
  onOrb?: (state: OrbState) => void;
  onProgress?: (fraction: number) => void;
  onLookup?: (lookup: LookupState) => void;
  onChecks?: (checks: ChecksResult) => void;
}) {
  const reduced = usePrefersReducedMotion();

  const [idx, setIdx] = useState(Math.max(0, initialIdx));
  const [answers, setAnswers] = useState<ScanAnswers>(initialAnswers ?? ({} as ScanAnswers));
  const [reaction, setReaction] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  // Q1 lookup + background-check state (mirrored into session for resume).
  const [lookup, setLookup] = useState<LookupState | null>(initialLookup ?? null);
  const [checks, setChecks] = useState<ChecksResult | null>(initialChecks ?? null);
  const [checkState, setCheckState] = useState<"idle" | "running" | "done">(initialChecks ? "done" : "idle");
  const [research, setResearch] = useState<ResearchState | null>(null);
  const runIdRef = useRef<string | null>(null);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const timers = useRef<number[]>([]);
  const trail = useRef<number[]>([]); // visited indices, so Back respects skips
  const [trailLen, setTrailLen] = useState(0); // reactive mirror of trail length for render
  const [skipIds, setSkipIds] = useState<Set<string>>(new Set());
  const cardRef = useRef<HTMLDivElement>(null);
  const firstStep = useRef(true);

  // Stops the bounded background-check retries when the scan is left behind.
  const checksAbort = useRef<AbortController | null>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(
    () => () => {
      clearTimers();
      checksAbort.current?.abort();
    },
    [],
  );

  // ---- persistence: refresh never resets ----
  useEffect(() => {
    saveSession({ phase: "scan", idx, answers, lookup, checks });
  }, [idx, answers, lookup, checks]);

  // ---- on step change, bring the new step into view ----
  // Without this, advancing to a shorter step leaves the viewport parked where the
  // previous (taller) step was, so the user lands staring at empty space and the
  // footer. Scroll the new card to the top and move focus for keyboard users.
  // Skips the first render so there's no scroll jump on load.
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    const el = cardRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }, [idx, reduced]);

  /* ---- screens --------------------------------------------------------
   * Q1 sits alone: it is the live lookup and it starts the research. Then each
   * section asks its questions and shows its result, built from the steps the
   * lookup did NOT already answer. The optional free-text line rides on the
   * last screen, with the priority question. */
  const screens = useMemo<Screen[]>(() => {
    const out: Screen[] = [{ kind: "lookup", steps: [0] }];
    for (const section of SECTIONS) {
      const steps = section.steps
        .filter((id) => !skipIds.has(id))
        .map((id) => STEP_INDEX.get(id))
        .filter((i): i is number => typeof i === "number");
      if (steps.length) out.push({ kind: "questions", section, steps });
      if (section.id !== "priority") out.push({ kind: "result", section });
    }
    return out;
  }, [skipIds]);
  const at = Math.min(idx, screens.length - 1);
  const screen = screens[at];
  const isLast = at >= screens.length - 1;

  // ---- progress ring feed ----
  useEffect(() => {
    onProgress?.(at / screens.length);
  }, [at, screens.length, onProgress]);

  // ---- orb ----
  const setOrb = useCallback((s: OrbState) => onOrb?.(s), [onOrb]);
  const pulse = useCallback(() => {
    if (reduced) {
      setOrb("listening");
      return;
    }
    setOrb("detection");
    timers.current.push(window.setTimeout(() => setOrb("thinking"), 160));
    timers.current.push(window.setTimeout(() => setOrb("listening"), BEAT_MS));
  }, [reduced, setOrb]);


  const A = answers as unknown as Record<string, unknown>;

  const setAnswer = useCallback((id: string, val: unknown) => {
    setAnswers((a) => ({ ...(a as unknown as Record<string, unknown>), [id]: val }) as ScanAnswers);
  }, []);

  /* ---- live nodes for LiveDiagram (brief: buildResult(answers)) ---- */
  const nodes = useMemo<ScanNode[]>(() => {
    try {
      const r = buildResult(answers, evidenceFrom(checks));
      return Array.isArray(r?.nodes) ? r.nodes : [];
    } catch {
      return [];
    }
  }, [answers, checks]);
  const liveCount = nodes.filter((n) => {
    const c = String((n as unknown as { chip?: string }).chip ?? "").toLowerCase();
    return c.includes("detect") || c.includes("likely");
  }).length;

  /* ---- navigation, a screen at a time ----
   * idx is the SCREEN index: Q1, then each section's questions and result. The
   * last screen is the priority question; continuing from it ends the scan. */
  const goForward = useCallback(() => {
    clearTimers();
    if (isLast) {
      setOrb("handover");
      onComplete(answersRef.current, { lookup, checks });
      return;
    }
    trail.current.push(at);
    setTrailLen(trail.current.length);
    setIdx(at + 1);
    pulse();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [at, isLast, onComplete, lookup, checks, pulse, setOrb]);

  /* ---- a result screen reads the research once on arrival, so the job value
   * estimate and the latest findings show without waiting for the next poll. */
  useEffect(() => {
    const runId = runIdRef.current;
    if (screen?.kind !== "result" || !runId) return;
    let live = true;
    void api
      .research(runId, jobValueOf(answersRef.current), Catalyst.sectorOf(answersRef.current))
      .then((state) => {
        if (live && state) setResearch(state);
      });
    return () => {
      live = false;
    };
  }, [screen]);

  const goBack = useCallback(() => {
    clearTimers();
    setReaction(null);
    const prev = trail.current.pop();
    setTrailLen(trail.current.length);
    setIdx((i) => (typeof prev === "number" ? prev : Math.max(0, i - 1)));
    setOrb("listening");
  }, [setOrb]);

  /* ---- Sage reacts to the answer, then waits to be read (instant when reduced)
   * The reply types out and stays on screen. It used to clear itself once the
   * typing plus a read pause had elapsed, which meant Sage's line could vanish
   * mid-read: that timer started when the line started, so a long reply spent
   * its own budget typing and left almost nothing to read in.
   *
   * SageReaction now owns the advance, and its window starts at the LAST
   * character, is at least ten seconds, grows with the length of the line, and
   * resets in full on any sign of a reader (pointer, scroll, key, focus,
   * selection, hidden tab, bubble scrolled out of view). Under reduced motion
   * there is no timer at all, and in practice reduced motion never reaches it:
   * reactThenAdvance below skips the reply beat entirely. Continue still wins at
   * any moment. The orb settles on its own, as before. */
  const reactThenAdvance = useCallback(
    (text: string | null) => {
      clearTimers();
      if (!text || reduced) {
        goForward();
        return;
      }
      setReaction(text);
      setOrb("detection");
      timers.current.push(window.setTimeout(() => setOrb("thinking"), 180));
      timers.current.push(
        window.setTimeout(() => setOrb("listening"), sageReactDurationMs(text)),
      );
    },
    [goForward, reduced, setOrb],
  );
  /** Dismiss the reply and move on. Called by Continue, and by the reading
   *  window once it has actually elapsed unread. */
  const continueFromReaction = useCallback(() => {
    clearTimers();
    setReaction(null);
    goForward();
  }, [goForward]);

  /* ---- answer helpers ---- */
  /* Choosing an answer records it and nothing else. Advancing is the screen's
   * Continue button, so a section with two questions never jumps ahead after
   * the first. */
  const chooseSingle = (st: Raw, value: string) => {
    setAnswer(stepId(st), value);
  };

  /** Every question on the page has an answer. */
  const pageAnswered = (indices: number[]): boolean =>
    indices.every((i) => {
      const st = RAW[i];
      const value = (answers as unknown as Record<string, unknown>)[stepId(st)];
      const k = stepKind(st, i);
      if (k === "multi") return Array.isArray(value) && value.length > 0;
      if (k === "text" || k === "lookup") return typeof value === "string" && value.trim() !== "";
      return value !== undefined && value !== null && value !== "";
    });
  const toggleMulti = (st: Raw, value: string) => {
    const id = stepId(st);
    // Mutually-exclusive answers: an option can declare `exclusiveWith` in the
    // config (e.g. "we'd cope fine" excludes "enquiries pile up"). Enforced
    // symmetrically so a contradictory pair can never both be selected.
    const rawOpts =
      (st as { options?: Array<{ value: string; exclusiveWith?: string[] }> }).options ?? [];
    const conflicts = (a: string, b: string): boolean => {
      const oa = rawOpts.find((o) => o.value === a);
      const ob = rawOpts.find((o) => o.value === b);
      return Boolean(oa?.exclusiveWith?.includes(b) || ob?.exclusiveWith?.includes(a));
    };
    setAnswers((a) => {
      const rec = a as unknown as Record<string, unknown>;
      const cur = Array.isArray(rec[id]) ? [...(rec[id] as string[])] : [];
      const at = cur.indexOf(value);
      if (at >= 0) {
        cur.splice(at, 1);
        return { ...rec, [id]: cur } as ScanAnswers;
      }
      // On select, drop any currently-selected answer that contradicts this one.
      const kept = cur.filter((v) => !conflicts(value, v));
      kept.push(value);
      return { ...rec, [id]: kept } as ScanAnswers;
    });
  };
  const multiHas = (st: Raw, value: string) => Array.isArray(A[stepId(st)]) && (A[stepId(st)] as string[]).includes(value);

  /* ---- Q1 lock: fire background checks, record identity, advance ---- */
  const lockQ1 = useCallback(
    (match: LookupMatch | null, manual: boolean, businessName: string) => {
      const state: LookupState = { confirmed: true, manual, match };
      setLookup(state);
      onLookup?.(state);

      /* Fire the live background checks — non-blocking, never gates the flow.
       *
       * It used to be one call and one call only, so a deferred answer (a tool
       * timeout, a cold backend) left the diagram empty for the whole scan and
       * left the deep interview with no evidence to ask about. Now it retries
       * on a short, bounded ladder and folds each better answer in as it lands.
       * Aborted on unmount, so leaving the scan stops the requests. */
      setCheckState("running");
      checksAbort.current?.abort();
      const ctrl = new AbortController();
      checksAbort.current = ctrl;
      void (async () => {
        await api.researchWithChecks(
          {
            business_name: businessName,
            website: websiteOf(match),
            sector: match?.sector ?? (typeof A.sector === "string" ? (A.sector as string) : null),
            location: match?.location ?? null,
            place_id: match?.place_id ?? null,
            company_number: match?.company_number ?? null,
            rating: match?.rating ?? null,
            review_count: match?.review_count ?? null,
            incorporated_year: match?.incorporated_year ?? null,
          },
          {
            signal: ctrl.signal,
            onRun: (runId) => {
              runIdRef.current = runId;
              saveSession({ researchId: runId });
            },
            onState: (state) => setResearch(state),
            jobValue: () => jobValueOf(answersRef.current),
            sector: () => Catalyst.sectorOf(answersRef.current),
            onResult: (res) => {
              setChecks(res);
              onChecks?.(res);
            },
          },
        );
        if (!ctrl.signal.aborted) setCheckState("done");
      })();

      reactThenAdvance(reactionForLookup(manual));
    },
    [A.sector, reactThenAdvance, onChecks, onLookup],
  );

  const confirmMatch = (match: LookupMatch) => {
    const id = stepId(RAW[0]);
    const { fills, skip } = fillsFromLookup(match);
    setSkipIds(skip);
    // one write: the business name plus every field the lookup could auto-fill
    setAnswers((a) => ({ ...(a as Record<string, unknown>), [id]: match.name, ...fills }) as ScanAnswers);
    lockQ1(match, false, match.name);
  };
  const manualContinue = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const id = stepId(RAW[0]);
    setSkipIds(new Set()); // manual add answers the sector question itself, no skipping
    setAnswer(id, clean);
    lockQ1(null, true, clean);
  };

  /* ---- render ---- */
  const screenSteps = screen.kind === "result" ? [] : screen.steps;
  const activeStepId = screenSteps.length ? stepId(RAW[screenSteps[0]]) : "";
  const running = checkState === "running" && !research?.finished;

  return (
    <div className={styles.shell}>
      <div className={styles.scanCols}>
        {/* LEFT (desktop) / BELOW (mobile): the question card */}
        <div className={styles.cardCol}>
          {screen.kind === "result" ? (
            <div ref={cardRef} tabIndex={-1} className={`glass ${styles.card}`}>
              <SectionResult
                section={screen.section}
                answers={answers}
                checks={checks}
                research={research}
                lookup={lookup}
                running={running}
                onContinue={goForward}
              />
              <div className={styles.controls}>
                <button type="button" className={styles.back} onClick={goBack}>
                  &larr; Back
                </button>
                <span className={styles.count}>
                  {at + 1} / {screens.length}
                </span>
              </div>
            </div>
          ) : (
            <div ref={cardRef} tabIndex={-1} className={`glass ${styles.card}`}>
              <div className={styles.sageAsk} aria-hidden="true">
                <span className={styles.sageAskDot} />
                <span>Sage</span>
              </div>

              {reaction ? (
                <SageReaction text={reaction} reduced={reduced} onContinue={continueFromReaction} />
              ) : (
                <>
                  <div className={styles.pageStack}>
                    {screenSteps.map((si) => {
                      const st = RAW[si];
                      const sid = stepId(st);
                      const k = stepKind(st, si);
                      return (
                        <div key={sid}>
                          {stepKicker(st) && <div className={styles.kicker}>{stepKicker(st)}</div>}
                          <h2 className={styles.question}>{stemText(st, answers)}</h2>
                          {stepHint(st) && (
                            <p className={styles.hint}>{pipeText(stepHint(st)!, answers)}</p>
                          )}

                          {/* Q1 live lookup. Alone on its own screen: confirming
                              it starts the research the sections report on. */}
                          {k === "lookup" && (
                            <LookupField
                              initialQuery={String(A[sid] ?? lookup?.match?.name ?? "")}
                              onConfirm={confirmMatch}
                              onManual={manualContinue}
                            />
                          )}

                          {k === "single" && (
                            <SingleSelect
                              st={st}
                              selected={String(A[sid] ?? "")}
                              otherText={String(A[`${sid}_other`] ?? "")}
                              onChoose={(v) => chooseSingle(st, v)}
                              onOtherText={(v) => setAnswer(`${sid}_other`, v)}
                            />
                          )}

                          {k === "multi" && (
                            <MultiSelect
                              st={st}
                              has={(v) => multiHas(st, v)}
                              otherText={String(A[`${sid}_other`] ?? "")}
                              onToggle={(v) => toggleMulti(st, v)}
                              onOtherText={(v) => setAnswer(`${sid}_other`, v)}
                            />
                          )}

                          {k === "slide" && (
                            <SlideInput
                              st={st}
                              value={A[sid]}
                              onChange={(n) => setAnswer(sid, n)}
                            />
                          )}

                          {k === "text" && (
                            <TextInput
                              st={st}
                              value={String(A[sid] ?? "")}
                              onChange={(v) => setAnswer(sid, v)}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* The optional free-text line rides on the last screen. */}
                    {isLast && (
                      <div>
                        <label className={styles.hint} htmlFor="ss-problems-raw" style={{ display: "block", marginBottom: 10 }}>
                          {pipeText(VALVE.question, answers)} {VALVE.hint}
                        </label>
                        <textarea
                          id="ss-problems-raw"
                          className={styles.textarea}
                          value={String(A[VALVE.id] ?? "")}
                          onChange={(e) => setAnswer(VALVE.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Q1 advances itself: confirming a business IS the answer, so
                      a second button to press would be a step for nothing. */}
                  {screen.kind !== "lookup" && (
                    <button
                      type="button"
                      className="btn btn-primary btn-md"
                      style={{ marginTop: 22, alignSelf: "flex-start" }}
                      disabled={!pageAnswered(screenSteps)}
                      onClick={goForward}
                    >
                      Continue
                    </button>
                  )}

                  <div className={styles.controls}>
                    {(at > 0 || trailLen > 0) && (
                      <button type="button" className={styles.back} onClick={goBack}>
                        &larr; Back
                      </button>
                    )}
                    <span className={styles.count}>
                      {at + 1} / {screens.length}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT (desktop) / TOP strip (mobile): the live diagram */}
        <div className={styles.diagramCol}>
          <button
            type="button"
            className={styles.mapToggle}
            aria-expanded={mapOpen}
            onClick={() => setMapOpen((o) => !o)}
          >
            <span className={styles.stripBarText}>
              <span className={styles.mapTitle}>Live leak map</span>
              {liveCount > 0 ? `${liveCount} live` : "reading your answers"}
            </span>
            <span className={`${styles.stripCaret} ${mapOpen ? styles.stripCaretOpen : ""}`}>{mapOpen ? "Hide" : "Show"}</span>
          </button>

          <div className={`${styles.diagramPanel} ${mapOpen ? styles.diagramPanelOpen : ""}`}>
            <div className={styles.diagramSticky}>
              <ScanChecklist answers={answers} reduced={reduced} />
              <LiveDiagram answers={answers} activeStepId={activeStepId} nodes={nodes} reducedMotion={reduced} />
              {checkState !== "idle" && (
                <p className={styles.checkNote} aria-live="polite">
                  {checkState === "running"
                    ? "Sage is checking your online presence in the background…"
                    : checks?.status === "deferred"
                      ? "We’ll confirm your online presence in the full scan."
                      : "Live check folded into your map."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanChecklist({ answers, reduced }: { answers: ScanAnswers; reduced: boolean }) {
  const answered = (ids: string[]) => ids.some((id) => {
    const value = answers[id];
    return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim().length > 0;
  });
  const items = [
    ["Lead capture", ["channels", "capture"]],
    ["Response speed", ["channels", "convert"]],
    ["Conversion path", ["convert", "relief"]],
    ["Follow-up", ["reviews", "return"]],
    ["Visibility", ["findable"]],
  ] as const;
  return (
    <div className={styles.scanStatus} aria-label="Scan progress">
      <div className={styles.scanRadar} aria-hidden="true"><span /></div>
      <div className={styles.scanStatusCopy}>
        <span className={styles.scanStatusKicker}>System scan</span>
        <span className={styles.scanStatusTitle}>Reading your growth system</span>
        <div className={styles.scanChecklist}>
          {items.map(([label, ids]) => {
            const done = answered([...ids]);
            return <span key={label} className={`${styles.scanCheck} ${done ? styles.scanCheckDone : ""} ${reduced ? styles.scanCheckStatic : ""}`}><i aria-hidden="true">{done ? "✓" : "○"}</i>{label}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ sub-components ============================== */

function OptionButton({
  opt,
  selected,
  multi,
  onClick,
}: {
  opt: UIOption;
  selected: boolean;
  multi: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`${styles.option} ${selected ? styles.optionSel : ""}`} onClick={onClick} aria-pressed={selected}>
      <span className={styles.optionRow}>
        <span className={styles.optionLabel}>{opt.label}</span>
        <span className={`${styles.tick} ${selected ? styles.tickSel : ""} ${multi ? styles.tickBox : ""}`} aria-hidden="true" />
      </span>
      {opt.desc && <span className={styles.optionDesc}>{opt.desc}</span>}
    </button>
  );
}

function SingleSelect({
  st,
  selected,
  otherText,
  onChoose,
  onOtherText,
  onContinue,
}: {
  st: Raw;
  selected: string;
  otherText: string;
  onChoose: (v: string) => void;
  onOtherText: (v: string) => void;
  onContinue?: () => void;
}) {
  const opts = stepOptions(st);
  return (
    <>
      <div className={`${styles.options} ${opts.length <= 1 ? styles.optionsOne : ""}`}>
        {opts.map((o) => (
          <OptionButton key={o.value} opt={o} selected={selected === o.value} multi={false} onClick={() => onChoose(o.value)} />
        ))}
        {stepOther(st) && (
          <OptionButton opt={{ value: OTHER, label: "Something else" }} selected={selected === OTHER} multi={false} onClick={() => onChoose(OTHER)} />
        )}
      </div>
      {selected === OTHER && (
        <div className={styles.otherWrap}>
          <textarea
            className={styles.textarea}
            style={{ minHeight: 84 }}
            placeholder="Tell Sage in your own words…"
            value={otherText}
            onChange={(e) => onOtherText(e.target.value)}
            aria-label="Describe your answer"
          />
          {onContinue && (
            <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 12 }} onClick={onContinue}>
            Continue
          </button>
          )}
        </div>
      )}
    </>
  );
}

function MultiSelect({
  st,
  has,
  otherText,
  onToggle,
  onOtherText,
  onContinue,
}: {
  st: Raw;
  has: (v: string) => boolean;
  otherText: string;
  onToggle: (v: string) => void;
  onOtherText: (v: string) => void;
  onContinue?: () => void;
}) {
  const opts = stepOptions(st);
  return (
    <>
      <div className={styles.options}>
        {opts.map((o) => (
          <OptionButton key={o.value} opt={o} selected={has(o.value)} multi onClick={() => onToggle(o.value)} />
        ))}
        {stepOther(st) && (
          <OptionButton opt={{ value: OTHER, label: "Something else" }} selected={has(OTHER)} multi onClick={() => onToggle(OTHER)} />
        )}
      </div>
      {has(OTHER) && (
        <div className={styles.otherWrap}>
          <textarea
            className={styles.textarea}
            style={{ minHeight: 84 }}
            placeholder="Tell Sage in your own words…"
            value={otherText}
            onChange={(e) => onOtherText(e.target.value)}
            aria-label="Describe your answer"
          />
        </div>
      )}
      {onContinue && (
        <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 18 }} onClick={onContinue}>
        Continue
      </button>
      )}
    </>
  );
}

function fmtMoney(v: number): string {
  if (v >= 100000) return "£100k+";
  if (v >= 1000) return "£" + v / 1000 + "k";
  return "£" + v;
}
function SlideInput({ st, value, onChange, onContinue }: { st: Raw; value: unknown; onChange: (n: number) => void; onContinue?: () => void }) {
  const min = Number(st.min ?? 0);
  const max = Number(st.max ?? 100);
  const stepN = Number(st.step ?? 1);
  const def = Number(st.default ?? min);
  const money = st.money === true;
  const cur = Number(value ?? def);
  return (
    <div className={styles.slider}>
      <div className={styles.sliderValue}>{money ? fmtMoney(cur) : cur}</div>
      <input
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={stepN}
        value={cur}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={String(st.stem ?? st.question ?? "")}
      />
      <div className={styles.rangeEnds}>
        <span>{str(st.minLabel)}</span>
        <span>{str(st.maxLabel)}</span>
      </div>
      {onContinue && (
        <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 22 }} onClick={onContinue}>
        Continue
      </button>
      )}
    </div>
  );
}

function TextInput({ st, value, onChange, onContinue }: { st: Raw; value: string; onChange: (v: string) => void; onContinue?: () => void }) {
  return (
    <>
      <textarea
        className={styles.textarea}
        placeholder={str(st.placeholder) ?? "Type your answer…"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={String(st.stem ?? st.question ?? "")}
      />
      {onContinue && (
        <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 18 }} onClick={onContinue}>
        Continue
      </button>
      )}
    </>
  );
}

/* ---- Q1 live business lookup ---- */
function LookupField({
  initialQuery,
  onConfirm,
  onManual,
}: {
  initialQuery: string;
  onConfirm: (m: LookupMatch) => void;
  onManual: (name: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [pending, setPending] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const token = useRef(0);
  const debounce = useRef<number | null>(null);

  useEffect(() => {
    const q = query.trim();
    const mine = ++token.current;
    // All state updates happen inside the debounce callback, never synchronously
    // in the effect body — avoids cascading renders on every keystroke.
    debounce.current = window.setTimeout(async () => {
      if (mine !== token.current) return;
      if (q.length < 2) {
        setResult(null);
        setPending(false);
        return;
      }
      setPending(true);
      const res = await api.lookup(q);
      if (mine !== token.current) return; // a newer keystroke won
      setResult(res);
      setPending(false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const top = result?.status === "ok" ? result.matches[0] : null;

  return (
    <div>
      <input
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing your business name…"
        aria-label="Your business name"
        autoComplete="organization"
        autoFocus
      />

      {pending && !top && (
        <p className={styles.lookupPending} aria-live="polite">
          Looking you up…
        </p>
      )}

      {top && !showManual && (
        <div className={styles.matchCard} aria-live="polite">
          <div className={styles.matchLabel}>Found a possible match</div>
          <div className={styles.matchName}>{top.name}</div>
          <div className={styles.matchMeta}>{matchLine(top)}</div>
          <div className={styles.matchActions}>
            <button type="button" className="btn btn-primary btn-md" onClick={() => onConfirm(top)}>
              Yes, that&rsquo;s us
            </button>
            <button type="button" className={styles.linkBtn} onClick={() => setShowManual(true)}>
              Can&rsquo;t see the right one? Add it manually
            </button>
          </div>
        </div>
      )}

      {(showManual || (!pending && query.trim().length >= 2 && !top)) && (
        <div className={styles.otherWrap}>
          <p className={styles.hint} style={{ margin: "6px 0 12px" }}>
            {top ? "No problem. Use the name exactly as you’d like it to appear." : "We couldn’t find a match, so we’ll take it straight from you."}
          </p>
          <button type="button" className="btn btn-primary btn-md" onClick={() => onManual(query)} disabled={query.trim().length < 2}>
            Continue with this name
          </button>
        </div>
      )}
    </div>
  );
}

function matchLine(m: LookupMatch): string {
  const bits: string[] = [];
  if (m.sector) bits.push(String(m.sector));
  if (typeof m.incorporated_year === "number") bits.push(`trading since ${m.incorporated_year}`);
  if (m.location) bits.push(m.location);
  if (typeof m.review_count === "number" && m.review_count > 0) bits.push(`${m.review_count} Google reviews`);
  return bits.length ? `${bits.join(" · ")}. Is this you?` : "Is this you?";
}
