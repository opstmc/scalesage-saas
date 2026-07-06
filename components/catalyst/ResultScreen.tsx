"use client";

import { type ScanResult, type ScanAnswers } from "@/lib/catalyst";
import LeakMap, { ChipLegend } from "./LeakMap";
import {
  resolveLeak,
  resolveSystem,
  resolveTier,
  resolveBand,
  isNoFit,
  visibilityFires,
  type ResolvedBand,
} from "./meta";
import styles from "./catalyst.module.css";

/** Guard a contract call so an unexpected throw never blanks the result. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// Fallback one-liners per system when lib/catalyst doesn't supply a blurb.
// JW to approve.
const SYSTEM_BLURB: Record<string, string> = {
  voice: "Capture every inbound call and book it, day or night, so no lead dials the next business.",
  followup: "Chase every quote on a sequence until it converts or closes — no second chance left on the table.",
  reviews: "Turn finished jobs into 5-star proof automatically, so the next customer trusts you before they call.",
  reactivation: "Bring dormant customers back on autopilot — the cheapest revenue you already own.",
  visibility: "Get named when buyers ask AI and search for a recommendation in your area.",
  ops: "Automate quoting, invoicing and chasing so your team's hours go back to billable work.",
};

function Band({ label, band }: { label: string; band: ResolvedBand }) {
  return (
    <div className={styles.band}>
      <div className={styles.bandHead}>
        <span className={styles.bandLabel}>{label}</span>
        <span className={styles.tag}>
          <span className={styles.tagDot} aria-hidden="true" />
          Directional
        </span>
      </div>
      {band.value && <div className={styles.bandValue}>{band.value}</div>}
      {band.formula && <div className={styles.bandFormula}>{band.formula}</div>}
      {band.note && <p className={styles.bandNote}>{band.note}</p>}
    </div>
  );
}

export default function ResultScreen({
  result,
  answers,
  onUnlock,
  onBookWalkthrough,
}: {
  result: ScanResult;
  answers: ScanAnswers;
  onUnlock: () => void;
  onBookWalkthrough: () => void;
}) {
  const noFit = isNoFit(result);
  const primary = safe(() => resolveLeak(result.primaryLeak), null);
  const secondary = safe(() => resolveLeak(result.secondaryLeak), null);
  const system = safe(() => resolveSystem(result.fixFirst), null);
  const tier = safe(() => resolveTier(result.tier), { key: "starter", label: "Starter" });
  const revenue = safe(() => resolveBand(result.revenueBand), { enabled: false, value: "", formula: "", note: "" });
  const time = safe(() => resolveBand(result.timeBand), { enabled: false, value: "", formula: "", note: "" });
  const showVisibility = visibilityFires(result);

  const systemBlurb = system?.blurb || (system ? SYSTEM_BLURB[system.key.toLowerCase()] ?? "" : "");

  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <span className={styles.tag}>
              <span className={styles.tagDot} aria-hidden="true" />
              Directional
            </span>
          </div>
          <h1 className="h1" style={{ marginBottom: 8 }}>
            Leak map ready.
          </h1>
          <p className="lead">
            Here&rsquo;s where Sage sees revenue and time leaking, and what to close first. Directional now — the full
            report puts real numbers on it within 24 hours.
          </p>
        </div>
      </div>

      {/* six nodes + chips */}
      <div className={`glass ${styles.block}`}>
        <div className={styles.blockLabel}>Your leak map · six systems checked</div>
        <LeakMap answers={answers} variant="result" />
        <ChipLegend />
      </div>

      {noFit ? (
        /* ---- honest no-fit route (brief §2.8) ---- */
        <div className={`glass ${styles.block} ${styles.nofit}`}>
          <div className={styles.blockLabel}>Sage&rsquo;s honest read</div>
          <p className="lead" style={{ color: "var(--text-primary)", marginBottom: 20 }}>
            Sage doesn&rsquo;t see enough here to recommend a build yet, and we won&rsquo;t sell you something you
            don&rsquo;t need.
          </p>
          <div className={styles.ctaRow}>
            <button type="button" className="btn btn-secondary btn-lg" onClick={onUnlock}>
              Keep my leak report
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={onBookWalkthrough}>
              Book a walkthrough
            </button>
          </div>
          <p className={styles.reassureLine}>
            No payment to begin. You keep the leak report either way.
          </p>
        </div>
      ) : (
        <>
          {/* primary + secondary leak */}
          {(primary || secondary) && (
            <div className={`glass ${styles.block}`}>
              <div className={styles.blockLabel}>Where it&rsquo;s worst</div>
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
                  <span className={styles.sageNoteLabel}>Frontier Visibility</span>
                  <span className={styles.sageNoteText}>
                    Buyers increasingly ask AI assistants for a recommendation before they ever search. Right now you&rsquo;re
                    hard to find in those answers — closing this keeps you named as the market shifts.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* revenue + time bands — only when the scoring enables them */}
          {(revenue.enabled || time.enabled) && (
            <div className={`glass ${styles.block}`}>
              <div className={styles.blockLabel}>The maths — directional, on your answers</div>
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
            <p className="lead" style={{ marginBottom: 20 }}>
              The full leak report swaps every &ldquo;directional&rdquo; estimate for your real figures, with the fix
              plan and the recovery maths.
            </p>
            <div className={styles.ctaRow}>
              <button type="button" className="btn btn-primary btn-lg" onClick={onUnlock}>
                Unlock the full leak report.
              </button>
            </div>
            <p className={styles.reassureLine}>No payment to begin. You keep the leak report either way.</p>
          </div>
        </>
      )}
    </div>
  );
}
