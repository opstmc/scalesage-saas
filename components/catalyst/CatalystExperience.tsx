"use client";

import { useEffect, useMemo, useState } from "react";
import { buildResult, type ScanAnswers, type ScanResult } from "@/lib/catalyst";
import SageOrb, { type OrbState } from "./SageOrb";
import ScanFlow from "./ScanFlow";
import ResultScreen from "./ResultScreen";
import UnlockForm from "./UnlockForm";
import { isNoFit } from "./meta";
import { clearSession, loadSession, saveSession, type CatalystPhase } from "./session";
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
  const [unlockMode, setUnlockMode] = useState<"build" | "nofit">("build");

  // Resume after a refresh. This MUST run post-mount: sessionStorage is
  // unavailable during SSR, so both the server output and the first client
  // render are the "entry" screen, and we only diverge once mounted — no
  // hydration mismatch. The synchronous setState here is intentional.
  useEffect(() => {
    const s = loadSession();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time resume, see note above */
    if (s.phase === "scan" && Object.keys(s.answers ?? {}).length > 0) {
      setAnswers(s.answers);
      setResumeIdx(s.idx);
      setPhase("scan");
      setOrb("listening");
    } else if (s.phase === "result" || s.phase === "unlock" || s.phase === "confirmed") {
      setAnswers(s.answers);
      setPhase(s.phase === "unlock" ? "unlock" : "result");
      setOrb("handover");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const result = useMemo<ScanResult | null>(
    () => (phase === "result" || phase === "unlock" ? safeResult(answers) : null),
    [phase, answers],
  );

  const handleComplete = (a: ScanAnswers) => {
    setAnswers(a);
    setPhase("result");
    setOrb("handover");
    saveSession({ phase: "result", answers: a });
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
  };

  const reset = () => {
    clearSession();
    setAnswers({} as ScanAnswers);
    setResumeIdx(0);
    setPhase("entry");
    setOrb("idle");
  };

  return (
    <div className={styles.exp}>
      {phase === "entry" ? (
        <EntryScreen onBegin={() => { setPhase("scan"); setOrb("listening"); saveSession({ phase: "scan" }); }} />
      ) : (
        <>
          <TopBar orb={orb} onReset={reset} />
          {phase === "scan" && (
            <ScanFlow
              initialIdx={resumeIdx}
              initialAnswers={answers}
              onComplete={handleComplete}
              onOrb={setOrb}
            />
          )}
          {phase === "result" && result && (
            <div className={styles.shell}>
              <ResultScreen result={result} answers={answers} onUnlock={openUnlock} onBookWalkthrough={openBook} />
            </div>
          )}
          {phase === "unlock" && result && (
            <div className={styles.shell}>
              <UnlockForm result={result} answers={answers} mode={unlockMode} onBack={() => { setPhase("result"); saveSession({ phase: "result" }); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---- persistent Sage presence bar (scan / result / unlock) ---- */
function TopBar({ orb, onReset }: { orb: OrbState; onReset: () => void }) {
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
        <SageOrb state={orb} size={40} />
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
          <h1 className="display" style={{ fontSize: "clamp(34px,5.4vw,60px)" }}>
            Sage is ready to scan your business.
          </h1>
          {/* Subline — JW to approve */}
          <p className="lead" style={{ maxWidth: "44ch" }}>
            Ten sharp questions, mostly taps. Sage reads each answer live and shows you exactly where revenue and time
            are leaking.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={onBegin} style={{ boxShadow: "var(--shadow-glow)" }}>
          Begin scan.
        </button>
        {/* Reassurance — verbatim from brief §2.2 */}
        <p className={styles.reassure}>
          <b>No payment to begin.</b> Directional scan first. Full roadmap within 24 hours.
        </p>
      </div>
    </div>
  );
}
