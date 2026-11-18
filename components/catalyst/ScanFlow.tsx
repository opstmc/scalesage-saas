"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildResult, jobValueOf, sectorOf, type ScanAnswers, type ScanNode, type ScanResult } from "@/lib/catalyst";
import api, { type ChecksResult, type LookupMatch, type ResearchOptions, type ResearchState } from "@/lib/catalyst-api";
import Conversation, { type ConversationActions } from "./Conversation";
import LiveDiagram from "./LiveDiagram";
import SageHeader, { type ResearchStep } from "./SageHeader";
import type { OrbState } from "./SageOrb";
import UnlockForm from "./UnlockForm";
import { isNoFit } from "./meta";
import { activityLine, evidenceFrom } from "./sections";
import { saveSession, type LookupState } from "./session";
import {
  QUESTION_COUNT,
  answeredCount,
  buildThread,
  openStepId,
  pinLeads,
  type Leads,
  type Naming,
  type ThreadInput,
} from "./thread";
import styles from "./catalyst.module.css";

/* The scan as one conversation with Sage. This component keeps the state (the
 * answers, the lookup, the research and the two small pieces of conversation
 * state), runs the lookup, starts or resumes the research, and lays out the
 * conversation beside the live leak map. What Sage says is calculated from that
 * state by buildThread in thread.ts. */

type ResearchPhase = "idle" | "running" | "done" | "unavailable";

const NO_NAME: Naming = { submitted: null, pending: false, match: null, rejected: false };

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", notify);
      window.addEventListener("resize", notify);
      return () => {
        mq.removeEventListener("change", notify);
        window.removeEventListener("resize", notify);
      };
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The business's own site off the lookup match, if it carries one (`website`
 *  or `domain`). Without a URL the website checks have nothing to open. */
function websiteOf(match: LookupMatch | null): string | null {
  if (!match) return null;
  const raw = match.website ?? (match as { domain?: unknown }).domain;
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
}

function safeResult(answers: ScanAnswers, checks: ChecksResult | null): ScanResult {
  try {
    return buildResult(answers, evidenceFrom(checks));
  } catch {
    return {} as ScanResult;
  }
}

