"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STEPS, type ScanAnswers } from "@/lib/catalyst";
import type { OrbState } from "./SageOrb";
import LeakMap from "./LeakMap";
import { saveSession } from "./session";
import styles from "./catalyst.module.css";

/* ---- tolerant view of a step (see lib/catalyst.ts contract) ------------- */
interface UIOption {
  value: string;
  label: string;
  desc?: string;
}
interface UIStep {
  id: string;
  kicker?: string;
  question: string;
  hint?: string;
  insight?: string;
  inputType: "choose" | "multi" | "slide" | "type";
  multi?: boolean;
  options?: UIOption[];
  allowOther?: boolean;
  other?: boolean;
  chips?: string[];
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  minLabel?: string;
  maxLabel?: string;
  money?: boolean;
  placeholder?: string;
}

const UI_STEPS = STEPS as unknown as UIStep[];
const VALVE = UI_STEPS.length; // the expression valve sits after the last real step
const OTHER = "__other__";
const BEAT_MS = 850; // 700-900ms "thinking" beat (brief §2.5)

const isMulti = (s: UIStep) => s.inputType === "multi" || s.multi === true;
const allowsOther = (s: UIStep) => s.allowOther === true || s.other === true;

function fmtMoney(v: number): string {
  if (v >= 100000) return "£100k+";
  if (v >= 1000) return "£" + v / 1000 + "k";
  return "£" + v;
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

export default function ScanFlow({
  initialIdx = 0,
  initialAnswers,
  onComplete,
  onOrb,
}: {
  initialIdx?: number;
  initialAnswers?: ScanAnswers;
  onComplete: (answers: ScanAnswers) => void;
  onOrb?: (state: OrbState) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(Math.min(Math.max(0, initialIdx), VALVE));
  const [answers, setAnswers] = useState<ScanAnswers>(initialAnswers ?? ({} as ScanAnswers));
  const [beat, setBeat] = useState<string | null>(null);

  // Latest answers, read at completion time from timeouts/events (not render).
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const timers = useRef<number[]>([]);
  const pushDepth = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  // ---- persistence: refresh never resets (brief §2.5) ----
  useEffect(() => {
    saveSession({ phase: "scan", idx, answers });
  }, [idx, answers]);

  // ---- orb choreography ----
  const setOrb = useCallback((s: OrbState) => onOrb?.(s), [onOrb]);
  useEffect(() => {
    if (beat) setOrb("thinking");
    else setOrb("listening");
  }, [beat, idx, setOrb]);

  // ---- browser back / forward walks the questions, answers kept ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.history.replaceState({ ...window.history.state, catalystIdx: idx }, "");
    } catch {
      /* ignore */
    }
    const onPop = (e: PopStateEvent) => {
      const s = e.state as { catalystIdx?: number } | null;
      if (s && typeof s.catalystIdx === "number") {
        clearTimers();
        setBeat(null);
        setIdx(Math.min(Math.max(0, s.catalystIdx), VALVE));
        setOrb("listening");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step: UIStep | undefined = UI_STEPS[idx];
  // the insight carried onto the current card = the line from the step we left
  const carriedInsight = idx > 0 ? UI_STEPS[idx - 1]?.insight : undefined;

  // ---- navigation ----
  const goForward = useCallback(() => {
    clearTimers();
    // leaving the valve (or the last step) completes the scan
    if (idx >= VALVE) {
      setOrb("handover");
      onComplete(answersRef.current);
      return;
    }
    const next = idx + 1;
    const insight = UI_STEPS[idx]?.insight || "Sage is reading that."; // JW to approve fallback
    const commit = () => {
      try {
        window.history.pushState({ ...window.history.state, catalystIdx: next }, "");
        pushDepth.current += 1;
      } catch {
        /* ignore */
      }
      setBeat(null);
      setIdx(next);
      setOrb("listening");
    };
    if (reduced) {
      setOrb("detection");
      commit();
      return;
    }
    setOrb("detection");
    timers.current.push(window.setTimeout(() => setBeat(insight), 200));
    timers.current.push(window.setTimeout(commit, BEAT_MS));
  }, [idx, onComplete, reduced, setOrb]);

  const goBack = useCallback(() => {
    clearTimers();
    setBeat(null);
    if (pushDepth.current > 0 && typeof window !== "undefined") {
      pushDepth.current -= 1;
      window.history.back(); // fires popstate -> restores prior idx, answers kept
      return;
    }
    setIdx((i) => Math.max(0, i - 1));
    setOrb("listening");
  }, [setOrb]);

  // ---- answer helpers (answers is the single source of truth) ----
  // Access answers through a plain-record view so we don't depend on the exact
  // shape lib/catalyst gives ScanAnswers (index type vs. named interface).
  const A = answers as unknown as Record<string, unknown>;
  const setAnswer = (id: string, val: unknown) =>
    setAnswers((a) => ({ ...(a as unknown as Record<string, unknown>), [id]: val }) as ScanAnswers);

  const chooseSingle = (s: UIStep, value: string) => {
    setAnswer(s.id, value);
    if (value === OTHER) return; // reveal the "Other" field, wait for Continue
    // advance on the next tick so the committed answer is reflected in the map
    timers.current.push(window.setTimeout(goForward, reduced ? 0 : 60));
  };

  const toggleMulti = (s: UIStep, value: string) => {
    setAnswers((a) => {
      const rec = a as unknown as Record<string, unknown>;
      const cur = Array.isArray(rec[s.id]) ? [...(rec[s.id] as string[])] : [];
      const at = cur.indexOf(value);
      if (at >= 0) cur.splice(at, 1);
      else cur.push(value);
      return { ...rec, [s.id]: cur } as ScanAnswers;
    });
  };

  const multiHas = (s: UIStep, value: string) =>
    Array.isArray(A[s.id]) && (A[s.id] as string[]).includes(value);

  const progress = Math.round((Math.min(idx, VALVE) / VALVE) * 100);

  return (
    <div>
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.shell}>
        <div className={styles.scanGrid}>
          {/* left column: mobile strip + question card */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <LeakMap answers={answers} variant="strip" />
            </div>

            {beat ? (
              <div className={`glass ${styles.card}`}>
                <div className={styles.beat} aria-live="polite">
                  <span className={styles.beatDots} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <p className={styles.beatLine}>{beat}</p>
                </div>
              </div>
            ) : idx >= VALVE ? (
              <ValveCard
                value={String(A["problems_raw"] ?? "")}
                carriedInsight={UI_STEPS[UI_STEPS.length - 1]?.insight}
                onChange={(v) => setAnswer("problems_raw", v)}
                onSubmit={goForward}
                onBack={goBack}
                stepNo={VALVE + 1}
                total={VALVE + 1}
              />
            ) : step ? (
              <div className={`glass ${styles.card}`}>
                {step.kicker && <div className={styles.kicker}>{step.kicker}</div>}
                <h2 className={styles.question}>{step.question}</h2>
                {step.hint && <p className={styles.hint}>{step.hint}</p>}

                {carriedInsight && (
                  <div className={styles.sageNote}>
                    <span className={styles.sageNoteLabel}>Sage</span>
                    <span className={styles.sageNoteText}>{carriedInsight}</span>
                  </div>
                )}

                {/* ---- choose (single) ---- */}
                {step.inputType === "choose" && !isMulti(step) && (
                  <>
                    <div className={`${styles.options} ${(step.options?.length ?? 0) <= 1 ? styles.optionsOne : ""}`}>
                      {(step.options ?? []).map((opt) => (
                        <OptionButton
                          key={opt.value}
                          opt={opt}
                          selected={A[step.id] === opt.value}
                          multi={false}
                          onClick={() => chooseSingle(step, opt.value)}
                        />
                      ))}
                      {allowsOther(step) && (
                        <OptionButton
                          opt={{ value: OTHER, label: "Something else" }}
                          selected={A[step.id] === OTHER}
                          multi={false}
                          onClick={() => chooseSingle(step, OTHER)}
                        />
                      )}
                    </div>
                    {A[step.id] === OTHER && (
                      <div className={styles.otherWrap}>
                        <textarea
                          className={styles.textarea}
                          style={{ minHeight: 84 }}
                          placeholder="Tell Sage in your own words…"
                          value={String(A[`${step.id}_other`] ?? "")}
                          onChange={(e) => setAnswer(`${step.id}_other`, e.target.value)}
                          aria-label="Describe your answer"
                        />
                        <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 12 }} onClick={goForward}>
                          Continue
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ---- multi (pick all that apply) ---- */}
                {isMulti(step) && (
                  <>
                    <div className={styles.options}>
                      {(step.options ?? []).map((opt) => (
                        <OptionButton
                          key={opt.value}
                          opt={opt}
                          selected={multiHas(step, opt.value)}
                          multi
                          onClick={() => toggleMulti(step, opt.value)}
                        />
                      ))}
                      {allowsOther(step) && (
                        <OptionButton
                          opt={{ value: OTHER, label: "Something else" }}
                          selected={multiHas(step, OTHER)}
                          multi
                          onClick={() => toggleMulti(step, OTHER)}
                        />
                      )}
                    </div>
                    {multiHas(step, OTHER) && (
                      <div className={styles.otherWrap}>
                        <textarea
                          className={styles.textarea}
                          style={{ minHeight: 84 }}
                          placeholder="Tell Sage in your own words…"
                          value={String(A[`${step.id}_other`] ?? "")}
                          onChange={(e) => setAnswer(`${step.id}_other`, e.target.value)}
                          aria-label="Describe your answer"
                        />
                      </div>
                    )}
                    <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 18 }} onClick={goForward}>
                      Continue
                    </button>
                  </>
                )}

                {/* ---- slide ---- */}
                {step.inputType === "slide" && (
                  <div className={styles.slider}>
                    <div className={styles.sliderValue}>
                      {step.money
                        ? fmtMoney(Number(A[step.id] ?? step.default ?? step.min ?? 0))
                        : Number(A[step.id] ?? step.default ?? step.min ?? 0)}
                    </div>
                    <input
                      type="range"
                      className={styles.range}
                      min={step.min ?? 0}
                      max={step.max ?? 100}
                      step={step.step ?? 1}
                      value={Number(A[step.id] ?? step.default ?? step.min ?? 0)}
                      onChange={(e) => setAnswer(step.id, Number(e.target.value))}
                      aria-label={step.question}
                    />
                    <div className={styles.rangeEnds}>
                      <span>{step.minLabel}</span>
                      <span>{step.maxLabel}</span>
                    </div>
                    <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 22 }} onClick={goForward}>
                      Continue
                    </button>
                  </div>
                )}

                {/* ---- type ---- */}
                {step.inputType === "type" && (
                  <>
                    <textarea
                      className={styles.textarea}
                      placeholder={step.placeholder ?? "Type your answer…"}
                      value={String(A[step.id] ?? "")}
                      onChange={(e) => setAnswer(step.id, e.target.value)}
                      aria-label={step.question}
                    />
                    {step.chips && step.chips.length > 0 && (
                      <div className={styles.chipRow}>
                        {step.chips.map((c) => (
                          <button key={c} type="button" className="chip" onClick={() => setAnswer(step.id, c)}>
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" className="btn btn-primary btn-md" style={{ marginTop: 18 }} onClick={goForward}>
                      Continue
                    </button>
                  </>
                )}

                <div className={styles.controls}>
                  {idx > 0 && (
                    <button type="button" className={styles.back} onClick={goBack}>
                      ← Back
                    </button>
                  )}
                  <span className={styles.count}>
                    {idx + 1} / {VALVE + 1}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* right rail: live leak map (desktop) */}
          <div className={styles.rail}>
            <LeakMap answers={answers} variant="rail" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- option button ---- */
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
    <button
      type="button"
      className={`${styles.option} ${selected ? styles.optionSel : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={styles.optionRow}>
        <span className={styles.optionLabel}>{opt.label}</span>
        <span className={`${styles.tick} ${selected ? styles.tickSel : ""} ${multi ? styles.tickBox : ""}`} aria-hidden="true" />
      </span>
      {opt.desc && <span className={styles.optionDesc}>{opt.desc}</span>}
    </button>
  );
}

/* ---- expression valve (brief §2.6) ---- */
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
          See my leak map →
        </button>
        <button type="button" className="btn btn-ghost btn-md" onClick={onSubmit}>
          Skip — show my leak map
        </button>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.back} onClick={onBack}>
          ← Back
        </button>
        <span className={styles.count}>
          {stepNo} / {total}
        </span>
      </div>
    </div>
  );
}
