/**
 * Catalyst backend client (brief §3 + docs/catalyst-api-contract.md).
 *
 * Typed wrapper around the five browser-called contract endpoints:
 *   POST /catalyst/lookup              — Q1 live business lookup
 *   POST /catalyst/checks              — live background checks (non-blocking)
 *   POST /catalyst/unlock              — the SINGLE lead-capture point
 *   POST /catalyst/{id}/pay            — Stripe checkout (may be stubbed)
 *   POST /catalyst/{id}/book-call      — "talk it through first" door
 *
 * GRACEFUL BY DESIGN. Every call:
 *   - short-circuits to the honest empty/deferred shape when
 *     NEXT_PUBLIC_SAGE_API_BASE is unset (e.g. the preview before the backend
 *     ships), so the scan still runs and the result still renders;
 *   - times out instead of hanging the UI;
 *   - NEVER throws into the UI and NEVER fabricates a finding.
 *
 * Fallbacks:
 *   lookup  -> { status: "no_match", matches: [] }  (UI offers manual add)
 *   checks  -> { status: "deferred", ...null }        (UI shows "still checking")
 *   unlock  -> tries the backend, then the same-origin /api/catalyst route,
 *              then local-persist + retry. A lead is never silently lost.
 *   pay     -> { ok: false, deferred: true }          (UI shows a calm note)
 *   book    -> { ok: false, deferred: true }
 */

import { getRef } from "@/lib/ref";

const API_BASE = (process.env.NEXT_PUBLIC_SAGE_API_BASE ?? "").replace(/\/+$/, "");

/** Local-persist key for unlock payloads the backend could not accept yet. */
const PENDING_KEY = "ss_catalyst_pending_v1";

/* ---------- endpoint response types (mirror the contract) ---------- */

export interface LookupMatch {
  name: string;
  sector: string | null;
  incorporated_year: number | null;
  location: string | null;
  review_count: number | null;
  rating: number | null;
  source: "companies_house" | "places" | "both" | string;
  confidence: number;
}
export interface LookupResult {
  status: "ok" | "no_match";
  matches: LookupMatch[];
}

export interface GoogleBusinessCheck {
  exists: boolean;
  rating: number | null;
  review_count: number | null;
  ranks_page_one: boolean;
}
export interface WebsiteCheck {
  loads: boolean;
  load_ms: number | null;
  click_to_call: boolean;
}
export interface AiPresenceCheck {
  appears: boolean;
  note: string;
}
export interface ChecksResult {
  status: "complete" | "partial" | "deferred";
  google_business: GoogleBusinessCheck | null;
  website: WebsiteCheck | null;
  ai_presence: AiPresenceCheck | null;
}
export interface ChecksInput {
  business_name: string;
  website?: string | null;
  sector?: string | null;
  location?: string | null;
}

export interface UnlockResult {
  ok: boolean;
  /** true when captured via fallback / local-persist rather than the backend. */
  deferred: boolean;
  session_id: string | null;
  portal_url: string | null;
}

export interface PayResult {
  ok: boolean;
  deferred: boolean;
  checkout_url: string | null;
}

export interface BookCallResult {
  ok: boolean;
  deferred: boolean;
  booking_url: string | null;
}

/* ---------- low-level POST with timeout + graceful null ---------- */

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T | null> {
  if (!API_BASE) return null;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${API_BASE}/catalyst${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl?.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Same-origin Next route — the redundant capture point (works with no base). */
async function postLocal(body: unknown): Promise<{ ok?: boolean; id?: string } | null> {
  try {
    const res = await fetch("/api/catalyst", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as { ok?: boolean; id?: string } | null;
  } catch {
    return null;
  }
}

/* ---------- local-persist for unlock (never lose a lead) ---------- */

function readPending(): { id: string; body: Record<string, unknown> }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as { id: string; body: Record<string, unknown> }[]) : [];
  } catch {
    return [];
  }
}
function writePending(list: { id: string; body: Record<string, unknown> }[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    /* storage full / disabled — the in-memory retry still works */
  }
}
function persistPending(body: Record<string, unknown>): string {
  const id = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  writePending([...readPending(), { id, body }]);
  return id;
}
function clearPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- 1. lookup ---------- */

