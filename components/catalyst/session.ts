/**
 * sessionStorage persistence for the /catalyst scan so a refresh never resets
 * progress (brief §2.5). Stores the business-scan answers, the free-text
 * "problems_raw", and the PUBLIC business facts from Q1 (the live lookup match
 * and the background-check result). It NEVER stores the personal contact fields
 * captured in the unlock form (name / email / phone) — those live in memory
 * only, in keeping with the GDPR promise.
 *
 * SSR-safe: every accessor no-ops when there is no window.
 */
import type { ScanAnswers } from "@/lib/catalyst";
import type { LookupMatch, ChecksResult } from "@/lib/catalyst-api";
import { EMPTY_SELECTION, isPlanSelection, type PlanSelection } from "./recommendation";

export type CatalystPhase = "entry" | "scan" | "unlock" | "confirmed";

/** Sessions saved before the scan moved to sections can carry phases that no
 *  longer exist: a finished scan goes to the details form, an interview to the
 *  confirmation. */
function phaseOf(value: unknown): CatalystPhase {
  if (value === "scan" || value === "unlock" || value === "confirmed") return value;
  if (value === "result") return "unlock";
  if (value === "interview") return "confirmed";
  return "entry";
}

/** The confirmed Q1 identity + its lock reason (match vs. manual add). */
export interface LookupState {
  confirmed: boolean;
  manual: boolean;
  match: LookupMatch | null;
}

export interface CatalystSession {
  phase: CatalystPhase;
  idx: number;
  answers: ScanAnswers;
  /** Q1 live-lookup identity (public business data only). */
  lookup: LookupState | null;
  /** Background live-check facts (public business data only). */
  checks: ChecksResult | null;
  /** The server session id, once unlock has captured the lead, so a refresh shows
   *  the confirmation instead of asking for the same details again. Not personal
   *  data: an unguessable id, not a contact detail. */
  sessionId: string | null;
  /** The research run started at Q1, sent with unlock so the server attaches
   *  it to the lead instead of measuring the business a second time. */
  researchId: string | null;
  /** The plan and add-ons the VISITOR picked, so a refresh does not make them
   *  pick again. Only ever written from a click in PlanChoice: a recommendation
   *  never lands here, which is what keeps "recommended" from quietly becoming
   *  "selected" across a reload. */
  selection: PlanSelection;
}

const KEY = "ss_catalyst_v1";

const EMPTY: CatalystSession = {
  phase: "entry",
  idx: 0,
  answers: {} as ScanAnswers,
  lookup: null,
  checks: null,
  sessionId: null,
  researchId: null,
  selection: { ...EMPTY_SELECTION },
};

export function loadSession(): CatalystSession {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CatalystSession>;
    return {
      phase: phaseOf(parsed.phase),
      idx: typeof parsed.idx === "number" ? parsed.idx : 0,
      answers: (parsed.answers ?? {}) as ScanAnswers,
      lookup: parsed.lookup ?? null,
      checks: parsed.checks ?? null,
      sessionId: parsed.sessionId ?? null,
      researchId: typeof parsed.researchId === "string" ? parsed.researchId : null,
      // Anything malformed reads back as "nothing chosen". A storage blob can
      // never talk this UI into arriving pre-selected.
      selection: isPlanSelection(parsed.selection) ? parsed.selection : { ...EMPTY_SELECTION },
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveSession(patch: Partial<CatalystSession>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSession();
    const next = { ...current, ...patch };
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — the in-memory state still works */
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
