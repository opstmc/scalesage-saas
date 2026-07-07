/**
 * Mini Catalyst Scan — config-driven, pure scoring logic.
 * "This isn't a form. It's a scan." · business doctor for SMEs · leak language.
 *
 * All copy, questions, severity deltas, thresholds and benchmark bands live in
 * catalyst.config.json. This module is pure and deterministic: no DOM, no fetch,
 * no dates except an injectable completed_at. The UI relies only on the exports
 * below, and every function guards its inputs so a missing or partial answer set
 * never throws.
 *
 * Honesty rules baked in:
 *  - Unverified job-value figures stay behind the per-sector `enabled` flag
 *    (only plumbers + electricians are ON); every band also sits behind the
 *    global `bandsEnabled` flag.
 *  - No enquiry-volume question exists, so the revenue band is directional off a
 *    team-size proxy and clearly labelled; it only ever renders for a verified
 *    sector, never a guessed one.
 *  - buildResult always leaves at least one node reading "Needs full scan" because
 *    a 13-question mini scan can flag a leak but cannot clear or confirm one.
 *  - Every self-reported node carries evidence tier "reported"; a live check
 *    (or the Q1 lookup) can honestly upgrade it to "checked" / "lookup".
 *
 * All customer-facing copy in the config is JW-approval-pending.
 */

import rawConfig from "@/catalyst.config.json";

/* ---------- Locked vocabulary (no synonyms) ---------- */

export type LeakKey =
  | "Missed calls"
  | "Cold quotes"
  | "Forgotten reviews"
  | "Lapsed customers"
  | "Invisible online"
  | "Admin drag";

export type SystemKey =
  | "Capture every enquiry"
  | "Convert every quote"
  | "Bring back every customer"
  | "Be findable everywhere"
  | "Run without you";

export type Chip = "Clear" | "Needs full scan" | "Likely" | "Detected";

export type SectorGroup = "A" | "B" | "C";

/** How a question is answered. `lookup` is Q1 (live business lookup). */
export type Kind = "single" | "multi" | "text" | "lookup";

/** Legacy UI input type. Derived from `kind` so the flow keeps rendering. */
export type InputType = "choose" | "multi" | "type";

/** Where a node's signal comes from. Self-report by default; a live check or the
 *  Q1 lookup can upgrade it. */
export type EvidenceTier = "lookup" | "checked" | "reported";

/* ---------- Config shape (JSON is cast to this) ---------- */

export interface StepOption {
  value: string;
  label: string;
  desc?: string;
  /** Q2 sector group. */
  group?: SectorGroup;
  /** Q4 team scale signals. */
  teamMin?: number;
  weeklyMid?: number;
  /** Q13 relief target + urgency. */
  relief?: LeakKey;
  urgency?: "low" | "medium" | "high";
  /** Severity added toward each leak when this option is chosen. Missing = 0. */
  deltas?: Partial<Record<LeakKey, number>>;
}

/** A question as stored in the config. */
interface ConfigQuestion {
  id: string;
  order: number;
  kind: Kind;
  kicker: string;
  question: string;
  hint?: string;
  insight?: string;
  insightApproval?: string;
  /** Adds an optional free-text "Something else" affordance in the UI. */
  other?: boolean;
  placeholder?: string;
  /** Key into config.groupStems for the sector-group stem swaps (Q7/Q8/Q10). */
  stemGroupKey?: string;
  options: StepOption[];
  [extra: string]: unknown;
}

/**
 * A question as the UI consumes it. Carries the config fields the flow reads
 * (`question`, `hint`, `kicker`, `insight`, `options`, `other`, `placeholder`)
 * plus a derived `inputType`, and mirrors the text under `stem`/`helper` for any
 * consumer that prefers those names.
 */
export interface Step extends ConfigQuestion {
  inputType: InputType;
  stem: string;
  helper?: string;
}

interface JobValueEntry {
  verified: boolean;
  enabled: boolean;
  low: number;
  high: number;
  emergencyCallout?: number;
  note?: string;
}