export async function lookup(query: string): Promise<LookupResult> {
  const q = (query ?? "").trim();
  // A two-character floor keeps the debounce cheap and avoids noise matches.
  if (q.length < 2) return { status: "no_match", matches: [] };
  const json = await post<Partial<LookupResult>>("/lookup", { query: q }, 4500);
  const matches = Array.isArray(json?.matches) ? (json!.matches as LookupMatch[]) : [];
  const ok = json?.status === "ok" && matches.length > 0;
  return { status: ok ? "ok" : "no_match", matches };
}

/* ---------- 2. checks ---------- */

const DEFERRED_CHECKS: ChecksResult = {
  status: "deferred",
  google_business: null,
  website: null,
  ai_presence: null,
};

export async function checks(input: ChecksInput): Promise<ChecksResult> {
  if (!input?.business_name?.trim()) return DEFERRED_CHECKS;
  const json = await post<Partial<ChecksResult>>(
    "/checks",
    {
      business_name: input.business_name,
      website: input.website ?? null,
      sector: input.sector ?? null,
      location: input.location ?? null,
    },
    9000,
  );
  if (!json) return DEFERRED_CHECKS;
  const status: ChecksResult["status"] =
    json.status === "complete" || json.status === "partial" || json.status === "deferred"
      ? json.status
      : "partial";
  return {
    status,
    google_business: json.google_business ?? null,
    website: json.website ?? null,
    ai_presence: json.ai_presence ?? null,
  };
}

/* ---------- 3. unlock (the single capture point) ---------- */

export async function unlock(payload: Record<string, unknown>): Promise<UnlockResult> {
  const ref = getRef();
  const body: Record<string, unknown> = { ...(payload ?? {}), ...(ref ? { ref } : {}) };

  // 1) The contract endpoint (owns persistence, the 24h engine, the alert).
  const direct = await post<{ ok?: boolean; session_id?: string; portal_url?: string | null }>(
    "/unlock",
    body,
    12000,
  );
  if (direct?.ok) {
    clearPending();
    return { ok: true, deferred: false, session_id: direct.session_id ?? null, portal_url: direct.portal_url ?? null };
  }

  // 2) Same-origin fallback — captures the lead even with no base configured.
  const local = await postLocal(body);
  if (local?.ok) {
    clearPending();
    return { ok: true, deferred: true, session_id: local.id ?? null, portal_url: null };
  }

  // 3) Nothing reachable — keep the lead locally so the UI can retry.
  const localId = persistPending(body);
  return { ok: false, deferred: true, session_id: localId, portal_url: null };
}

/* ---------- 4. pay ---------- */

export async function pay(sessionId: string | null, tier: "Starter" | "Pro"): Promise<PayResult> {
  if (!sessionId || sessionId.startsWith("local_")) {
    return { ok: false, deferred: true, checkout_url: null };
  }
  const json = await post<{ checkout_url?: string }>(`/${encodeURIComponent(sessionId)}/pay`, { tier }, 12000);
  const url = typeof json?.checkout_url === "string" ? json.checkout_url.trim() : "";
  if (url) return { ok: true, deferred: false, checkout_url: url };
  return { ok: false, deferred: true, checkout_url: null };
}

/* ---------- 5. book-call ---------- */

export async function bookCall(sessionId: string | null): Promise<BookCallResult> {
  if (!sessionId || sessionId.startsWith("local_")) {
    return { ok: false, deferred: true, booking_url: null };
  }
  const json = await post<{ booking_url?: string; url?: string }>(
    `/${encodeURIComponent(sessionId)}/book-call`,
    {},
    12000,
  );
  const url = typeof json?.booking_url === "string" ? json.booking_url : typeof json?.url === "string" ? json.url : "";
  if (url) return { ok: true, deferred: false, booking_url: url.trim() };
  return { ok: false, deferred: true, booking_url: null };
}

/** True when a backend is configured. Lets the UI soften copy in preview. */
export const hasBackend = Boolean(API_BASE);

export const api = { lookup, checks, unlock, pay, bookCall, hasBackend };
export default api;
