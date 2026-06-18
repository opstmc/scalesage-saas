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
  <span style={{ width: size, height: size, borderRadius: 9, background: "var(--accent-primary)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px color-mix(in srgb,var(--accent-primary) 60%,transparent)" }}>
    <span className="diamond" style={{ width: 11, height: 11, background: "var(--on-accent)", borderRadius: 2 }} />
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
        background: tinted ? "color-mix(in srgb,var(--accent-primary) 12%,var(--bg-elevated))" : "var(--bg-elevated)",
        border: tinted ? "1px solid var(--border-subtle)" : "1px solid var(--border-hair)",
        borderRadius: 8,
        padding: "6px 11px",
      }}
    >
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--text-headline)" }}>{value}</span>
    </span>
  );
}

const eyebrowSm: React.CSSProperties = { fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 };
const accentBtn: React.CSSProperties = { fontFamily: "inherit", fontWeight: 600, fontSize: 16, color: "var(--on-accent)", background: "var(--accent-primary)", border: "none", borderRadius: 12, padding: "14px 26px", cursor: "pointer" };

export default function CatalystJourney() {
  const { closeJourney } = useJourney();
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [sliderValue, setSliderValue] = useState(8);
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

  return (
    <div className="journey" role="dialog" aria-modal="true" aria-label="Catalyst diagnostic">
      <div style={{ height: 3, background: "var(--border-hair)", width: "100%" }}>
        <div style={{ height: "100%", background: "var(--accent-primary)", transition: "width .5s cubic-bezier(.2,.7,.2,1)", width: `${progressPct}%`, boxShadow: "0 0 12px var(--accent-primary)" }} />
      </div>

      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="diamond" style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent-primary)" }} />
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-.01em", color: "var(--text-headline)" }}>Sage</span>
          <span style={{ ...eyebrowSm, color: "var(--text-faint)", border: "1px solid var(--border-hair)", borderRadius: 20, padding: "3px 9px", marginLeft: 4 }}>Catalyst diagnostic</span>
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
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "4px 16px 16px 16px", padding: "20px 22px" }}>
                  <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "var(--text-primary)" }}>This isn&rsquo;t a form — it&rsquo;s a scan. I&rsquo;ll ask a few sharp questions, then show you exactly where your business is leaking revenue.</p>
                  <p style={{ margin: "14px 0 0", fontSize: 18, lineHeight: 1.5, color: "var(--text-muted)" }}>About 60 seconds. No login, no payment — you get the leak map first.</p>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 24px", margin: "0 0 30px 48px" }}>
                {["GDPR-safe & encrypted", "We never sell or train external AI on your data", "Resume anytime"].map((s) => (
                  <span key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--text-muted)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)" }} />
                    {s}
                  </span>
                ))}
              </div>
              <button type="button" onClick={begin} style={{ ...accentBtn, marginLeft: 48, padding: "15px 28px", boxShadow: "var(--shadow-glow)" }}>Begin the scan →</button>
            </div>
          )}

          {/* QUESTION */}
          {phase === "question" && (
            <div style={{ animation: "ssFade .4s ease" }}>
              <div style={{ ...eyebrowSm, fontSize: 12, letterSpacing: ".12em", color: "var(--accent-primary)", marginBottom: 14 }}>{step.kicker}</div>
              <h2 style={{ fontWeight: 600, fontSize: "clamp(26px,4vw,38px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: "0 0 10px", color: "var(--text-headline)", textWrap: "balance" }}>{step.question}</h2>
              <p style={{ fontSize: 16.5, color: "var(--text-muted)", margin: "0 0 30px" }}>{step.hint}</p>

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
                          border: `1px solid ${sel ? "var(--accent-primary)" : "var(--border-hair)"}`,
                          boxShadow: sel ? "0 0 0 3px color-mix(in srgb,var(--accent-primary) 16%,transparent)" : undefined,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontWeight: 500, fontSize: 16, color: "var(--text-headline)" }}>{opt.label}</span>
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              flex: "none",
                              border: `1px solid ${sel ? "var(--accent-primary)" : "var(--border-hair)"}`,
                              background: sel ? "var(--accent-primary)" : "transparent",
                              boxShadow: sel ? "inset 0 0 0 2px var(--bg-elevated)" : undefined,
                            }}
                          />
                        </span>
                        {opt.desc && <span style={{ display: "block", marginTop: 6, fontSize: 13.5, color: "var(--text-faint)", lineHeight: 1.4 }}>{opt.desc}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {step.inputType === "slide" && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-hair)", borderRadius: 16, padding: 32 }}>
                  <div style={{ fontWeight: 600, fontSize: "clamp(34px,6vw,52px)", letterSpacing: "-.03em", color: "var(--accent-primary)", marginBottom: 24 }}>{sliderLabel}</div>
                  <input type="range" min={step.min} max={step.max} step={step.step} value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} className="journey-range" aria-label={step.question} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--text-faint)" }}>
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
                  <button type="button" onClick={back} style={{ background: "transparent", border: "none", color: "var(--text-faint)", fontSize: 14.5, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                )}
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{idx + 1} / {STEPS.length}</span>
              </div>

              {learned.length > 0 && (
                <div style={{ marginTop: 40, borderTop: "1px dashed var(--border-hair)", paddingTop: 22 }}>
                  <div style={{ ...eyebrowSm, color: "var(--text-faint)", marginBottom: 12 }}>Here&rsquo;s what we just learned about you</div>
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
                  <div style={{ ...eyebrowSm, color: "var(--accent-primary)", marginBottom: 8 }}>Your leak map</div>
                  <h2 style={{ fontWeight: 600, fontSize: "clamp(24px,3.6vw,34px)", lineHeight: 1.12, letterSpacing: "-.02em", margin: 0, color: "var(--text-headline)", textWrap: "balance" }}>{snapshot.title}</h2>
                </div>
              </div>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-hair)", borderRadius: 16, padding: "8px 24px", marginBottom: 26 }}>
                {snapshot.lines.map((line) => (
                  <div key={line.tag} style={{ display: "flex", gap: 14, padding: "18px 0", borderBottom: "1px solid var(--border-hair)" }}>
                    <span style={{ fontSize: 12, color: "var(--accent-primary)", paddingTop: 3, flex: "none", fontWeight: 600 }}>{line.tag}</span>
                    <span style={{ fontSize: 16, lineHeight: 1.5, color: "var(--text-primary)" }}>{line.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "linear-gradient(180deg,color-mix(in srgb,var(--accent-primary) 7%,var(--bg-elevated)),var(--bg-elevated))", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ ...eyebrowSm, color: "var(--text-faint)" }}>Recommended next step</span>
                  <span style={{ fontSize: 11, letterSpacing: ".06em", color: "var(--accent-primary)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: "2px 9px" }}>{snapshot.tierLabel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 26, letterSpacing: "-.02em", color: "var(--text-headline)" }}>{snapshot.track}</span>
                  <span style={{ fontWeight: 600, fontSize: 26, color: "var(--accent-primary)" }}>{snapshot.price}</span>
                </div>
                <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 22px", lineHeight: 1.55 }}>{snapshot.note}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <button type="button" onClick={closeJourney} style={{ ...accentBtn, boxShadow: "var(--shadow-glow)" }}>{snapshot.ctaLabel}</button>
                  <button type="button" onClick={restart} style={{ fontFamily: "inherit", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", background: "transparent", border: "1px solid var(--border-hair)", borderRadius: 12, padding: "14px 22px", cursor: "pointer" }}>Start over</button>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ ...eyebrowSm, color: "var(--text-faint)", marginBottom: 12 }}>What we captured — pre-fills your diagnostic</div>
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