export default function ScanFlow({
  initialAnswers,
  initialLookup,
  initialChecks,
  initialResearchId,
  initialLeads,
  sessionId,
  onReport,
  onReset,
}: {
  initialAnswers: ScanAnswers;
  initialLookup: LookupState | null;
  initialChecks: ChecksResult | null;
  initialResearchId: string | null;
  initialLeads: Leads;
  sessionId: string | null;
  onReport: (sessionId: string | null, token: string) => void;
  onReset: () => void;
}) {
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const narrow = useMedia("(max-width: 900px)");
  const [year] = useState(() => new Date().getFullYear());

  const [answers, setAnswers] = useState<ScanAnswers>(initialAnswers);
  const [lookup, setLookup] = useState<LookupState | null>(initialLookup);
  const [naming, setNaming] = useState<Naming>(NO_NAME);
  const [checks, setChecks] = useState<ChecksResult | null>(initialChecks);
  const [research, setResearch] = useState<ResearchState | null>(null);
  const [phase, setPhase] = useState<ResearchPhase>(initialLookup?.confirmed && initialResearchId ? "running" : "idle");
  const [activities, setActivities] = useState<string[]>([]);
  const [leads, setLeads] = useState<Leads>(initialLeads);
  const [editing, setEditing] = useState<string | null>(null);
  const [tradeList, setTradeList] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    saveSession({ phase: "scan", answers, lookup, checks, leads });
  }, [answers, lookup, checks, leads]);

  /* ---- research: started when the business is confirmed, resumed after a
   * refresh from the saved run id, so findings come back with the page ---- */
  const runId = useRef<string | null>(initialResearchId);
  const abort = useRef<AbortController | null>(null);

  const poll = useCallback((start: (opts: ResearchOptions) => Promise<ChecksResult>) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    void start({
      signal: ctrl.signal,
      onRun: (id) => {
        runId.current = id;
        saveSession({ researchId: id });
      },
      onState: (state) => {
        setResearch(state);
        const now = state.activity;
        if (now) setActivities((seen) => (seen.includes(now) ? seen : [...seen, now]));
      },
      jobValue: () => jobValueOf(answersRef.current),
      sector: () => sectorOf(answersRef.current),
      onResult: (result) => setChecks(result),
    }).then((final) => {
      if (ctrl.signal.aborted) return;
      setPhase(runId.current ? "done" : final.status === "deferred" ? "unavailable" : "done");
    });
  }, []);

  const resume = useRef({ confirmed: Boolean(initialLookup?.confirmed), runId: initialResearchId });
  useEffect(() => {
    const { confirmed, runId: saved } = resume.current;
    if (confirmed && saved) poll((opts) => api.followResearch(saved, opts));
    return () => abort.current?.abort();
  }, [poll]);

  /* Estimates need the job value and the trade. A run that finished before they
   * were given is read once more whenever either changes. */
  const jobValue = jobValueOf(answers);
  const sector = sectorOf(answers);
  const finished = research?.finished === true;
  useEffect(() => {
    const id = runId.current;
    if (!id || !finished) return;
    let live = true;
    void api.research(id, jobValue, sector).then((state) => {
      if (live && state) setResearch(state);
    });
    return () => {
      live = false;
    };
  }, [jobValue, sector, finished]);

  /* ---- the conversation ---- */
  const running = phase === "running" && !finished;
  const base: ThreadInput = { answers, lookup, naming, checks, research, running, leads, editing, tradeList, year };
  const pinned = pinLeads(leads, base);
  if (pinned !== leads) setLeads(pinned);
  const thread = buildThread({ ...base, leads: pinned });

  const lookupToken = useRef(0);
  const confirm = (match: LookupMatch | null, name: string) => {
    setLookup({ confirmed: true, manual: match === null, match });
    setAnswers((a) => ({ ...a, business: name }));
    setPhase("running");
    poll((opts) =>
      api.researchWithChecks(
        {
          business_name: name,
          website: websiteOf(match),
          sector: match?.sector ?? null,
          location: match?.location ?? null,
          place_id: match?.place_id ?? null,
          company_number: match?.company_number ?? null,
          rating: match?.rating ?? null,
          review_count: match?.review_count ?? null,
          incorporated_year: match?.incorporated_year ?? null,
        },
        opts,
      ),
    );
  };

  const answer = (stepId: string, value: string | string[], other?: string) => {
    setAnswers((a) => ({ ...a, [stepId]: value, ...(other !== undefined ? { [`${stepId}_other`]: other } : {}) }));
    setEditing(null);
    if (stepId === "sectors") setTradeList(false);
  };

  const actions: ConversationActions = {
    onName: (name) => {
      const mine = ++lookupToken.current;
      setNaming({ submitted: name, pending: true, match: null, rejected: false });
      void api.lookup(name).then((res) => {
        if (mine !== lookupToken.current) return;
        const match = res.status === "ok" ? res.matches[0] ?? null : null;
        setNaming({ submitted: name, pending: false, match, rejected: false });
      });
    },
    onMatch: (yes) => {
      if (yes && naming.match) confirm(naming.match, naming.match.name);
      else setNaming((n) => ({ ...n, rejected: true }));
    },
    onUseTyped: (name) => confirm(null, name),
    onTrade: (value) => {
      if (value === null) setTradeList(true);
      else answer("sectors", [value]);
    },
    onAnswer: answer,
    onEdit: (stepId) => setEditing(stepId),
  };

  /* ---- header and map ---- */
  const open = thread.open;
  const done = answeredCount(answers, lookup);
  const findings = research ? research.findings.length : null;
  const findingsText = findings === 1 ? "1 finding" : `${findings} findings`;
  const after = finished ? ` · Research done, ${findingsText}` : phase === "unavailable" ? " · Online check in your full scan" : "";
  const line = running
    ? `${activityLine(research?.activity)}…`
    : open.kind === "details"
      ? "Last step: where to send your report"
      : open.kind === "valve"
        ? `One last question${after}`
        : `Question ${Math.min(QUESTION_COUNT, done + 1)} of ${QUESTION_COUNT}${after}`;
  const orb: OrbState = open.kind === "details" ? "handover" : running ? "thinking" : "listening";
  const steps: ResearchStep[] = activities.map((a, i) => ({
    label: activityLine(a),
    done: !running || i < activities.length - 1,
  }));
  const note = phase === "unavailable" ? "We'll confirm your online presence in the full scan." : null;

  const nodes = useMemo<ScanNode[]>(() => {
    try {
      return buildResult(answers, evidenceFrom(checks)).nodes ?? [];
    } catch {
      return [];
    }
  }, [answers, checks]);
  const map = (
    <LiveDiagram
      answers={answers}
      activeStepId={openStepId(answers, editing) ?? ""}
      nodes={nodes}
      reducedMotion={reduced}
    />
  );

  const result = useMemo(() => safeResult(answers, checks), [answers, checks]);
  const details = (
    <UnlockForm
      inThread
      result={result}
      answers={answers}
      checks={checks}
      lookup={lookup}
      mode={isNoFit(result) ? "nofit" : "build"}
      initialSessionId={sessionId}
      onReport={onReport}
    />
  );

  return (
    <div className={styles.shell}>
      <div className={styles.scanCols}>
        <div className={styles.cardCol}>
          <SageHeader
            orb={orb}
            progress={done / QUESTION_COUNT}
            line={line}
            live={running}
            steps={steps}
            findings={findings}
            note={note}
            map={narrow ? map : null}
            onReset={onReset}
          />
          <Conversation thread={thread} answers={answers} reduced={reduced} details={details} actions={actions} />
        </div>
        {!narrow && (
          <div className={styles.diagramCol}>
            <div className={styles.diagramSticky}>{map}</div>
          </div>
        )}
      </div>
    </div>
  );
}
