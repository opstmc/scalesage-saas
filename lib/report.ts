/**
 * Catalyst 24h report client (public token link).
 *
 * A prospect receives a secret token by email and views their finished
 * Catalyst report at /catalyst/report/{token}. This client mirrors the
 * graceful pattern in lib/catalyst-api.ts:
 *
 *   - short-circuits to an honest empty shape when NEXT_PUBLIC_SAGE_API_BASE
 *     is unset (e.g. the preview before the backend ships);
 *   - times out instead of hanging the UI;
 *   - NEVER throws into the UI and NEVER fabricates a report.
 *
 * Endpoints (docs backend contract):
 *   GET  {API_BASE}/catalyst/report/{token}       — fetch the report
 *   POST {API_BASE}/catalyst/report/{token}/pay   — start the build (Stripe)
 */

const API_BASE = (process.env.NEXT_PUBLIC_SAGE_API_BASE ?? "").replace(/\/+$/, "");

/* ---------- report shape (mirrors the contract) ---------- */

export interface CheckedFact {
  area: string;
  fact: string;
  anchor?: string;
  source?: string;
}

/** Where a priced figure came from: the client's own numbers, or our sector model. */
export type LeakBasis = "their_number" | "benchmark";

/** How far a leak has been proven out. */
export type LeakMaturity = "potential" | "validated" | "recoverable";

export interface RankedLeak {
  title: string;
  detail: string;
  source?: string;
  /** Monthly cost of this leak, in pence (240000 = £2,400 a month). */
  monthly_pence?: number;
  basis?: LeakBasis;
  /** Plain-English sum behind the figure, shown to the reader verbatim. */
  workings?: string;
  inputs_used?: string[];
  maturity?: LeakMaturity;
}

/**
 * The priced leaks added up.
 *
 * The backend contract has every inner field present, but they are optional
 * here on purpose: a partial payload must degrade to showing less, never to
 * the page inventing a confidence it was not given.
 */
export interface LeakTotal {
  monthly_pence: number;
  /** 0..1 share of the total that came from the client's own numbers. */
  confidence_their_numbers?: number;
  basis_mix?: { their_number: number; benchmark: number };
}

/** The honesty notes that must travel with the total. */
export interface LeakDiscipline {
  maturity?: string;
  disclaimer?: string;
  margin_note?: string;
}

export interface BuildStep {
  title?: string;
  system?: string;
  detail?: string;
}

export interface Mockup {
  artefact?: string;
  headline?: string | null;
  copy?: string;
}

export interface Recommendation {
  tier?: string;
  why?: string;
  next_step?: string;
}

export interface ReportMeta {
  generated_at?: string;
  synthesis?: string;
}

export interface FullReport {
  checked: CheckedFact[];
  leaks_ranked: RankedLeak[];
  build_plan: BuildStep[];
  mockup: Mockup;
  recommendation: Recommendation;
  meta: ReportMeta;
  /** Both absent on every report built before leaks were priced. */
  leak_total?: LeakTotal;
  leak_discipline?: LeakDiscipline;
}

export type ReportStatus = "complete" | "pending" | "not_found";

export interface CatalystReport {
  status: ReportStatus;
  business_name: string | null;
  generated_at: string | null;
  tier: string | null;
  paid: boolean;
  report: FullReport | null;
  /** "Talk it through first" target (Calendly), from the backend, or null. */
  booking_url: string | null;
}

export interface PayReportResult {
  checkout_url: string | null;
}

/* ---------- honest fallbacks ---------- */

const NOT_FOUND: CatalystReport = {
  status: "not_found",
  business_name: null,
  generated_at: null,
  tier: null,
  paid: false,
  report: null,
  booking_url: null,
};

/* ---------- normalisers (guard every field / array) ---------- */

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asOptString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** Numbers only, and only real ones. NaN/Infinity/"2400" never reach the UI. */
function asOptNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asOptStringList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  return out.length > 0 ? out : undefined;
}

function asBasis(v: unknown): LeakBasis | undefined {
  return v === "their_number" || v === "benchmark" ? v : undefined;
}