interface CatalystConfig {
  configVersion: string;
  currency: string;
  leaks: LeakKey[];
  systems: SystemKey[];
  leakToSystem: Record<LeakKey, SystemKey>;
  chipThresholds: { clear: number; needsFullScan: number; likely: number; detected: number };
  tier: { proTeamMin: number; proLikelyLeakCount: number; likelyThreshold: number };
  directionalTag: string;
  sectorGroups: Record<SectorGroup, { label: string; sectors: string[] }>;
  sectorPattern: Record<string, LeakKey[]>;
  groupStems: Record<string, Record<SectorGroup, string>>;
  questions: ConfigQuestion[];
  benchmarks: {
    bandsEnabled: boolean;
    jobValueBySector: Record<string, JobValueEntry>;
    captureLossRate: { bySeverity: Record<string, number> };
    adminDragMinutes: { perSeverityLow: number; perSeverityHigh: number };
  };
}

const config = rawConfig as unknown as CatalystConfig;

/* ---------- kind -> legacy inputType ---------- */

function inputTypeFor(kind: Kind): InputType {
  switch (kind) {
    case "multi":
      return "multi";
    case "text":
    case "lookup":
      return "type";
    case "single":
    default:
      return "choose";
  }
}

/* ---------- Public data ---------- */

/** The ordered 13-question mini-scan, sorted by `order`, ready for the UI. */
export const STEPS: Step[] = [...config.questions]
  .sort((a, b) => a.order - b.order)
  .map((q) => ({
    ...q,
    inputType: inputTypeFor(q.kind),
    stem: q.question,
    helper: q.hint,
  }));

/** The six leaks in canonical (display + tie-break) order. */
export const LEAKS: LeakKey[] = config.leaks;

/** The five install systems. */
export const SYSTEMS: SystemKey[] = config.systems;

export const CONFIG_VERSION = config.configVersion;

/* ---------- Answers + result types ---------- */

/** Answers keyed by question id. Multi-select values are string[]. Free-text
 *  "Other" reveals live under "<id>_other"; the open valve lives under
 *  "problems_raw". */
export type ScanAnswers = Record<string, string | string[] | number | undefined>;

export interface ScanNode {
  leak: LeakKey;
  severity: number;
  chip: Chip;
  needsFullScan: boolean;
  /** Evidence tier for this node: "reported" (self-report), "lookup" (Q1 live
   *  lookup surfaced it) or "checked" (a live background check measured it). */
  tier: EvidenceTier;
}

export interface Band {
  low: number;
  high: number;
  formula: string;
  enabled: boolean;
}

export interface ScanResult {
  sector: string;
  sectorLabel: string;
  sectorGroup: SectorGroup;
  directionalTag: string;
  nodes: ScanNode[];
  primaryLeak: LeakKey;
  secondaryLeak: LeakKey;
  needsFullScan: LeakKey[];
  fixFirst: SystemKey;
  tier: "Starter" | "Pro";
  revenueBand: Band;
  timeBand: Band;
}

/* ---------- Live evidence (optional; from /catalyst/lookup + /catalyst/checks) ---------- */

export interface LookupInput {
  sector?: string | null;
  incorporatedYear?: number | null;
  reviewCount?: number | null;
  rating?: number | null;
}

export interface ChecksInput {
  googleBusiness?: { exists?: boolean; rating?: number | null; reviewCount?: number | null; ranksPageOne?: boolean } | null;
  website?: { loads?: boolean; loadMs?: number | null; clickToCall?: boolean } | null;
  aiPresence?: { appears?: boolean } | null;
}

export interface ScanEvidence {
  lookup?: LookupInput | null;
  checks?: ChecksInput | null;
}

/* ---------- Small internal helpers ---------- */

const stepById = (id: string): Step | undefined => STEPS.find((s) => s.id === id);

function optionByValue(step: Step | undefined, value: string): StepOption | undefined {
  return step?.options?.find((o) => o.value === value);
}

