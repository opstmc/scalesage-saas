/**
 * Presentation metadata + tolerant normalizers for the /catalyst mini-scan UI.
 *
 * SCORING LIVES IN lib/catalyst.ts (built in parallel). This file is the single
 * place the UI adapts to that contract, so any shape mismatch found at
 * integration is fixed here, not scattered across five components.
 *
 * Contract consumed (see brief §2):
 *   STEPS, ScanAnswers, LeakKey, SystemKey, ScanResult,
 *   scoreLeaks, chipFor, primaryLeak, secondaryLeak, fixFirstSystem,
 *   matchTier, revenueBand, timeBand, buildResult, buildPayload, pipe
 *
 * The normalizers accept either a bare string key/state or a richer object
 * ({ key, label, ... }) so the components render correctly regardless of which
 * shape lib/catalyst.ts settles on.
 */

import type { ChecksResult, LookupMatch } from "@/lib/catalyst-api";

// ---- chip states (worst -> best severity is not implied; these are labels) ----
export type ChipTone = "clear" | "scan" | "likely" | "detected";

export const CHIP_LABEL: Record<ChipTone, string> = {
  clear: "Clear",
  scan: "Needs full scan",
  likely: "Likely",
  detected: "Detected",
};

// dot colour per tone (token-based, never hardcoded hex)
export const CHIP_DOT: Record<ChipTone, string> = {
  clear: "var(--text-faint)",
  scan: "var(--text-muted)",
  likely: "var(--accent-primary)",
  detected: "var(--accent-glow)",
};

// map a chip's tone -> CSS-module class name is done in the component.

// ---- the six leak nodes (brief §2.7) ----
// Keyed loosely by string so we stay in sync whatever literals lib/catalyst
// uses for LeakKey. "search" and "visibility" both map to the visibility node.
export const LEAK_LABEL: Record<string, string> = {
  calls: "Missed calls",
  quotes: "Cold quotes",
  reviews: "Forgotten reviews",
  lapsed: "Lapsed customers",
  visibility: "Invisible online",
  search: "Invisible online",
  admin: "Admin drag",
};

// preferred render order for the map; unknown keys are appended in given order
export const LEAK_ORDER = ["calls", "quotes", "reviews", "lapsed", "visibility", "search", "admin"];

// ---- systems (fix-first) ----
export const SYSTEM_LABEL: Record<string, string> = {
  voice: "Voice AI",
  calls: "Voice AI",
  followup: "Quote follow-up",
  quotes: "Quote follow-up",
  reviews: "Review engine",
  reactivation: "Customer reactivation",
  lapsed: "Customer reactivation",
  visibility: "AEO / GEO visibility",
  search: "AEO / GEO visibility",
  admin: "Ops automation",
  ops: "Ops automation",
};

function prettify(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function leakLabel(key: unknown): string {
  const k = String(key ?? "").toLowerCase();
  return LEAK_LABEL[k] ?? (k ? prettify(k) : "");
}

// ---- normalizers -------------------------------------------------------------

/** A chip value can be a tone string, or an object carrying tone/label. */
export interface ResolvedChip {
  tone: ChipTone;
  label: string;
}

const TONE_ALIASES: Record<string, ChipTone> = {
  clear: "clear",
  none: "clear",
  ok: "clear",
  scan: "scan",
  needsscan: "scan",
  "needs full scan": "scan",
  unknown: "scan",
  likely: "likely",
  possible: "likely",
  detected: "detected",
  found: "detected",
  confirmed: "detected",
};

function toTone(x: unknown): ChipTone {
  const s = String(x ?? "").toLowerCase().replace(/[_-]+/g, "");
  return TONE_ALIASES[s] ?? TONE_ALIASES[String(x ?? "").toLowerCase()] ?? "scan";
}

/**
 * Normalize whatever chipFor(...) / scoreLeaks(...)[key] returns into a
 * { tone, label } the map can render. Accepts:
 *   "detected" | { tone/state: "detected", label?: "..." } | { label: "Detected" }
 */
export function resolveChip(raw: unknown): ResolvedChip {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const tone = toTone(o.tone ?? o.state ?? o.status ?? o.level ?? o.label);
    const label = typeof o.label === "string" ? o.label : CHIP_LABEL[tone];
    return { tone, label };
  }
  const tone = toTone(raw);
  return { tone, label: CHIP_LABEL[tone] };
}

/** Normalize primaryLeak / secondaryLeak output -> { key, label } | null. */
export interface ResolvedLeak {
  key: string;
  label: string;
}
export function resolveLeak(raw: unknown): ResolvedLeak | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    if (!raw) return null;
    return { key: raw, label: leakLabel(raw) };
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const key = String(o.key ?? o.id ?? o.leak ?? "");
    if (!key) return null;
    const label = typeof o.label === "string" ? o.label : leakLabel(key);
    return { key, label };
  }
  return null;
}

/** Normalize fixFirstSystem(...) -> { key, label, blurb }. */
export interface ResolvedSystem {
  key: string;
  label: string;
  blurb: string;
}
export function resolveSystem(raw: unknown): ResolvedSystem | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const k = raw.toLowerCase();
    return { key: raw, label: SYSTEM_LABEL[k] ?? prettify(raw), blurb: "" };
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const key = String(o.key ?? o.id ?? o.system ?? "");
    const label =
      typeof o.label === "string"
        ? o.label
        : typeof o.name === "string"
          ? o.name
          : SYSTEM_LABEL[key.toLowerCase()] ?? prettify(key);
    const blurb =
      typeof o.blurb === "string"
        ? o.blurb
        : typeof o.note === "string"
          ? o.note
          : typeof o.description === "string"
            ? o.description
            : "";
    return { key, label, blurb };
  }
  return null;
}

