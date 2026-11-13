/**
 * Catalyst backend client (brief §3 + docs/catalyst-api-contract.md).
 *
 * Typed wrapper around the browser-called contract endpoints:
 *   POST /catalyst/lookup              — Q1 live business lookup
 *   POST /catalyst/checks              — live background checks (non-blocking)
 *   GET  /catalyst/{id}/evidence       — the same findings, asked for again
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
 *   evidence-> null                                   (caller keeps what it had)
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
  /** The business's own site, when Google knows it. Optional: the field is new
   *  and an older backend simply omits it. */
  website?: string | null;
  /** Google's id for the place and the Companies House number, when known, so
   *  the research run starts from the business the visitor confirmed. */
  place_id?: string | null;
  company_number?: string | null;
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
  /** null = "we could not tell", which is NOT the same as "there is no
   *  tap-to-call". Every reader must treat it as unknown, never as false. */
  click_to_call: boolean | null;
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

export interface PublicFinding {
  leak: string;
  side: "for" | "against";
  claim: string;
  quote: string;
}
export interface Rival {
  name: string | null;
  rating: number | null;
  review_count: number | null;
}
export interface PricedLeak {
  monthly_pence: number;
  basis: "their_number" | "benchmark";
  workings: string;
}
export interface Estimates {
  one_job_a_week_pence: number | null;
  missed_calls: PricedLeak | null;
  cold_quotes: PricedLeak | null;
  lapsed_customers: PricedLeak | null;
}
/** The research read: the checks shape plus what each scan section shows. */
export interface ResearchState extends ChecksResult {
  finished: boolean;
  activity: string | null;
  findings: PublicFinding[];
  rivals: Rival[];
  ai_named_by: string[];
  estimates: Estimates | null;
}

