/**
 * What Sage recommends, and why — held apart from what the visitor CHOOSES.
 *
 * Decision (04 August review): "Subscription/bolt-on selection stays with the
 * user. Catalyst can recommend and upsell, but the user makes the final plan and
 * bolt-on choice, never auto-selected by the agent."
 *
 * So this file only ever produces a RECOMMENDATION: a plan key, an optional
 * reason, and the add-ons the findings actually point at. It holds no selection
 * state and it never returns something pre-ticked. Selection lives in
 * PlanChoice, starts empty, and only the visitor can fill it.
 *
 * Prices and plan copy are read from lib/offer.ts, which is the single source of
 * truth for the offer. Nothing here restates a price.
 */

import { BOLT_ONS, TIERS } from "@/lib/offer";
import { resolveChip, resolveLeak, resolveSystem, resolveTier } from "./meta";

export type PlanKey = "starter" | "pro" | "max";

export interface PlanOption {
  key: PlanKey;
  name: string;
  price: string;
  setup: string;
  /** "Best for: …" with the label stripped, so the UI can frame it itself. */
  bestFor: string;
  meaning: string;
  /** Max is waitlist-only, so it cannot be bought from a button today. */
  waitlist: boolean;
  waitlistNote: string | null;
}

export const PLANS: PlanOption[] = TIERS.map((t) => ({
  key: t.key,
  name: t.name,
  price: t.price,
  setup: t.setup,
  bestFor: t.best.replace(/^best for:\s*/i, ""),
  meaning: t.meaning,
  waitlist: t.waitlist === true,
  waitlistNote: t.waitlistNote ?? null,
}));

export function planByKey(key: PlanKey | null): PlanOption | null {
  if (!key) return null;
  return PLANS.find((p) => p.key === key) ?? null;
}

/** "Pro" / "pro" / { tier: "Pro" } / "PRO PLAN" -> "pro". Unknown -> null. */
export function planKeyFrom(raw: unknown): PlanKey | null {
  const value =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object"
        ? String((raw as Record<string, unknown>).tier ?? (raw as Record<string, unknown>).key ?? "")
        : "";
  const s = value.toLowerCase();
  if (!s) return null;
  if (s.includes("starter")) return "starter";
  if (s.includes("pro")) return "pro";
  if (s.includes("max")) return "max";
  return null;
}

/* ---- add-ons the evidence actually points at ---------------------------- */

export interface BoltOnOption {
  item: string;
  standalone: string;
  subscriber: string;
  note: string | null;
  /** Plan names this is already part of, so we never sell someone what they have. */
  includedAt: string[];
}

export const BOLT_ON_OPTIONS: BoltOnOption[] = BOLT_ONS.map((b) => ({
  item: b.item,
  standalone: b.standalone,
  subscriber: b.subscriber,
  note: b.note ?? null,
  includedAt: b.includedAt ?? [],
}));

export function boltOnByItem(item: string): BoltOnOption | null {
  return BOLT_ON_OPTIONS.find((b) => b.item === item) ?? null;
}

/** Already part of the plan the visitor has picked? (No pick -> not known.) */
export function includedInPlan(bolt: BoltOnOption, plan: PlanKey | null): boolean {
  if (!plan) return false;
  const name = planByKey(plan)?.name ?? "";
  return bolt.includedAt.some((t) => t.toLowerCase() === name.toLowerCase());
}

/**
 * Map a finding (a fix-first system key, a system label, a build-plan line) to
 * the add-ons that finding supports. Keyword-matched on purpose: the same idea
 * arrives as "voice", "Voice AI", "Capture every enquiry" or a sentence from the
 * report's build plan depending on which screen is asking.
 */
const BOLT_ON_SIGNALS: { item: string; test: RegExp }[] = [
  { item: "Voice AI agent, 500 minutes", test: /\bvoice\b|missed call|answer(ing)? (the )?call|call handling|capture every enquiry/i },
  { item: "Missed-call SMS bot", test: /missed[- ]call|text[- ]back|\bsms\b/i },
  { item: "Frontier Visibility, weekly active", test: /visib|aeo|geo|\bseo\b|search|findable|ai answer/i },
  { item: "Database reactivation", test: /reactivat|dormant|lapsed|database|bring back/i },
  { item: "LinkedIn outreach", test: /linkedin|outreach|prospect/i },
  { item: "Full website build", test: /website|web site|site (build|rebuild)/i },
  { item: "Landing page", test: /landing page/i },
];

export interface BoltOnRecommendation {
  item: string;
  /** Why it is being suggested, in the visitor's own findings. Never invented. */
  reason: string;
}

/**
 * The add-ons the findings support, each carrying the finding that raised it.
 * `signals` are { text, because } pairs: `text` is matched, `because` is the
 * sentence shown to the reader. Returns [] when nothing matches, and the UI then
 * shows no recommended add-ons rather than inventing one.
 */
export function recommendedBoltOns(
  signals: { text: string; because: string }[],
): BoltOnRecommendation[] {
  const out: BoltOnRecommendation[] = [];
  for (const signal of signals) {
    const text = (signal.text ?? "").trim();
    if (!text) continue;
    for (const sig of BOLT_ON_SIGNALS) {
      if (!sig.test.test(text)) continue;
      if (out.some((o) => o.item === sig.item)) continue;
      if (!boltOnByItem(sig.item)) continue;
      out.push({ item: sig.item, reason: signal.because });
    }
  }
  return out;
}