/** Normalize matchTier(...) -> { key: "starter"|"pro", label }. Never "max". */
export interface ResolvedTier {
  key: string;
  label: string;
}
export function resolveTier(raw: unknown): ResolvedTier {
  let key = "";
  let label = "";
  if (typeof raw === "string") {
    key = raw;
  } else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    key = String(o.key ?? o.tier ?? o.id ?? "");
    if (typeof o.label === "string") label = o.label;
  }
  key = key.toLowerCase();
  // brief: Starter or Pro only, never Max — clamp defensively.
  if (key === "max") key = "pro";
  if (!key) key = "starter";
  if (!label) label = prettify(key);
  return { key, label };
}

/** Normalize revenueBand / timeBand -> { enabled, value, formula, note }. */
export interface ResolvedBand {
  enabled: boolean;
  value: string;
  formula: string;
  note: string;
}
export function resolveBand(raw: unknown): ResolvedBand {
  if (!raw || typeof raw !== "object") {
    return { enabled: false, value: "", formula: "", note: "" };
  }
  const o = raw as Record<string, unknown>;
  const str = (...keys: string[]): string => {
    for (const k of keys) {
      const v = o[k];
      if (typeof v === "string" && v) return v;
      if (typeof v === "number") return String(v);
    }
    return "";
  };
  return {
    enabled: Boolean(o.enabled ?? o.show ?? o.visible),
    value: str("value", "headline", "amount", "display", "band"),
    formula: str("formula", "maths", "math", "working", "calc"),
    note: str("note", "caption", "detail"),
  };
}

/** Read booleans off ScanResult without hard-coupling to its exact field names. */
export function isNoFit(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  const o = result as Record<string, unknown>;
  return Boolean(o.noFit ?? o.tooLittle ?? o.insufficient ?? o.no_fit);
}
export function visibilityFires(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  const o = result as Record<string, unknown>;
  return Boolean(o.visibilityFires ?? o.visibility ?? o.frontier ?? o.visibility_fires);
}

// ---- evidence tiers (brief: ResultScreen §3) --------------------------------
//
// Every ScanNode carries a `tier` that says how solid its signal is:
//   "lookup"   — pulled from the Q1 live business lookup (Companies House / Places)
//   "checked"  — confirmed by the live background checks
//   "reported" — inferred from what the visitor told us in Q5–Q13 (directional)
//
// "lookup" and "checked" facts are stated FLAT; "reported" findings are framed
// "based on what you told me" and tagged Directional. When lib/catalyst does not
// supply a tier (older shape), we treat the node as "reported" — the honest
// default, since a self-reported answer is never presented as a verified fact.

export type EvidenceTier = "lookup" | "checked" | "reported";

export function resolveNodeTier(node: unknown): EvidenceTier {
  if (node && typeof node === "object") {
    const t = String((node as Record<string, unknown>).tier ?? "").toLowerCase();
    if (t === "lookup" || t === "checked" || t === "reported") return t;
  }
  return "reported";
}

/** A live, verified fact — stated flat, never tagged Directional. */
export interface LiveFact {
  text: string;
  /** "lookup" (Q1) or "checked" (background checks). */
  source: EvidenceTier;
}

const secs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s` : `${ms}ms`);

/**
 * Flat, verifiable statements from the Q1 lookup + the background checks. All
 * copy JW-approval-pending. Returns [] when nothing was verified, so the UI
 * simply shows no "we checked" block rather than an empty shell. `ai_presence`
 * is ALWAYS framed as a same-day snapshot, never a hard ranking (contract §2).
 */
export function liveFacts(checks: ChecksResult | null | undefined, lookup: LookupMatch | null | undefined): LiveFact[] {
  const out: LiveFact[] = [];

  // ---- Q1 lookup facts (stated flat) ----
  if (lookup) {
    if (typeof lookup.incorporated_year === "number") {
      out.push({ text: `Companies House shows you trading since ${lookup.incorporated_year}.`, source: "lookup" });
    }
    if (typeof lookup.review_count === "number" && lookup.review_count > 0) {
      const rating = typeof lookup.rating === "number" ? ` at ${lookup.rating.toFixed(1)}★` : "";
      out.push({ text: `We found you on Google with ${lookup.review_count} reviews${rating}.`, source: "lookup" });
    }
  }

  // ---- background-check facts (stated flat, deduped vs. lookup) ----
  const gb = checks?.google_business;
  if (gb?.exists) {
    if (typeof gb.review_count === "number" && !out.some((f) => f.text.startsWith("We found you on Google"))) {
      const rating = typeof gb.rating === "number" ? ` at ${gb.rating.toFixed(1)}★` : "";
      out.push({ text: `We checked Google: ${gb.review_count} reviews${rating}.`, source: "checked" });
    }
    if (gb.ranks_page_one === false) {
      out.push({ text: "We checked and you are not on page one for your core local search yet.", source: "checked" });
    }
  }

  const web = checks?.website;
  if (web) {
    if (web.loads && typeof web.load_ms === "number" && web.load_ms > 3000) {
      out.push({ text: `We loaded your site: about ${secs(web.load_ms)} to open, slow enough to lose taps.`, source: "checked" });
    }
    if (web.loads === false) {
      out.push({ text: "We checked and your website did not load for us on the day.", source: "checked" });
    } else if (web.click_to_call === false) {
      out.push({ text: "We checked your site and found no tap-to-call for mobile visitors.", source: "checked" });
    }
  }

  const ai = checks?.ai_presence;
  if (ai && ai.appears === false) {
    const note = ai.note ? ` (${ai.note})` : " (a snapshot on the day, it varies by prompt and model)";
    out.push({ text: `On the day we checked, you did not come up when we asked AI for a business like yours${note}.`, source: "checked" });
  }

  return out;
}