export interface UnlockResult {
  ok: boolean;
  /** true when captured via fallback / local-persist rather than the backend. */
  deferred: boolean;
  session_id: string | null;
  portal_url: string | null;
  /** Opens the report page in the same visit. Only the backend path has one. */
  report_token: string | null;
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

/** GET with the same contract as post(): times out, never throws, null on any
 *  failure so the caller keeps whatever it already had. */
async function get<T>(path: string, timeoutMs: number): Promise<T | null> {
  if (!API_BASE) return null;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${API_BASE}/catalyst${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
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

/** Wait, unless we are told to stop. Resolves true when aborted, so every
 *  polling loop can `if (await sleep(...)) break;` and unwind cleanly on an
 *  unmount instead of firing requests into a page that is gone. */
function sleep(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(true);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve(false);
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
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

/** Rank of a status, so a merge can never quietly go backwards. */
const STATUS_RANK: Record<ChecksResult["status"], number> = {
  deferred: 0,
  partial: 1,
  complete: 2,
};

function normaliseChecks(json: Partial<ChecksResult> | null): ChecksResult | null {
  if (!json) return null;
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

/**
 * Fold a later answer into what we already knew.
 *
 * Monotonic by design: a check we have already measured is NEVER overwritten
 * with a null. A retry that comes back thinner than the first answer — one tool
 * slow this time round — must not take a finding off a diagram the visitor is
 * already looking at, or retract a question the interview has already asked.
 */
export function mergeChecks(prev: ChecksResult | null, next: ChecksResult): ChecksResult {
  if (!prev) return next;
  return {
    status: STATUS_RANK[next.status] > STATUS_RANK[prev.status] ? next.status : prev.status,
    google_business: next.google_business ?? prev.google_business,
    website: next.website ?? prev.website,
    ai_presence: next.ai_presence ?? prev.ai_presence,
  };
}

function sameChecks(a: ChecksResult | null, b: ChecksResult | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
  return normaliseChecks(json) ?? DEFERRED_CHECKS;
}

/** Options shared by the two things that ask more than once. */
export interface PollOptions {
  /** Fired whenever the answer actually improved — never on a no-change tick. */
  onResult?: (result: ChecksResult) => void;
  /** Unmount / navigation. Stops the loop dead rather than firing into a dead page. */
  signal?: AbortSignal;
}

/**
 * The extra attempts at the Q1 checks call, in milliseconds between them.
 *
 * BOUNDED, and deliberately short: three retries, ~31s of wall clock on top of
 * the first attempt's own 9s timeout. The scan lasts minutes, so this finishes
 * long before the visitor does — and on a backend that is simply down it stops
 * rather than sitting on someone's phone burning battery for the whole scan.
 */
const CHECKS_RETRY_DELAYS_MS = [3000, 8000, 20000];

/**
 * checks(), and then a few more goes while the answer is still incomplete.
 *
 * The original call fired exactly once. When it deferred — a tool timeout, a
 * cold backend, a request that never left the browser — the live diagram stayed
 * empty for the rest of the scan and the deep interview got no evidence at all.
 * There was no second attempt.
 */
export async function checksWithRetry(
  input: ChecksInput,
  opts: PollOptions = {},
): Promise<ChecksResult> {
  let best = await checks(input);
  opts.onResult?.(best);
  if (!API_BASE) return best; // nothing to retry against

  for (const delay of CHECKS_RETRY_DELAYS_MS) {
    if (best.status === "complete") break;
    if (await sleep(delay, opts.signal)) break;
    const merged = mergeChecks(best, await checks(input));
    if (!sameChecks(merged, best)) {
      best = merged;
      opts.onResult?.(best);
    }
  }
  return best;
}

/* ---------- 2a. research: the agentic scan that replaces the fixed checks ---------- */

export interface ResearchInput extends ChecksInput {
  place_id?: string | null;
  company_number?: string | null;
  rating?: number | null;
  review_count?: number | null;
  incorporated_year?: number | null;
}

export interface ResearchOptions extends PollOptions {
  /** Fired once with the run id, so a refresh can carry it to unlock. */
  onRun?: (runId: string) => void;
  /** Fired on every successful read, with the findings and estimates. */
  onState?: (state: ResearchState) => void;
  /** The job value in pounds once the visitor has given one, for the estimates. */
  jobValue?: () => number | null;
  /** The scan's own sector id, so estimates use the same benchmarks as the report. */
  sector?: () => string | null;
}

const RESEARCH_POLL_MS = 2500;
/** The agent's own limit is 180 s after the measurements, so this outlasts it. */
const RESEARCH_POLL_LIMIT_MS = 210000;

function researchBody(input: ResearchInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.business_name,
    town: input.location ?? null,
    website: input.website ?? null,
    sector: input.sector ?? null,
    place_id: input.place_id ?? null,
    company_number: input.company_number ?? null,
    rating: input.rating ?? null,
    review_count: input.review_count ?? null,
    incorporated_year: input.incorporated_year ?? null,
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null && v !== undefined && v !== ""));
}

/** Start a research run for the confirmed business. null when there is no
 *  backend, or it refused (rate limit, an older backend without the route). */
export async function startResearch(input: ResearchInput): Promise<string | null> {
  if (!input?.business_name?.trim() || !API_BASE) return null;
  const json = await post<{ run_id?: string }>("/research", researchBody(input), 9000);
  return typeof json?.run_id === "string" ? json.run_id : null;
}

/** What the run has found so far: the checks shape plus findings and estimates. */
export async function research(
  runId: string,
  jobValue?: number | null,
  sector?: string | null,
): Promise<ResearchState | null> {
  const params = new URLSearchParams();
  if (jobValue) params.set("job_value", String(Math.round(jobValue)));
  if (sector && sector !== "other") params.set("sector", sector);
  const query = params.toString() ? `?${params.toString()}` : "";
  const json = await get<Partial<ResearchState>>(`/research/${encodeURIComponent(runId)}${query}`, 9000);
  const checks = normaliseChecks(json);
  if (!json || !checks) return null;
  return {
    ...checks,
    finished: json.finished === true,
    activity: typeof json.activity === "string" ? json.activity : null,
    findings: Array.isArray(json.findings) ? json.findings : [],
    rivals: Array.isArray(json.rivals) ? json.rivals : [],
    ai_named_by: Array.isArray(json.ai_named_by) ? json.ai_named_by : [],
    estimates: json.estimates ?? null,
  };
}

/**
 * Start the research and poll it until the run has finished or the poll limit
 * passes, reporting the findings and estimates on every read. Falls back to the
 * fixed checks when no run could start, so an older backend still fills the
 * live diagram.
 */
export async function researchWithChecks(input: ResearchInput, opts: ResearchOptions = {}): Promise<ChecksResult> {
  const runId = await startResearch(input);
  if (!runId) return checksWithRetry(input, opts);
  opts.onRun?.(runId);

  let best: ChecksResult = DEFERRED_CHECKS;
  const deadline = Date.now() + RESEARCH_POLL_LIMIT_MS;
  while (Date.now() < deadline) {
    if (await sleep(RESEARCH_POLL_MS, opts.signal)) break;
    const next = await research(runId, opts.jobValue?.() ?? null, opts.sector?.() ?? null);
    if (!next) continue;
    opts.onState?.(next);
    const merged = mergeChecks(best, next);
    if (!sameChecks(merged, best)) {
      best = merged;
      opts.onResult?.(best);
    }
    if (next.finished) break;
  }
  return best;
}

/* ---------- 3. unlock (the single capture point) ---------- */

export async function unlock(payload: Record<string, unknown>): Promise<UnlockResult> {
  const ref = getRef();
  const body: Record<string, unknown> = { ...(payload ?? {}), ...(ref ? { ref } : {}) };

  // 1) The contract endpoint (owns persistence, the 24h engine, the alert).
  const direct = await post<{
    ok?: boolean;
    session_id?: string;
    portal_url?: string | null;
    report_token?: string | null;
  }>("/unlock", body, 12000);
  if (direct?.ok) {
    clearPending();
    return {
      ok: true,
      deferred: false,
      session_id: direct.session_id ?? null,
      portal_url: direct.portal_url ?? null,
      report_token: typeof direct.report_token === "string" ? direct.report_token : null,
    };
  }

  // 2) Same-origin fallback — captures the lead even with no base configured.
  const local = await postLocal(body);
  if (local?.ok) {
    clearPending();
    return { ok: true, deferred: true, session_id: local.id ?? null, portal_url: null, report_token: null };
  }

  // 3) Nothing reachable — keep the lead locally so the UI can retry.
  const localId = persistPending(body);
  return { ok: false, deferred: true, session_id: localId, portal_url: null, report_token: null };
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

export const api = {
  lookup,
  checks,
  checksWithRetry,
  startResearch,
  research,
  researchWithChecks,
  mergeChecks,
  unlock,
  pay,
  bookCall,
  hasBackend,
};
export default api;
