"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Mini Catalyst — a 60-second, 3-tap teaser on the homepage. It gives the
 * visitor a first, directional leak number, then hands off to the full
 * /catalyst scan that measures it properly. Self-contained: the number here is
 * a transparent directional estimate, clearly labelled, never presented as a
 * measured figure. The real maths lives in the full scan (lib/catalyst.ts).
 *
 * Copy is plain and em-dash-free by design.
 */

type Option = { label: string; value: number };
type Question = { id: string; kicker: string; prompt: string; options: Option[] };

// Q1 sets a rough weekly-enquiry count and average job value by trade.
const SECTORS: { label: string; enquiries: number; job: number }[] = [
  { label: "Trades (plumbing, electrical, building)", enquiries: 15, job: 180 },
  { label: "Property and lettings", enquiries: 10, job: 500 },
  { label: "Clinics and healthcare", enquiries: 20, job: 120 },
  { label: "Hospitality", enquiries: 30, job: 45 },
  { label: "Something else", enquiries: 12, job: 200 },
];

// Q2 and Q3 each add to the share of work that leaks away.
const QUESTIONS: Question[] = [
  {
    id: "capacity",
    kicker: "Under load",
    prompt: "If your phone went unanswered for a day, what would happen?",
    options: [
      { label: "We would cope fine", value: 0.04 },
      { label: "Enquiries would pile up", value: 0.1 },
      { label: "New customers could not reach us", value: 0.16 },
    ],
  },
  {
    id: "followup",
    kicker: "Follow-up",
    prompt: "After you send a quote, what usually happens?",
    options: [
      { label: "We chase until they answer", value: 0.03 },
      { label: "We try once, then leave it", value: 0.09 },
      { label: "We usually forget", value: 0.15 },
    ],
  },
];

function round10(n: number): number {
  return Math.round(n / 10) * 10;
}

function money(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}

export default function MiniCatalyst() {
  // step 0 = sector, 1 = capacity, 2 = followup, 3 = result
  const [step, setStep] = useState(0);
  const [sector, setSector] = useState<(typeof SECTORS)[number] | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [followup, setFollowup] = useState<number | null>(null);

  const reset = () => {
    setStep(0);
    setSector(null);
    setCapacity(null);
    setFollowup(null);
  };

  const pickSector = (s: (typeof SECTORS)[number]) => {
    setSector(s);
    setStep(1);
  };
  const pickQuestion = (id: string, value: number) => {
    if (id === "capacity") setCapacity(value);
    else setFollowup(value);
    setStep((n) => n + 1);
  };

  const result =
    sector && capacity != null && followup != null
      ? (() => {
          const lossRate = Math.min(capacity + followup, 0.3);
          const weekly = sector.enquiries * sector.job * lossRate;
          const low = round10(weekly * 0.8);
          const high = round10(weekly * 1.2);
          const topLeak = capacity >= followup ? "Missed calls" : "Cold quotes";
          return { low, high, topLeak };
        })()
      : null;

  const progress = step === 0 ? 1 : step === 1 ? 2 : 3;

  return (
    <section className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">60-second check</div>
          <h2 className="h2">See where you are leaking.</h2>
          <p className="lead">
            Three quick taps. Sage gives you a first leak number, then the full scan measures it
            properly.
          </p>
        </div>

        <div
          className="glass"
          data-reveal=""
          style={{ marginTop: 28, padding: "clamp(24px, 4vw, 40px)", maxWidth: 720 }}
        >
          {step < 3 ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--accent-primary)",
                    fontWeight: 600,
                  }}
                >
                  {step === 0 ? "Your world" : QUESTIONS[step - 1].kicker}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{progress} of 3</span>
              </div>

              <h3 className="h3" style={{ marginBottom: 20 }}>
                {step === 0 ? "What do you do?" : QUESTIONS[step - 1].prompt}
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                {step === 0
                  ? SECTORS.map((s) => (
                      <OptionButton key={s.label} label={s.label} onClick={() => pickSector(s)} />
                    ))
                  : QUESTIONS[step - 1].options.map((o) => (
                      <OptionButton
                        key={o.label}
                        label={o.label}
                        onClick={() => pickQuestion(QUESTIONS[step - 1].id, o.value)}
                      />
                    ))}
              </div>
            </>
          ) : (
            result && (
              <div>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--accent-primary)",
                    fontWeight: 600,
                  }}
                >
                  Directional
                </span>
                <p style={{ margin: "12px 0 4px", fontSize: 16, color: "var(--text-muted)" }}>
                  Around
                </p>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    lineHeight: 1.05,
                    letterSpacing: "-.02em",
                    color: "var(--text-headline)",
                    fontSize: "clamp(34px, 6vw, 56px)",
                  }}
                >
                  {money(result.low)} to {money(result.high)}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 18, color: "var(--text-muted)" }}>
                  a week may be slipping away. Your biggest leak right now looks like{" "}
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {result.topLeak}
                  </span>
                  .
                </p>

                <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
                  This is a directional estimate from three answers. The full 60-second scan checks
                  your real numbers and builds your leak map.
                </p>

                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <Link href="/catalyst" className="btn btn-primary btn-lg">
                    See my full leak map →
                  </Link>
                  <button
                    type="button"
                    onClick={reset}
                    style={{
                      fontFamily: "inherit",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Start over
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <p style={{ marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
          No login, no payment. You get the leak map first.
        </p>
      </div>
    </section>
  );
}

function OptionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mini-opt"
      style={{
        fontFamily: "inherit",
        textAlign: "left",
        fontSize: 16,
        fontWeight: 500,
        color: "var(--text-primary)",
        background: "rgba(244,246,249,0.03)",
        border: "1px solid var(--border-hair)",
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color .2s ease, background .2s ease, transform .12s ease",
      }}
    >
      {label}
    </button>
  );
}
