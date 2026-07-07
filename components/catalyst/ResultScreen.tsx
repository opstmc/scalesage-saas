"use client";

import { useEffect, useState } from "react";
import { type ScanResult, type ScanAnswers, type ScanNode } from "@/lib/catalyst";
import type { ChecksResult } from "@/lib/catalyst-api";
import LiveDiagram from "./LiveDiagram";
import {
  resolveLeak,
  resolveSystem,
  resolveTier,
  resolveBand,
  isNoFit,
  visibilityFires,
  liveFacts,
  CHIP_LABEL,
  CHIP_DOT,
  type ResolvedBand,
  type ChipTone,
} from "./meta";
import type { LookupState } from "./session";
import styles from "./catalyst.module.css";

/** Guard a contract call so an unexpected throw never blanks the result. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function useReducedMotion(): boolean {
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

// Fallback one-liners per system when lib/catalyst doesn't supply a blurb.
// JW-approval-pending.
const SYSTEM_BLURB: Record<string, string> = {
  voice: "Capture every inbound call and book it, day or night, so no lead dials the next business.",
  followup: "Chase every quote on a sequence until it converts or closes, no second chance left on the table.",
  reviews: "Turn finished jobs into 5-star proof automatically, so the next customer trusts you before they call.",
  reactivation: "Bring dormant customers back on autopilot, the cheapest revenue you already own.",
  visibility: "Get named when buyers ask AI and search for a recommendation in your area.",
  ops: "Automate quoting, invoicing and chasing so your team's hours go back to billable work.",
};

/* ---- Directional tag (self-reported) ---- */
function DirectionalTag() {
  return (
    <span className={styles.tag}>
      <span className={styles.tagDot} aria-hidden="true" />
      Directional
    </span>
  );
}
/* ---- Checked tag (live-verified fact, stated flat) ---- */
function CheckedTag() {
  return (
    <span className={`${styles.tag} ${styles.tagChecked}`}>
      <span className={styles.tagDot} aria-hidden="true" />
      We checked
    </span>
  );
}

function Band({ label, band }: { label: string; band: ResolvedBand }) {
  return (
    <div className={styles.band}>
      <div className={styles.bandHead}>
        <span className={styles.bandLabel}>{label}</span>
        <DirectionalTag />
      </div>
      {band.value && <div className={styles.bandValue}>{band.value}</div>}
      {band.formula && <div className={styles.bandFormula}>{band.formula}</div>}
      {band.note && <p className={styles.bandNote}>{band.note}</p>}
    </div>
  );
}

function ChipLegend() {
  const order: ChipTone[] = ["detected", "likely", "scan", "clear"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
      {order.map((t) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-faint)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: CHIP_DOT[t] }} />
          {CHIP_LABEL[t]}
        </span>
      ))}
    </div>
  );
}

