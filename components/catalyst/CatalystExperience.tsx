"use client";

import { useEffect, useMemo, useState } from "react";
import { buildResult, type ScanAnswers, type ScanResult } from "@/lib/catalyst";
import type { ChecksResult } from "@/lib/catalyst-api";
import SageOrb, { type OrbState } from "./SageOrb";
import ScanFlow from "./ScanFlow";
import ResultScreen from "./ResultScreen";
import UnlockForm from "./UnlockForm";
import { isNoFit } from "./meta";
import { clearSession, loadSession, saveSession, type CatalystPhase, type LookupState } from "./session";
import styles from "./catalyst.module.css";

function safeResult(answers: ScanAnswers): ScanResult {
  try {
    return buildResult(answers as never);
  } catch {
    return {} as ScanResult;
  }
}

export default function CatalystExperience() {
  const [phase, setPhase] = useState<CatalystPhase>("entry");
  const [answers, setAnswers] = useState<ScanAnswers>({} as ScanAnswers);
  const [resumeIdx, setResumeIdx] = useState(0);
  const [orb, setOrb] = useState<OrbState>("idle");
  const [progress, setProgress] = useState(0);
  const [unlockMode, setUnlockMode] = useState<"build" | "nofit">("build");
  const [lookup, setLookup] = useState<LookupState | null>(null);
  const [checks, setChecks] = useState<ChecksResult | null>(null);

  // Resume after a refresh. Runs post-mount only: sessionStorage is unavailable
  // during SSR, so both the server output and the first client render are the
  // "entry" screen, and we only diverge once mounted — no hydration mismatch.
  useEffect(() => {
    const s = loadSession();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time resume */
    if (s.lookup) setLookup(s.lookup);
    if (s.checks) setChecks(s.checks);
    if (s.phase === "scan" && Object.keys(s.answers ?? {}).length > 0) {
      setAnswers(s.answers);
      setResumeIdx(s.idx);
      setPhase("scan");
      setOrb("listening");
    } else if (s.phase === "result" || s.phase === "unlock" || s.phase === "confirmed") {
      setAnswers(s.answers);
      setPhase(s.phase === "unlock" ? "unlock" : "result");
      setOrb("handover");
      setProgress(1);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const result = useMemo<ScanResult | null>(
    () => (phase === "result" || phase === "unlock" ? safeResult(answers) : null),
    [phase, answers],
  );

  const handleComplete = (a: ScanAnswers, extras: { lookup: LookupState | null; checks: ChecksResult | null }) => {
    setAnswers(a);
    setLookup(extras.lookup);
    setChecks(extras.checks);
    setProgress(1);
    setPhase("result");
    setOrb("handover");
    saveSession({ phase: "result", answers: a, lookup: extras.lookup, checks: extras.checks });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openUnlock = () => {
    setUnlockMode(result && isNoFit(result) ? "nofit" : "build");
    setPhase("unlock");
    saveSession({ phase: "unlock" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openBook = () => {
    setUnlockMode("nofit");
    setPhase("unlock");
    saveSession({ phase: "unlock" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    clearSession();
    setAnswers({} as ScanAnswers);
    setResumeIdx(0);
    setLookup(null);
    setChecks(null);
    setProgress(0);
    setPhase("entry");
    setOrb("idle");
  };

  return (
    <div className={styles.exp}>
      {phase === "entry" ? (
        <EntryScreen
          onBegin={() => {
            setPhase("scan");
            setOrb("listening");
            saveSession({ phase: "scan" });
          }}
        />
      ) : (
        <>
          <TopBar orb={orb} progress={phase === "scan" ? progress : 1} onReset={reset} />
          {phase === "scan" && (
            <ScanFlow
              initialIdx={resumeIdx}
              initialAnswers={answers}
              initialLookup={lookup}
              initialChecks={checks}
              onComplete={handleComplete}
              onOrb={setOrb}
              onProgress={setProgress}
              onLookup={setLookup}
              onChecks={setChecks}
            />
          )}
          {phase === "result" && result && (
            <div className={styles.shell}>
              <ResultScreen result={result} answers={answers} checks={checks} lookup={lookup} onUnlock={openUnlock} onBookWalkthrough={openBook} />
            </div>
          )}
          {phase === "unlock" && result && (
            <div className={styles.shell}>
              <UnlockForm
                result={result}
                answers={answers}
                checks={checks}
                lookup={lookup}
                mode={unlockMode}
                onBack={() => {
                  setPhase("result");
                  saveSession({ phase: "result" });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---- persistent Sage presence bar (scan / result / unlock) ---- */
function TopBar({ orb, progress, onReset }: { orb: OrbState; progress: number; onReset: () => void }) {
  const labels: Record<OrbState, string> = {
    idle: "Ready",
    listening: "Listening",
    thinking: "Scanning",
    detection: "Detected",
    handover: "Ready for you",
  };
  return (
    <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", padding: "18px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SageOrb state={orb} size={44} progress={progress} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--text-headline)" }}>Sage</span>
          <span style={{ fontSize: 12, color: "var(--accent-primary)" }}>{labels[orb]}</span>
        </div>
      </div>
      <button type="button" className={styles.back} onClick={onReset} aria-label="Start the scan over">
        Start over
      </button>
    </div>
  );
}

/* ---- entry (brief §2.2) ---- */
function EntryScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div className={styles.shell}>
      <div className={styles.entry}>
        <SageOrb state="idle" size={132} />
        <div className={styles.entryCopy}>
          <div className="eyebrow" style={{ marginBottom: 0 }}>The Catalyst scan</div>
          {/* Title, verbatim from brief */}
          <h1 className="display" style={{ fontSize: "clamp(34px,5.4vw,60px)" }}>
            Sage is ready to scan your business.
          </h1>
          {/* Subline, JW-approval-pending */}
          <p className="lead" style={{ maxWidth: "44ch" }}>
            A short set of questions, mostly taps. Sage reads each answer live and takes a quick look at your online
            presence, then shows you exactly where revenue and time are leaking.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={onBegin} style={{ boxShadow: "var(--shadow-glow)" }}>
          Begin scan.
        </button>
        {/* Reassurance, verbatim from brief */}
        <p className={styles.reassure}>
          <b>No payment to begin.</b> Directional scan first. Full roadmap within 24 hours.
        </p>
      </div>
    </div>
  );
}
