"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScanAnswers } from "@/lib/catalyst";
import type { ChecksResult } from "@/lib/catalyst-api";
import SageOrb from "./SageOrb";
import ScanFlow from "./ScanFlow";
import { clearSession, loadSession, saveSession, type CatalystPhase, type LookupState } from "./session";
import type { Leads } from "./thread";
import styles from "./catalyst.module.css";

interface Resume {
  answers: ScanAnswers;
  lookup: LookupState | null;
  checks: ChecksResult | null;
  researchId: string | null;
  leads: Leads;
  sessionId: string | null;
}

const FRESH: Resume = { answers: {}, lookup: null, checks: null, researchId: null, leads: {}, sessionId: null };

export default function CatalystExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<CatalystPhase>("entry");
  const [resume, setResume] = useState<Resume>(FRESH);
  const [run, setRun] = useState(0);

  // Resume after a refresh. Runs post-mount only: sessionStorage is unavailable
  // during SSR, so both the server output and the first client render are the
  // "entry" screen, and we only diverge once mounted — no hydration mismatch.
  useEffect(() => {
    const s = loadSession();
    const started = Object.keys(s.answers ?? {}).length > 0 || Boolean(s.lookup?.confirmed);
    if (s.phase === "entry" || (s.phase === "scan" && !started)) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time resume */
    setResume({
      answers: s.answers,
      lookup: s.lookup,
      checks: s.checks,
      researchId: s.researchId,
      leads: s.leads,
      sessionId: s.phase === "confirmed" ? s.sessionId : null,
    });
    setPhase(s.phase);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const openReport = (id: string | null, token: string) => {
    saveSession({ phase: "confirmed", sessionId: id });
    router.push(`/catalyst/report/${encodeURIComponent(token)}`);
  };

  const reset = () => {
    clearSession();
    setResume(FRESH);
    setPhase("entry");
    setRun((r) => r + 1);
  };

  return (
    <div className={styles.exp}>
      {phase === "entry" ? (
        <EntryScreen
          onBegin={() => {
            setPhase("scan");
            saveSession({ phase: "scan" });
          }}
        />
      ) : (
        <ScanFlow
          key={run}
          initialAnswers={resume.answers}
          initialLookup={resume.lookup}
          initialChecks={resume.checks}
          initialResearchId={resume.researchId}
          initialLeads={resume.leads}
          sessionId={resume.sessionId}
          onReport={openReport}
          onReset={reset}
        />
      )}
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
          <b>No payment to begin.</b> Directional scan first. Full roadmap within an hour.
        </p>
      </div>
    </div>
  );
}
