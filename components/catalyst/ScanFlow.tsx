"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Catalyst from "@/lib/catalyst";
import { STEPS, buildResult, type ScanAnswers, type ScanNode } from "@/lib/catalyst";
import api, { type LookupMatch, type LookupResult, type ChecksResult } from "@/lib/catalyst-api";
import type { OrbState } from "./SageOrb";
import LiveDiagram from "./LiveDiagram";
import { saveSession, type LookupState } from "./session";
import { reactionFor, reactionForLookup } from "./reactions";
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
const REACT_MS = 1400; // Sage's per-answer reaction beat before advancing (skippable)
const DEBOUNCE_MS = 340; // Q1 lookup debounce

// Which step ids the Q1 lookup can satisfy (for auto-skip / auto-confirm).
const LOOKUP_IDS = new Set(["business", "company", "business_name", "businessname", "name", "lookup"]);
const SECTOR_IDS = new Set(["sector", "industry", "trade"]);
const YEAR_IDS = new Set(["years", "year", "established", "trading", "tenure", "age", "since"]);

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

/* ---- lookup -> answer prefill (auto-skip / auto-confirm) ---- */
function parseRange(value: string, label: string): [number, number] | null {
  const text = `${value} ${label}`.toLowerCase();
  const nums = (text.match(/\d+/g) ?? []).map(Number);
  if (/\b(under|less|below|<)\b/.test(text) && nums.length >= 1) return [0, nums[0]];
  if ((/\+/.test(text) || /\b(over|more|plus|above|>)\b/.test(text)) && nums.length >= 1) return [nums[0], Infinity];
  if (nums.length >= 2) return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
  if (nums.length === 1) return [nums[0], nums[0]];
  return null;
}
/** Answers the lookup can pre-fill, plus the ids to auto-skip past. */
function fillsFromLookup(match: LookupMatch): { fills: Record<string, string>; skip: Set<string> } {
  const fills: Record<string, string> = {};
  const skip = new Set<string>();
  const age = typeof match.incorporated_year === "number" ? new Date().getFullYear() - match.incorporated_year : null;
  for (const st of RAW) {
    const id = stepId(st).toLowerCase();
    const opts = stepOptions(st);
    if (SECTOR_IDS.has(id) && match.sector) {
      const hit = opts.find((o) => o.value === match.sector || o.label.toLowerCase() === String(match.sector).toLowerCase());
      if (hit) {
        fills[stepId(st)] = hit.value;
        skip.add(stepId(st));
      }
    } else if (YEAR_IDS.has(id) && age != null && age >= 0) {
      const hit = opts.find((o) => {
        const r = parseRange(o.value, o.label);
        return r ? age >= r[0] && age <= r[1] : false;
      });
      if (hit) {
        fills[stepId(st)] = hit.value;
        skip.add(stepId(st));
      }
    }
  }
  return { fills, skip };
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
  const VALVE = RAW.length; // the expression valve sits after the last real step
  const TOTAL = VALVE + 1;

  const [idx, setIdx] = useState(Math.min(Math.max(0, initialIdx), VALVE));
  const [answers, setAnswers] = useState<ScanAnswers>(initialAnswers ?? ({} as ScanAnswers));
  const [reaction, setReaction] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  // Q1 lookup + background-check state (mirrored into session for resume).
  const [lookup, setLookup] = useState<LookupState | null>(initialLookup ?? null);
  const [checks, setChecks] = useState<ChecksResult | null>(initialChecks ?? null);
  const [checkState, setCheckState] = useState<"idle" | "running" | "done">(initialChecks ? "done" : "idle");

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const timers = useRef<number[]>([]);
  const trail = useRef<number[]>([]); // visited indices, so Back respects skips
  const [trailLen, setTrailLen] = useState(0); // reactive mirror of trail length for render
  const skipIds = useRef<Set<string>>(new Set());

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  // ---- persistence: refresh never resets ----
  useEffect(() => {
    saveSession({ phase: "scan", idx, answers, lookup, checks });
  }, [idx, answers, lookup, checks]);

  // ---- progress ring feed ----
  useEffect(() => {
    onProgress?.(Math.min(idx, VALVE) / TOTAL);
  }, [idx, VALVE, TOTAL, onProgress]);

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

  const step = RAW[idx] as Raw | undefined;
  const kind = step ? stepKind(step, idx) : "single";
  const A = answers as unknown as Record<string, unknown>;

  const setAnswer = useCallback((id: string, val: unknown) => {
    setAnswers((a) => ({ ...(a as unknown as Record<string, unknown>), [id]: val }) as ScanAnswers);
  }, []);

  /* ---- live nodes for LiveDiagram (brief: buildResult(answers)) ---- */
  const nodes = useMemo<ScanNode[]>(() => {
    try {
      const r = buildResult(answers);
      return Array.isArray(r?.nodes) ? r.nodes : [];
    } catch {
      return [];
    }
  }, [answers]);
  const liveCount = nodes.filter((n) => {
    const c = String((n as unknown as { chip?: string }).chip ?? "").toLowerCase();
    return c.includes("detect") || c.includes("likely");
  }).length;

  /* ---- navigation (non-blocking: advance immediately, react in parallel) ---- */
  const goForward = useCallback(() => {
    clearTimers();
    if (idx >= VALVE) {
      setOrb("handover");
      onComplete(answersRef.current, { lookup, checks });
      return;
    }
    // advance, skipping any steps the lookup already answered
    let next = idx + 1;
    while (next < VALVE && skipIds.current.has(stepId(RAW[next]))) next += 1;
    trail.current.push(idx);
    setTrailLen(trail.current.length);
    setIdx(next);
    pulse();
  }, [idx, VALVE, onComplete, lookup, checks, pulse, setOrb]);

  const goBack = useCallback(() => {
    clearTimers();
    setReaction(null);
    const prev = trail.current.pop();
    setTrailLen(trail.current.length);
    setIdx((i) => (typeof prev === "number" ? prev : Math.max(0, i - 1)));
    setOrb("listening");
  }, [setOrb]);

  /* ---- Sage reacts to the answer, then advances (skippable; instant when reduced) ---- */
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
        window.setTimeout(() => {
          setReaction(null);
          goForward();
        }, REACT_MS),
      );
    },
    [goForward, reduced, setOrb],
  );
  const skipReaction = useCallback(() => {
    clearTimers();
    setReaction(null);
    goForward();
  }, [goForward]);

  /* ---- answer helpers ---- */
  const chooseSingle = (st: Raw, value: string) => {
    setAnswer(stepId(st), value);
    if (value === OTHER) return; // reveal the "Other" field, wait for Continue
    const react = reactionFor(stepId(st), value);
    // let the committed answer reach the diagram first, then Sage reacts
    timers.current.push(window.setTimeout(() => reactThenAdvance(react), reduced ? 0 : 40));
  };
  const toggleMulti = (st: Raw, value: string) => {
    const id = stepId(st);
    setAnswers((a) => {
      const rec = a as unknown as Record<string, unknown>;
      const cur = Array.isArray(rec[id]) ? [...(rec[id] as string[])] : [];
      const at = cur.indexOf(value);
      if (at >= 0) cur.splice(at, 1);
      else cur.push(value);
      return { ...rec, [id]: cur } as ScanAnswers;
    });
  };
  const multiHas = (st: Raw, value: string) => Array.isArray(A[stepId(st)]) && (A[stepId(st)] as string[]).includes(value);

  /* ---- Q1 lock: fire background checks, record identity, advance ---- */
  const lockQ1 = useCallback(
    (match: LookupMatch | null, manual: boolean, businessName: string) => {
      const state: LookupState = { confirmed: true, manual, match };
      setLookup(state);
      onLookup?.(state);

      // fire the live background checks — non-blocking, never gates the flow
      setCheckState("running");
      void (async () => {
        const res = await api.checks({
          business_name: businessName,
          website: null,
          sector: match?.sector ?? (typeof A.sector === "string" ? (A.sector as string) : null),
          location: match?.location ?? null,
        });
        setChecks(res);
        setCheckState("done");
        onChecks?.(res);
      })();

      reactThenAdvance(reactionForLookup(manual));
    },
    [A.sector, reactThenAdvance, onChecks, onLookup],
  );

  const confirmMatch = (match: LookupMatch) => {
    const id = step ? stepId(step) : "business";
    const { fills, skip } = fillsFromLookup(match);
    skipIds.current = skip;
    // one write: the business name plus every field the lookup could auto-fill
    setAnswers((a) => ({ ...(a as Record<string, unknown>), [id]: match.name, ...fills }) as ScanAnswers);
    lockQ1(match, false, match.name);
  };
  const manualContinue = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const id = step ? stepId(step) : "business";
    skipIds.current = new Set(); // manual add answers Q2/Q3 itself, no skipping
    setAnswer(id, clean);
    lockQ1(null, true, clean);
  };

  const count = Math.min(idx, VALVE) + 1;

  /* ---- render ---- */
  const activeStepId = idx >= VALVE ? "valve" : step ? stepId(step) : "";

  return (
    <div className={styles.shell}>
      <div className={styles.scanCols}>
        {/* LEFT (desktop) / BELOW (mobile): the question card */}
        <div className={styles.cardCol}>
          {idx >= VALVE ? (
            <ValveCard
              value={String(A["problems_raw"] ?? "")}
              onChange={(v) => setAnswer("problems_raw", v)}
              onSubmit={goForward}
              onBack={goBack}
              stepNo={TOTAL}
              total={TOTAL}
            />
          ) : step ? (
            <div className={`glass ${styles.card}`}>
              {stepKicker(step) && <div className={styles.kicker}>{stepKicker(step)}</div>}
              <div className={styles.sageAsk} aria-hidden="true">
                <span className={styles.sageAskDot} />
                <span>Sage</span>
              </div>
              <h2 className={styles.question}>{stemText(step, answers)}</h2>
              {stepHint(step) && <p className={styles.hint}>{pipeText(stepHint(step)!, answers)}</p>}

              {reaction ? (
                <div className={styles.reactionBubble} aria-live="polite">
                  <span className={styles.sageNoteLabel}>Sage</span>
                  <span className={styles.reactionText}>{reaction}</span>
                  <button type="button" className={styles.reactionNext} onClick={skipReaction}>
                    Continue &rarr;
                  </button>
                </div>
              ) : (
                <>
                  {/* ---- Q1 live lookup ---- */}
                  {kind === "lookup" && (
                    <LookupField
                      initialQuery={String(A[stepId(step)] ?? lookup?.match?.name ?? "")}
                      onConfirm={confirmMatch}
                      onManual={manualContinue}
                    />
                  )}

                  {/* ---- single select ---- */}
                  {kind === "single" && (
                    <SingleSelect
                      st={step}
                      selected={String(A[stepId(step)] ?? "")}
                      otherText={String(A[`${stepId(step)}_other`] ?? "")}
                      onChoose={(v) => chooseSingle(step, v)}
                      onOtherText={(v) => setAnswer(`${stepId(step)}_other`, v)}
                      onContinue={() => reactThenAdvance(reactionFor(stepId(step), String(A[stepId(step)] ?? "")))}
                    />
                  )}

                  {/* ---- multi select ---- */}
                  {kind === "multi" && (
                    <MultiSelect
                      st={step}
                      has={(v) => multiHas(step, v)}
                      otherText={String(A[`${stepId(step)}_other`] ?? "")}
                      onToggle={(v) => toggleMulti(step, v)}
                      onOtherText={(v) => setAnswer(`${stepId(step)}_other`, v)}
                      onContinue={() =>
                        reactThenAdvance(
                          reactionFor(stepId(step), Array.isArray(A[stepId(step)]) ? (A[stepId(step)] as string[]) : []),
                        )
                      }
                    />
                  )}

                  {/* ---- slide (legacy shape only) ---- */}
                  {kind === "slide" && (
                    <SlideInput st={step} value={A[stepId(step)]} onChange={(n) => setAnswer(stepId(step), n)} onContinue={goForward} />
                  )}

                  {/* ---- free text ---- */}
                  {kind === "text" && (
                    <TextInput
                      st={step}
                      value={String(A[stepId(step)] ?? "")}
                      onChange={(v) => setAnswer(stepId(step), v)}
                      onContinue={goForward}
                    />
                  )}

                  <div className={styles.controls}>
                    {(idx > 0 || trailLen > 0) && (
                      <button type="button" className={styles.back} onClick={goBack}>
                        &larr; Back
                      </button>
                    )}
                    <span className={styles.count}>
                      {count} / {TOTAL}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : null}
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
  onContinue: () => void;
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
          <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 12 }} onClick={onContinue}>
            Continue
          </button>
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
  onContinue: () => void;
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
      <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 18 }} onClick={onContinue}>
        Continue
      </button>
    </>
  );
}