export default function ResultScreen({
  result,
  answers,
  checks,
  lookup,
  onUnlock,
  onBookWalkthrough,
}: {
  result: ScanResult;
  answers: ScanAnswers;
  checks?: ChecksResult | null;
  lookup?: LookupState | null;
  onUnlock: () => void;
  onBookWalkthrough: () => void;
}) {
  const reduced = useReducedMotion();
  const noFit = isNoFit(result);
  const primary = safe(() => resolveLeak(result.primaryLeak), null);
  const secondary = safe(() => resolveLeak(result.secondaryLeak), null);
  const system = safe(() => resolveSystem(result.fixFirst), null);
  const tier = safe(() => resolveTier(result.tier), { key: "starter", label: "Starter" });
  const revenue = safe(() => resolveBand(result.revenueBand), { enabled: false, value: "", formula: "", note: "" });
  const time = safe(() => resolveBand(result.timeBand), { enabled: false, value: "", formula: "", note: "" });
  const showVisibility = visibilityFires(result);
  const nodes = safe<ScanNode[]>(() => (Array.isArray(result.nodes) ? result.nodes : []), []);
  const facts = safe(() => liveFacts(checks, lookup?.match ?? null), []);

  const systemBlurb = system?.blurb || (system ? SYSTEM_BLURB[system.key.toLowerCase()] ?? "" : "");

  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <DirectionalTag />
          </div>
          <h1 className="h1" style={{ marginBottom: 8 }}>
            Leak map ready.
          </h1>
          {/* Subheader — verbatim from brief */}
          <p className="lead">
            Directional scan based on your answers and a quick look at your online presence. The full Catalyst replaces
            this with deep evidence.
          </p>
        </div>
      </div>

      {/* TIER 1 + 2 — live-verified facts, stated FLAT (Q1 lookup + background checks) */}
      {facts.length > 0 && (
        <div className={`glass ${styles.block}`}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>What we already checked</span>
            <CheckedTag />
          </div>
          <ul className={styles.factList}>
            {facts.map((f, i) => (
              <li key={i} className={styles.factItem}>
                <span className={styles.factDot} aria-hidden="true" />
                {f.text}
              </li>
            ))}
          </ul>
          <p className={styles.reassureLine}>These are verified now. Everything below is directional until the full scan.</p>
        </div>
      )}

      {/* six nodes + chips (>=1 honest "Needs full scan", guaranteed by buildResult) */}
      <div className={`glass ${styles.block}`}>
        <div className={styles.blockHead}>
          <span className={styles.blockLabel}>Your leak map · six systems</span>
          <DirectionalTag />
        </div>
        <LiveDiagram answers={answers} activeStepId="result" nodes={nodes} reducedMotion={reduced} />
        <ChipLegend />
      </div>

      {noFit ? (
        /* ---- honest no-fit route ---- */
        <div className={`glass ${styles.block} ${styles.nofit}`}>
          <div className={styles.blockLabel}>Sage&rsquo;s honest read</div>
          {/* Copy JW-approval-pending */}
          <p className="lead" style={{ color: "var(--text-primary)", marginBottom: 20 }}>
            Sage doesn&rsquo;t see enough here to recommend a build yet, and we won&rsquo;t sell you something you
            don&rsquo;t need.
          </p>
          <div className={styles.ctaRow}>
            <button type="button" className="btn btn-secondary btn-lg" onClick={onUnlock}>
              Keep my leak report
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={onBookWalkthrough}>
              Talk it through
            </button>
          </div>
          <p className={styles.reassureLine}>No payment to begin. You keep the leak report either way.</p>
        </div>
      ) : (
        <>
          {/* primary + secondary leak — Directional (from what you told Sage) */}
          {(primary || secondary) && (
            <div className={`glass ${styles.block}`}>
              <div className={styles.blockHead}>
                <span className={styles.blockLabel}>Where it&rsquo;s worst</span>
                <DirectionalTag />
              </div>
              <div className={styles.leakPair}>
                <div className={`${styles.leakSlot} ${styles.leakSlotPrimary}`}>
                  <div className={styles.slotKind}>Primary leak</div>
                  <div className={styles.slotName}>{primary?.label ?? "Needs full scan"}</div>
                </div>
                <div className={styles.leakSlot}>
                  <div className={styles.slotKind}>Secondary leak</div>
                  <div className={styles.slotName}>{secondary?.label ?? "Needs full scan"}</div>
                </div>
              </div>
              <p className={styles.directionalNote}>Based on what you told Sage. The full scan confirms it in your numbers.</p>
            </div>
          )}

          {/* fix-first system + tier */}
          {system && (
            <div className={`glass ${styles.block}`}>
              <div className={styles.blockLabel}>Fix this first</div>
              <div className={styles.fixRow}>
                <span className={styles.fixName}>{system.label}</span>
                <span className={styles.tierChip}>Tier match · {tier.label}</span>
              </div>
              {systemBlurb && <p className={styles.fixBlurb}>{systemBlurb}</p>}

              {showVisibility && (
                <div className={styles.frontier}>
                  <span className={styles.sageNoteLabel}>Frontier visibility</span>
                  <span className={styles.sageNoteText}>
                    Buyers increasingly ask AI assistants for a recommendation before they ever search. Right now
                    you&rsquo;re hard to find in those answers, and closing this keeps you named as the market shifts.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* revenue + time bands — only when the scoring enables them */}
          {(revenue.enabled || time.enabled) && (
            <div className={`glass ${styles.block}`}>
              <div className={styles.blockLabel}>The maths, directional, on your answers</div>
              <div className={styles.bands}>
                {revenue.enabled && <Band label="Revenue leaking" band={revenue} />}
                {time.enabled && <Band label="Time leaking" band={time} />}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className={`glass ${styles.ctaBlock}`}>
            <h2 className="h2" style={{ marginBottom: 6 }}>
              Ready for the real numbers?
            </h2>
            {/* Copy JW-approval-pending */}
            <p className="lead" style={{ marginBottom: 20 }}>
              The full Catalyst swaps every directional estimate for your real figures, with the fix plan and the
              recovery maths, inside 24 hours.
            </p>
            <div className={styles.ctaRow}>
              <button type="button" className="btn btn-primary btn-lg" onClick={onUnlock}>
                Unlock the full leak report.
              </button>
            </div>
            {/* Reassurance — verbatim from brief */}
            <p className={styles.reassureLine}>No payment to begin. You keep the leak report either way.</p>
          </div>
        </>
      )}
    </div>
  );
}