/** Selected option values for a step, always as an array (single or multi). */
function selectedValues(a: ScanAnswers, id: string): string[] {
  const v = a?.[id];
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return [v];
  return [];
}

function zeroScores(): Record<LeakKey, number> {
  const out = {} as Record<LeakKey, number>;
  for (const l of LEAKS) out[l] = 0;
  return out;
}

/** Primary sector for grouping: first real Q2 selection, else a Q1-lookup sector,
 *  else "other". Ignores the UI's "__other__" free-text sentinel. */
export function sectorOf(a: ScanAnswers): string {
  const isReal = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v !== "__other__";
  for (const v of selectedValues(a, "sectors")) {
    if (isReal(v)) return v;
  }
  const single = a?.sector;
  if (isReal(single)) return single as string;
  return "other";
}

/** Sector group A/B/C for the chosen sector (falls back to A). */
export function groupOf(a: ScanAnswers): SectorGroup {
  const opt = optionByValue(stepById("sectors"), sectorOf(a));
  return opt?.group ?? "A";
}

/** The group-specific stem for a question (falls back to the base stem). */
export function stemFor(step: Step, group: SectorGroup): string {
  if (step?.stemGroupKey) {
    const swap = config.groupStems?.[step.stemGroupKey];
    if (swap && swap[group]) return swap[group];
  }
  return step?.stem ?? step?.question ?? "";
}

/** Convenience: resolve a step's stem for a given answer set. */
export function stemForAnswers(step: Step, a: ScanAnswers): string {
  return stemFor(step, groupOf(a));
}

/* ---------- Token piping ---------- */

/** Business name from Q1 (empty when unanswered). */
function businessName(a: ScanAnswers): string {
  const v = a?.business;
  return typeof v === "string" ? v.trim() : "";
}

/** Human label for the chosen sector. */
function sectorLabel(a: ScanAnswers): string {
  const opt = optionByValue(stepById("sectors"), sectorOf(a));
  return opt?.label ?? "";
}

/** First selected option's label for a question id, if resolvable. */
function firstSelectedLabel(a: ScanAnswers, id: string): string {
  const step = stepById(id);
  for (const v of selectedValues(a, id)) {
    const opt = optionByValue(step, v);
    if (opt) return opt.label;
  }
  return "";
}

/**
 * Replace {business}, {sector} and any other {token} in a copy string with the
 * answer set's values. Unknown/unanswered tokens collapse away rather than
 * showing a raw {token}. Never throws.
 */