function asMaturity(v: unknown): LeakMaturity | undefined {
  return v === "potential" || v === "validated" || v === "recoverable" ? v : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function normChecked(v: unknown): CheckedFact[] {
  if (!Array.isArray(v)) return [];
  return v.map((row) => {
    const r = (row ?? {}) as Record<string, unknown>;
    return {
      area: asString(r.area),
      fact: asString(r.fact),
      anchor: asOptString(r.anchor),
      source: asOptString(r.source),
    };
  });
}

function normLeaks(v: unknown): RankedLeak[] {
  if (!Array.isArray(v)) return [];
  return v.map((row) => {
    const r = (row ?? {}) as Record<string, unknown>;
    return {
      title: asString(r.title),
      detail: asString(r.detail),
      source: asOptString(r.source),
      monthly_pence: asOptNumber(r.monthly_pence),
      basis: asBasis(r.basis),
      workings: asOptString(r.workings),
      inputs_used: asOptStringList(r.inputs_used),
      maturity: asMaturity(r.maturity),
    };
  });
}

/**
 * A total is only a total if it has a figure. Anything less is dropped, so a
 * half-built payload cannot put a headline number on the page.
 */
function normLeakTotal(v: unknown): LeakTotal | undefined {
  const r = asRecord(v);
  if (!r) return undefined;
  const pence = asOptNumber(r.monthly_pence);
  if (pence === undefined) return undefined;

  const conf = asOptNumber(r.confidence_their_numbers);
  const mix = asRecord(r.basis_mix);
  const theirs = mix ? asOptNumber(mix.their_number) : undefined;
  const bench = mix ? asOptNumber(mix.benchmark) : undefined;

  return {
    monthly_pence: pence,
    confidence_their_numbers:
      conf === undefined ? undefined : Math.min(1, Math.max(0, conf)),
    basis_mix:
      theirs !== undefined && bench !== undefined
        ? { their_number: theirs, benchmark: bench }
        : undefined,
  };
}

function normLeakDiscipline(v: unknown): LeakDiscipline | undefined {
  const r = asRecord(v);
  if (!r) return undefined;
  const out: LeakDiscipline = {
    maturity: asOptString(r.maturity),
    disclaimer: asOptString(r.disclaimer),
    margin_note: asOptString(r.margin_note),
  };
  return out.maturity || out.disclaimer || out.margin_note ? out : undefined;
}

function normBuildPlan(v: unknown): BuildStep[] {
  if (!Array.isArray(v)) return [];
  return v.map((row) => {
    const r = (row ?? {}) as Record<string, unknown>;
    return {
      title: asOptString(r.title),
      system: asOptString(r.system),
      detail: asOptString(r.detail),
    };
  });
}

function normMockup(v: unknown): Mockup {
  const r = (v ?? {}) as Record<string, unknown>;
  return {
    artefact: asOptString(r.artefact),
    headline: typeof r.headline === "string" ? r.headline : null,
    copy: asOptString(r.copy),
  };
}

function normRecommendation(v: unknown): Recommendation {
  const r = (v ?? {}) as Record<string, unknown>;
  return {
    tier: asOptString(r.tier),
    why: asOptString(r.why),
    next_step: asOptString(r.next_step),
  };
}

function normMeta(v: unknown): ReportMeta {
  const r = (v ?? {}) as Record<string, unknown>;
  return {
    generated_at: asOptString(r.generated_at),
    synthesis: asOptString(r.synthesis),
  };
}

function normReport(v: unknown): FullReport | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  return {
    checked: normChecked(r.checked),
    leaks_ranked: normLeaks(r.leaks_ranked),
    build_plan: normBuildPlan(r.build_plan),
    mockup: normMockup(r.mockup),
    recommendation: normRecommendation(r.recommendation),
    meta: normMeta(r.meta),
    leak_total: normLeakTotal(r.leak_total),
    leak_discipline: normLeakDiscipline(r.leak_discipline),
  };
}

function normStatus(v: unknown): ReportStatus {
  return v === "complete" || v === "pending" ? v : "not_found";
}

/* ---------- 1. getReport (never throws) ---------- */

export async function getReport(token: string): Promise<CatalystReport> {
  const t = (token ?? "").trim();
  if (!API_BASE || !t) return NOT_FOUND;

  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
  try {
    const res = await fetch(`${API_BASE}/catalyst/report/${encodeURIComponent(t)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ctrl?.signal,
    });
    if (!res.ok) return NOT_FOUND;
    const json = (await res.json()) as Record<string, unknown>;
    const status = normStatus(json?.status);
    return {
      status,
      business_name: typeof json?.business_name === "string" ? json.business_name : null,
      generated_at: typeof json?.generated_at === "string" ? json.generated_at : null,
      tier: typeof json?.tier === "string" ? json.tier : null,
      paid: json?.paid === true,
      report: status === "complete" ? normReport(json?.report) : null,
      booking_url: typeof json?.booking_url === "string" ? json.booking_url : null,
    };
  } catch {
    return NOT_FOUND;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ---------- 2. payReport (never throws; null on any failure) ---------- */

export async function payReport(token: string, tier?: string): Promise<PayReportResult> {
  const t = (token ?? "").trim();
  if (!API_BASE || !t) return { checkout_url: null };

  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
  try {
    const res = await fetch(`${API_BASE}/catalyst/report/${encodeURIComponent(t)}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tier ? { tier } : {}),
      signal: ctrl?.signal,
    });
    if (!res.ok) return { checkout_url: null };
    const json = (await res.json()) as Record<string, unknown>;
    const url = typeof json?.checkout_url === "string" ? json.checkout_url.trim() : "";
    return { checkout_url: url || null };
  } catch {
    return { checkout_url: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