/* ---- what the visitor has chosen (never what we suggest) ---------------- */

export interface PlanSelection {
  plan: PlanKey | null;
  /** Bolt-on item names, exactly as they appear in lib/offer.ts. */
  boltOns: string[];
}

/** The only valid starting state, everywhere. Nothing chosen. */
export const EMPTY_SELECTION: PlanSelection = { plan: null, boltOns: [] };

/** Guard for a selection read back out of storage. */
export function isPlanSelection(v: unknown): v is PlanSelection {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const planOk = o.plan === null || o.plan === "starter" || o.plan === "pro" || o.plan === "max";
  return planOk && Array.isArray(o.boltOns) && o.boltOns.every((x) => typeof x === "string");
}

/* ---- why this plan ------------------------------------------------------ */

/**
 * The mini scan's own rule, stated back in plain English, and only the part of
 * it that actually fired. matchTier (lib/catalyst) picks Pro when the team is
 * six or more, OR when three or more of the six systems score "likely" or worse.
 * Anything we cannot see returns null, and the UI then shows the recommendation
 * with no reason attached rather than a manufactured one.
 */
export function scanTierReason(opts: {
  plan: PlanKey | null;
  /** Q4 team answer, e.g. "6-15". */
  team: unknown;
  /** How many of the six nodes came back "Detected" or "Likely". */
  flagged: number;
}): string | null {
  const { plan, team, flagged } = opts;
  if (!plan) return null;
  const teamValue = typeof team === "string" ? team : "";
  const bigTeam = teamValue === "6-15" || teamValue === "16-50" || teamValue === "50-plus";

  if (plan === "pro") {
    if (bigTeam && flagged >= 3) {
      return `You told Sage there are six or more of you, and ${flagged} of your six systems came back flagged.`;
    }
    if (bigTeam) return "You told Sage there are six or more of you, which is where the Pro systems start to pay for themselves.";
    if (flagged >= 3) return `${flagged} of your six systems came back flagged, not one.`;
    return null;
  }
  if (plan === "starter") {
    if (flagged === 0) return null;
    if (flagged === 1) return "One of your six systems is flagged so far, so there is one thing to plug first.";
    return `${flagged} of your six systems are flagged so far, which is a Starter-sized job rather than a rebuild.`;
  }
  return null;
}

/** How many of the six leak nodes came back "Detected" or "Likely". */
export function flaggedNodeCount(result: unknown): number {
  if (!result || typeof result !== "object") return 0;
  const nodes = (result as Record<string, unknown>).nodes;
  if (!Array.isArray(nodes)) return 0;
  return nodes.filter((n) => {
    const tone = resolveChip((n as Record<string, unknown>)?.chip).tone;
    return tone === "detected" || tone === "likely";
  }).length;
}

/* ---- the whole recommendation, from one place --------------------------- */

export interface Recommended {
  plan: PlanKey | null;
  /** Null whenever the findings do not support one. Never filled with filler. */
  reason: string | null;
  boltOns: BoltOnRecommendation[];
}

export const NO_RECOMMENDATION: Recommended = { plan: null, reason: null, boltOns: [] };

/**
 * What the MINI scan recommends, read off the same ScanResult the leak map is
 * drawn from. The result screen and the plan chooser both call this, so the two
 * cannot drift into recommending different things on consecutive screens.
 */
export function scanRecommendation(result: unknown, answers: unknown): Recommended {
  if (!result || typeof result !== "object") return NO_RECOMMENDATION;
  const r = result as Record<string, unknown>;
  const plan = planKeyFrom(resolveTier(r.tier).key);
  const team = (answers as Record<string, unknown> | null | undefined)?.team;
  const reason = scanTierReason({ plan, team, flagged: flaggedNodeCount(result) });

  const system = resolveSystem(r.fixFirst);
  const primary = resolveLeak(r.primaryLeak);
  const signals: { text: string; because: string }[] = [];
  if (system) {
    signals.push({
      text: `${system.key} ${system.label}`,
      because: `Sage put ${system.label} first for you.`,
    });
  }
  if (primary) {
    signals.push({
      text: `${primary.key} ${primary.label}`,
      because: `Your primary leak came back as ${primary.label.toLowerCase()}.`,
    });
  }
  return { plan, reason, boltOns: recommendedBoltOns(signals) };
}

/**
 * What the FULL 24h report recommends. The tier and the "why" are the
 * backend's own words (report.recommendation), and the add-ons are matched off
 * the build plan it wrote. Nothing is inferred beyond what the report says.
 */
export function reportRecommendation(opts: {
  tier: unknown;
  why?: string | null;
  buildPlan?: { title?: string; system?: string; detail?: string }[];
}): Recommended {
  const plan = planKeyFrom(opts.tier);
  const why = typeof opts.why === "string" && opts.why.trim() ? opts.why.trim() : null;
  const steps = Array.isArray(opts.buildPlan) ? opts.buildPlan : [];
  const signals = steps
    .map((s) => {
      const label = (s?.title || s?.system || "").trim();
      const text = `${label} ${s?.system ?? ""}`.trim();
      return label ? { text, because: `Your build plan starts with ${label}.` } : null;
    })
    .filter((s): s is { text: string; because: string } => s !== null);
  return { plan, reason: why, boltOns: recommendedBoltOns(signals) };
}