export function pipe(text: string, a: ScanAnswers): string {
  if (typeof text !== "string" || !text) return text ?? "";
  const answers = a ?? {};
  return text
    .replace(/\{(\w+)\}/g, (_m, key: string) => {
      if (key === "business") return businessName(answers) || "your business";
      if (key === "sector") return sectorLabel(answers) || "your business";
      const label = firstSelectedLabel(answers, key);
      if (label) return label;
      const raw = answers[key];
      if (typeof raw === "string" && raw) return raw;
      if (typeof raw === "number") return String(raw);
      if (Array.isArray(raw) && raw.length) {
        return raw.map((v) => firstSelectedLabel({ [key]: v }, key) || v).join(", ");
      }
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1");
}

/* ---------- Scoring ---------- */

/** Sum the per-option severity deltas across every answered question. */
export function scoreLeaks(a: ScanAnswers): Record<LeakKey, number> {
  const scores = zeroScores();
  const answers = a ?? {};
  for (const step of STEPS) {
    for (const value of selectedValues(answers, step.id)) {
      const opt = optionByValue(step, value);
      if (!opt || !opt.deltas) continue;
      for (const leak of LEAKS) {
        const d = opt.deltas[leak];
        if (d) scores[leak] += d;
      }
    }
  }
  return scores;
}

/** Map a summed severity to its chip using the config thresholds. */
export function chipFor(severity: number): Chip {
  const t = config.chipThresholds;
  const s = typeof severity === "number" && Number.isFinite(severity) ? severity : 0;
  if (s >= t.detected) return "Detected";
  if (s >= t.likely) return "Likely";
  if (s >= t.needsFullScan) return "Needs full scan";
  return "Clear";
}

/* ---------- Tie-breaking + primary/secondary ---------- */

/** Relief leak chosen in Q13, if any (used only as a tie-breaker). */
function reliefLeak(a: ScanAnswers): LeakKey | null {
  const v = a?.relief;
  if (typeof v !== "string") return null;
  return optionByValue(stepById("relief"), v)?.relief ?? null;
}

/**
 * Rank leaks by severity, breaking ties by (1) the sector's leak pattern,
 * then (2) the Q13 relief choice, then (3) canonical leak order. Returns the
 * full ordering so primary/secondary read straight off the front.
 */
function rankedLeaks(a: ScanAnswers, scores: Record<LeakKey, number>): LeakKey[] {
  const pattern = config.sectorPattern[sectorOf(a)] ?? config.sectorPattern.other;
  const relief = reliefLeak(a);
  const patternRank = (l: LeakKey) => {
    const i = pattern.indexOf(l);
    return i === -1 ? pattern.length : i;
  };
  const canonicalRank = (l: LeakKey) => LEAKS.indexOf(l);

  return [...LEAKS].sort((x, y) => {
    if (scores[y] !== scores[x]) return scores[y] - scores[x];
    if (patternRank(x) !== patternRank(y)) return patternRank(x) - patternRank(y);
    if (relief) {
      if (x === relief && y !== relief) return -1;
      if (y === relief && x !== relief) return 1;
    }
    return canonicalRank(x) - canonicalRank(y);
  });
}

export function primaryLeak(a: ScanAnswers): LeakKey {
  return rankedLeaks(a, scoreLeaks(a))[0];
}

export function secondaryLeak(a: ScanAnswers): LeakKey {
  return rankedLeaks(a, scoreLeaks(a))[1];
}

/* ---------- Leak → system ---------- */

export function fixFirstSystem(primary: LeakKey): SystemKey {
  return config.leakToSystem[primary] ?? config.systems[0];
}

/* ---------- Tier ---------- */

/** Minimum headcount implied by the Q4 team answer (0 when unanswered). */
function teamMin(a: ScanAnswers): number {
  const v = a?.team;
  if (typeof v !== "string") return 0;
  return optionByValue(stepById("team"), v)?.teamMin ?? 0;
}

/** Directional weekly-enquiry proxy from the Q4 team answer (0 when unanswered). */
function weeklyEnquiryProxy(a: ScanAnswers): number {
  const v = a?.team;
  if (typeof v !== "string") return 0;
  return optionByValue(stepById("team"), v)?.weeklyMid ?? 0;
}

/**
 * Pro if the team is 6+ (Q4) OR three-or-more leaks sit at severity ≥ 2.
 * Otherwise Starter. The scan never recommends Max.
 */
export function matchTier(a: ScanAnswers): "Starter" | "Pro" {
  const { proTeamMin, proLikelyLeakCount, likelyThreshold } = config.tier;
  if (teamMin(a) >= proTeamMin) return "Pro";
  const scores = scoreLeaks(a);
  const likelyOrWorse = LEAKS.filter((l) => scores[l] >= likelyThreshold).length;
  return likelyOrWorse >= proLikelyLeakCount ? "Pro" : "Starter";
}

/* ---------- Benchmark bands (behind flags) ---------- */

const DISABLED_BAND: Band = { low: 0, high: 0, formula: "", enabled: false };

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Directional monthly revenue at risk. Enabled only when bands are globally on
 * AND the sector has a VERIFIED job value (plumbers, electricians). With no
 * enquiry-volume question in the scan, the volume comes from a team-size proxy
 * and the band is clearly labelled directional. Every other sector, and any
 * missing input, returns enabled:false so no guessed figure ever shows.
 */
export function revenueBand(a: ScanAnswers): Band {
  if (!config.benchmarks.bandsEnabled) return DISABLED_BAND;
  const sector = sectorOf(a);
  const job = config.benchmarks.jobValueBySector[sector];
  if (!job || !job.enabled) return DISABLED_BAND;

  const enquiries = weeklyEnquiryProxy(a);
  if (enquiries <= 0) return DISABLED_BAND;

  const capture = scoreLeaks(a)["Missed calls"];
  const rateKey = String(Math.min(Math.max(capture, 0), 3));
  const lossRate = config.benchmarks.captureLossRate.bySeverity[rateKey] ?? 0;
  if (lossRate <= 0) return DISABLED_BAND;

  const missedPerMonth = enquiries * lossRate * 4.33;
  const low = round10(missedPerMonth * job.low);
  const high = round10(missedPerMonth * job.high);
  if (high <= 0) return DISABLED_BAND;

  const formula =
    "Directional. About " +
    enquiries +
    " enquiries a week from your team size, " +
    Math.round(lossRate * 100) +
    "% at risk, £" +
    job.low +
    " to £" +
    job.high +
    " a job. The full scan confirms it in your numbers.";
  return { low, high, formula, enabled: true };
}

/**
 * Directional weekly minutes lost to manual admin, from the Admin drag severity
 * and the "Likely" per-severity minute table. Enabled whenever bands are on and
 * some admin signal exists; otherwise enabled:false with guard values.
 */
export function timeBand(a: ScanAnswers): Band {
  if (!config.benchmarks.bandsEnabled) return DISABLED_BAND;
  const admin = scoreLeaks(a)["Admin drag"];
  if (admin <= 0) return DISABLED_BAND;

  const { perSeverityLow, perSeverityHigh } = config.benchmarks.adminDragMinutes;
  const low = admin * perSeverityLow;
  const high = admin * perSeverityHigh;
  if (high <= 0) return DISABLED_BAND;

  return {
    low: Math.round(low),
    high: Math.round(high),
    formula:
      "Likely estimate, not measured. About " +
      Math.round(low) +
      " to " +
      Math.round(high) +
      " minutes a week on manual admin. The full scan measures the real number.",
    enabled: true,
  };
}

/* ---------- Evidence tiers ---------- */

/**
 * Evidence tier for a leak node. Self-report is the floor. A live background
 * check upgrades the leaks it can actually measure to "checked"; failing that,
 * the Q1 lookup can surface review signal as "lookup". Never invents evidence.
 */
function evidenceTierForLeak(leak: LeakKey, ev?: ScanEvidence): EvidenceTier {
  const checks = ev?.checks;
  if (checks) {
    if (
      leak === "Invisible online" &&
      (checks.googleBusiness != null || checks.aiPresence != null || (checks.website != null && checks.website.loads !== undefined))
    ) {
      return "checked";
    }
    if (leak === "Forgotten reviews" && checks.googleBusiness != null) return "checked";
    if (leak === "Missed calls" && checks.website != null && checks.website.clickToCall !== undefined) return "checked";
  }
  const lookup = ev?.lookup;
  if (lookup) {
    if (leak === "Forgotten reviews" && lookup.reviewCount != null) return "lookup";
    if (leak === "Invisible online" && (lookup.reviewCount != null || lookup.rating != null)) return "lookup";
  }
  return "reported";
}

/* ---------- Result assembly ---------- */

export function buildResult(a: ScanAnswers, evidence?: ScanEvidence): ScanResult {
  const answers = a ?? {};
  const scores = scoreLeaks(answers);
  const ranked = rankedLeaks(answers, scores);
  const primary = ranked[0];
  const secondary = ranked[1];

  const nodes: ScanNode[] = LEAKS.map((leak) => {
    const chip = chipFor(scores[leak]);
    return {
      leak,
      severity: scores[leak],
      chip,
      needsFullScan: chip === "Needs full scan",
      tier: evidenceTierForLeak(leak, evidence),
    };
  });

  // Honesty guarantee: a 13-question mini scan can flag a leak but cannot clear
  // or confirm one, so the result must always carry at least one "Needs full
  // scan" node. Prefer to relabel the weakest zero-signal "Clear" node (never a
  // real Likely/Detected finding). If every leak already carries signal, defer
  // the single weakest non-primary node to the full scan — that under-claims
  // (safe/honest), it never over-claims. The primary leak is left untouched.
  if (!nodes.some((n) => n.needsFullScan)) {
    const candidates = nodes.filter((n) => n.leak !== primary);
    const clears = candidates.filter((n) => n.chip === "Clear");
    const pool = clears.length ? clears : candidates;
    const target = [...pool].sort(
      (x, y) => x.severity - y.severity || LEAKS.indexOf(x.leak) - LEAKS.indexOf(y.leak),
    )[0];
    if (target) {
      target.chip = "Needs full scan";
      target.needsFullScan = true;
    }
  }

  const sector = sectorOf(answers);
  const sectorOpt = optionByValue(stepById("sectors"), sector);

  return {
    sector,
    sectorLabel: sectorOpt?.label ?? "your business",
    sectorGroup: groupOf(answers),
    directionalTag: config.directionalTag,
    nodes,
    primaryLeak: primary,
    secondaryLeak: secondary,
    needsFullScan: nodes.filter((n) => n.needsFullScan).map((n) => n.leak),
    fixFirst: fixFirstSystem(primary),
    tier: matchTier(answers),
    revenueBand: revenueBand(answers),
    timeBand: timeBand(answers),
  };
}

/* ---------- Backend payload (API contract §3) ---------- */

export interface ScanContact {
  name?: string;
  business?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  urgency?: string;
  bestTime?: string;
}

export interface ScanMeta {
  utmSource?: string | null;
  problemsRaw?: string;
  intake?: Record<string, unknown>;
  completedAt?: string;
}

/** Urgency signalled by the Q13 relief choice. */
function urgencyOf(a: ScanAnswers): string {
  const v = a?.relief;
  if (typeof v !== "string") return "medium";
  return optionByValue(stepById("relief"), v)?.urgency ?? "medium";
}

export function buildPayload(a: ScanAnswers, contact: ScanContact, meta: ScanMeta = {}) {
  const answers = a ?? {};
  const result = buildResult(answers);
  const answerList = STEPS.map((s) => ({ id: s.id, value: answers[s.id] ?? null }));

  // Free-text "Other" reveals collected alongside the scan feed the intake bag.
  const others: Record<string, unknown> = {};
  for (const s of STEPS) {
    const o = answers[`${s.id}_other`];
    if (typeof o === "string" && o.trim()) others[`${s.id}_other`] = o.trim();
  }
  const intake: Record<string, unknown> = { ...others, ...(meta.intake ?? {}) };

  const problemsRaw =
    meta.problemsRaw ?? (typeof answers.problems_raw === "string" ? answers.problems_raw : "");

  return {
    sector: result.sector,
    sector_group: result.sectorGroup,
    sectors: selectedValues(answers, "sectors"),
    sources: selectedValues(answers, "sources"),
    years: typeof answers.years === "string" ? answers.years : null,
    team: typeof answers.team === "string" ? answers.team : null,
    answers: answerList,
    leak_severities: scoreLeaks(answers),
    primary_leak: result.primaryLeak,
    secondary_leak: result.secondaryLeak,
    needs_full_scan: result.needsFullScan,
    fix_first_system: result.fixFirst,
    tier_match: result.tier,
    revenue_band: result.revenueBand,
    time_band: result.timeBand,
    urgency: urgencyOf(answers),
    problems_raw: problemsRaw,
    intake,
    contact,
    utm_source: meta.utmSource ?? null,
    config_version: CONFIG_VERSION,
    completed_at: meta.completedAt ?? new Date().toISOString(),
  };
}