function fmtMoney(v: number): string {
  if (v >= 100000) return "£100k+";
  if (v >= 1000) return "£" + v / 1000 + "k";
  return "£" + v;
}
function SlideInput({ st, value, onChange, onContinue }: { st: Raw; value: unknown; onChange: (n: number) => void; onContinue: () => void }) {
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
      <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 22 }} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

function TextInput({ st, value, onChange, onContinue }: { st: Raw; value: string; onChange: (v: string) => void; onContinue: () => void }) {
  return (
    <>
      <textarea
        className={styles.textarea}
        placeholder={str(st.placeholder) ?? "Type your answer…"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={String(st.stem ?? st.question ?? "")}
      />
      <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 18 }} onClick={onContinue}>
        Continue
      </button>
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

/* ---- expression valve (the open step before unlock) ---- */
function ValveCard({
  value,
  carriedInsight,
  onChange,
  onSubmit,
  onBack,
  stepNo,
  total,
}: {
  value: string;
  carriedInsight?: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  stepNo: number;
  total: number;
}) {
  return (
    <div className={`glass ${styles.card}`}>
      <div className={styles.kicker}>One more, optional</div>
      {/* Copy JW-approval-pending */}
      <h2 className={styles.question}>Anything else leaking?</h2>
      <p className={styles.hint}>Tell Sage everything that&rsquo;s eating your time or money. The more you say, the sharper the report.</p>

      {carriedInsight && (
        <div className={styles.sageNote}>
          <span className={styles.sageNoteLabel}>Sage</span>
          <span className={styles.sageNoteText}>{carriedInsight}</span>
        </div>
      )}

      <textarea
        className={styles.textarea}
        style={{ minHeight: 128 }}
        placeholder="The bit that keeps you up at night…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Anything else leaking?"
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
        <button type="button" className="btn btn-primary btn-md" onClick={onSubmit}>
          See my leak map &rarr;
        </button>
        <button type="button" className="btn btn-ghost btn-md" onClick={onSubmit}>
          Skip, show my leak map
        </button>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.back} onClick={onBack}>
          &larr; Back
        </button>
        <span className={styles.count}>
          {stepNo} / {total}
        </span>
      </div>
    </div>
  );
}
