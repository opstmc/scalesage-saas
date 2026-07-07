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

export type CatalystPhase = "entry" | "scan" | "result" | "unlock" | "confirmed";

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
}

const KEY = "ss_catalyst_v1";

const EMPTY: CatalystSession = {
  phase: "entry",
  idx: 0,
  answers: {} as ScanAnswers,
  lookup: null,
  checks: null,
};

export function loadSession(): CatalystSession {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CatalystSession>;
    return {
      phase: parsed.phase ?? "entry",
      idx: typeof parsed.idx === "number" ? parsed.idx : 0,
      answers: (parsed.answers ?? {}) as ScanAnswers,
      lookup: parsed.lookup ?? null,
      checks: parsed.checks ?? null,
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
