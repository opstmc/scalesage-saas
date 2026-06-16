"use client";

import { useEffect, useState } from "react";
import { useJourney } from "./JourneyProvider";
import {
  STEPS,
  type Answers,
  buildSnapshot,
  fmtMoney,
  learnedChips,
  scaleLabel,
} from "@/lib/journey";

type Phase = "intro" | "question" | "snapshot";

const SageIcon = ({ size = 34 }: { size?: number }) => (
  <span
    style={{ width: size, height: size, borderRadius: 9, background: "var(--accent)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <span className="diamond" style={{ width: 11, height: 11, background: "#fff", borderRadius: 2 }} />
  </span>
);

function LearnedChip({ label, value, tinted }: { label: string; value: string; tinted: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13,
        background: tinted ? "color-mix(in srgb,var(--accent) 7%,var(--surface))" : "var(--surface)",
        border: tinted ? "1px solid color-mix(in srgb,var(--accent) 22%,var(--hairline))" : "1px solid var(--hairline)",
        borderRadius: 8,
        padding: "6px 11px",
      }}
    >
      <span style={{ color: "var(--ink-faint)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{value}</span>
    </span>
  );
}

export default function CatalystJourney() {
  const { closeJourney } = useJourney();
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [sliderValue, setSliderValue] = useState(12);
  const [textValue, setTextValue] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeJourney();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeJourney]);

  const goTo = (i: number, ans: Answers) => {
    const step = STEPS[i];
    setIdx(i);
    if (step.inputType === "slide") setSliderValue(ans[step.id] != null ? Number(ans[step.id]) : step.default ?? 0);
    if (step.inputType === "type") setTextValue(ans[step.id] != null ? String(ans[step.id]) : "");
  };

  const begin = () => {
    setPhase("question");
    goTo(0, answers);
  };
  const restart = () => {
    setAnswers({});
    setTextValue("");
    setPhase("question");
    goTo(0, {});
  };
  const back = () => {
    if (idx > 0) goTo(idx - 1, answers);
  };
  const advance = (ans: Answers) => {
    if (idx < STEPS.length - 1) goTo(idx + 1, ans);
    else setPhase("snapshot");
  };
  const recordAndAdvance = (val: string | number) => {
    const step = STEPS[idx];
    const next = { ...answers, [step.id]: val };
    setAnswers(next);
    advance(next);
  };
  const continueStep = () => {
    const step = STEPS[idx];
    if (step.inputType === "slide") recordAndAdvance(sliderValue);
    else if (step.inputType === "type") recordAndAdvance(textValue.trim() || "—");
  };

  const step = STEPS[idx] || STEPS[0];
  const selectedVal = answers[step.id];
  const learned = learnedChips(answers);
  const sliderLabel = step.money ? fmtMoney(sliderValue) : scaleLabel(sliderValue);
  const progressPct = Math.round(((idx + (phase === "snapshot" ? 1 : 0)) / STEPS.length) * 100);
  const snapshot = phase === "snapshot" ? buildSnapshot(answers) : null;

  const accentBtn: React.CSSProperties = { fontFamily: "Inter,sans-serif", fontWeight: 500, fontSize: 16, color: "#fff", background: "var(--accent)", border: "none", borderRadius: 11, padding: "14px 26px", cursor: "pointer" };

  return (
    <div className="journey" role="dialog" aria-modal="true" aria-label="Catalyst Diagnostic">
      <div style={{ height: 3, background: "var(--hairline)", width: "100%" }}>
        <div style={{ height: "100%", background: "var(--accent)", transition: "width .5s cubic-bezier(.2,.7,.2,1)", width: `${progressPct}%` }} />
      </div>

      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="diamond" style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-.01em" }}>Sage</span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", border: "1px solid var(--hairline)", borderRadius: 20, padding: "3px 9px", marginLeft: 4 }}>Catalyst Diagnostic</span>
        </div>
        <button type="button" className="icon-btn" onClick={closeJourney} aria-label="Close diagnostic">×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: 760, width: "100%", margin: "auto", padding: "24px 24px 48px" }}>

          {/* INTRO */}
          {phase === "intro" && (
            <div style={{ animation: "ssFade .4s ease" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 28 }}>
                <SageIcon />
                <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px 16px 16px 16px", padding: "20px 22px" }}>
                  <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>Hi — I&rsquo;m Sage. Most teams hand you a form. Instead, I&rsquo;ll ask you a few sharp questions, then show you what we already see leaking in your business.</p>
                  <p style={{ margin: "14px 0 0", fontSize: 18, lineHeight: 1.5, color: "var(--ink-soft)" }}>Takes about 60 seconds. No login, no payment — you get value first.</p>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 24px", margin: "0 0 30px 48px" }}>
                {["GDPR-safe & encrypted", "We never sell or train external AI on your data", "Resume anytime"].map((s) => (
                  <span key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--ink-soft)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                    {s}
                  </span>
                ))}
              </div>
              <button type="button" onClick={begin} style={{ ...accentBtn, marginLeft: 48, padding: "15px 28px", boxShadow: "0 10px 26px -10px rgba(26,55,224,.5)" }}>Begin diagnostic →</button>
            </div>
          )}

          {/* QUESTION */}
          {phase === "question" && (
            <div style={{ animation: "ssFade .4s ease" }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>{step.kicker}</div>
              <h2 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(26px,4vw,38px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: "0 0 10px", textWrap: "balance" }}>{step.question}</h2>
              <p style={{ fontSize: 16.5, color: "var(--ink-soft)", margin: "0 0 30px" }}>{step.hint}</p>

              {step.inputType === "choose" && (
                <div className="journey-choose">
                  {step.options!.map((opt) => {
                    const sel = selectedVal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className="journey-option"
                        onClick={() => recordAndAdvance(opt.value)}
                        style={{
                          border: `1px solid ${sel ? "var(--accent)" : "var(--hairline)"}`,
                          boxShadow: sel ? "0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent)" : undefined,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontWeight: 500, fontSize: 16, color: "var(--ink)" }}>{opt.label}</span>
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              flex: "none",
                              border: `1px solid ${sel ? "var(--accent)" : "var(--hairline)"}`,
                              background: sel ? "var(--accent)" : "transparent",
                              boxShadow: sel ? "inset 0 0 0 2px #fff" : undefined,
                            }}
                          />
                        </span>
                        {opt.desc && <span style={{ display: "block", marginTop: 6, fontSize: 13.5, color: "var(--ink-faint)", lineHeight: 1.4 }}>{opt.desc}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {step.inputType === "slide" && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 16, padding: 32 }}>
                  <div className="font-display" style={{ fontWeight: 600, fontSize: "clamp(34px,6vw,52px)", letterSpacing: "-.03em", color: "var(--accent)", marginBottom: 24 }}>{sliderLabel}</div>
                  <input type="range" min={step.min} max={step.max} step={step.step} value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} className="journey-range" aria-label={step.question} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>
                    <span>{step.minLabel}</span>
                    <span>{step.maxLabel}</span>
                  </div>
                  <button type="button" onClick={continueStep} style={{ ...accentBtn, marginTop: 26 }}>Continue →</button>
                </div>
              )}

              {step.inputType === "type" && (
                <div>
                  <textarea value={textValue} onChange={(e) => setTextValue(e.target.value)} rows={3} placeholder="Type your answer…" className="journey-textarea" aria-label={step.question} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 14 }}>
                    {step.chips!.map((c) => (
                      <button key={c} type="button" className="journey-chip" onClick={() => setTextValue(c)}>{c}</button>
                    ))}
                  </div>
                  <button type="button" onClick={continueStep} style={{ ...accentBtn, marginTop: 24 }}>Continue →</button>
                </div>
              )}

              <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 18 }}>
                {idx > 0 && (
                  <button type="button" onClick={back} style={{ background: "transparent", border: "none", color: "var(--ink-faint)", fontSize: 14.5, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>← Back</button>
                )}
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{idx + 1} / {STEPS.length}</span>
              </div>

              {learned.length > 0 && (
                <div style={{ marginTop: 40, borderTop: "1px dashed var(--hairline)", paddingTop: 22 }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 12 }}>Here&rsquo;s what we just learned about you</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {learned.map((item) => (
                      <LearnedChip key={item.label} label={item.label} value={item.value} tinted />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SNAPSHOT */}
          {phase === "snapshot" && snapshot && (
            <div style={{ animation: "ssFade .45s ease" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 26 }}>
                <SageIcon />
                <div>
                  <div className="mono" style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>Your snapshot</div>
                  <h2 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(24px,3.6vw,34px)", lineHeight: 1.12, letterSpacing: "-.02em", margin: 0, textWrap: "balance" }}>{snapshot.title}</h2>
                </div>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 16, padding: "8px 24px", marginBottom: 26 }}>
                {snapshot.lines.map((line) => (
                  <div key={line.tag} style={{ display: "flex", gap: 14, padding: "18px 0", borderBottom: "1px solid var(--hairline)" }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--accent)", paddingTop: 3, flex: "none" }}>{line.tag}</span>
                    <span style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink)" }}>{line.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "linear-gradient(180deg,color-mix(in srgb,var(--accent) 5%,var(--surface)),var(--surface))", border: "1px solid color-mix(in srgb,var(--accent) 24%,var(--hairline))", borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Recommended next step</span>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: ".06em", color: "var(--accent)", border: "1px solid color-mix(in srgb,var(--accent) 30%,transparent)", borderRadius: 20, padding: "2px 9px" }}>{snapshot.tierLabel} tier match</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <span className="font-display" style={{ fontWeight: 600, fontSize: 26, letterSpacing: "-.02em" }}>{snapshot.track}</span>
                  <span className="font-display" style={{ fontWeight: 600, fontSize: 26, color: "var(--accent)" }}>{snapshot.price}</span>
                </div>
                <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px", lineHeight: 1.55 }}>{snapshot.note}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <button type="button" onClick={closeJourney} style={{ ...accentBtn, boxShadow: "0 10px 26px -12px rgba(26,55,224,.5)" }}>{snapshot.ctaLabel}</button>
                  <button type="button" onClick={restart} style={{ fontFamily: "Inter,sans-serif", fontWeight: 500, fontSize: 16, color: "var(--ink)", background: "transparent", border: "1px solid var(--hairline)", borderRadius: 11, padding: "14px 22px", cursor: "pointer" }}>Start over</button>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 12 }}>What we captured — pre-fills your diagnostic</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {learned.map((item) => (
                    <LearnedChip key={item.label} label={item.label} value={item.value} tinted={false} />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
