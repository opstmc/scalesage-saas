/**
 * sessionStorage persistence for the /catalyst scan so a refresh never resets
 * progress (brief §2.5). Stores only business-scan answers + the free-text
 * "problems_raw" — never the PII captured in the unlock form (kept in memory
 * only, in keeping with the GDPR promise).
 *
 * SSR-safe: every accessor no-ops when there is no window.
 */
import type { ScanAnswers } from "@/lib/catalyst";

export type CatalystPhase = "entry" | "scan" | "result" | "unlock" | "confirmed";

export interface CatalystSession {
  phase: CatalystPhase;
  idx: number;
  answers: ScanAnswers;
}

const KEY = "ss_catalyst_v1";

const EMPTY: CatalystSession = { phase: "entry", idx: 0, answers: {} as ScanAnswers };

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
