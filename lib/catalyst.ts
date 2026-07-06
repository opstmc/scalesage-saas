/**
 * Mini Catalyst Scan — config-driven, pure scoring logic.
 * "This isn't a form. It's a scan." · business doctor for SMEs · leak language.
 *
 * All copy, questions, severity deltas, thresholds and benchmark bands live in
 * catalyst.config.json. This module is pure and deterministic: no DOM, no fetch,
 * no dates except an injectable completed_at. The UI agent relies only on the
 * exports below.
 *
 * Honesty rules baked in: unverified job-value figures stay behind the per-sector
 * `enabled` flag (only plumbers + electricians are ON), every band sits behind the
 * global `bandsEnabled` flag, and buildResult guarantees at least one honest
 * "Needs full scan" chip because a ten-question mini-scan cannot clear a leak.
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

export type InputType = "choose" | "multi" | "type" | "text";

/* ---------- Config shape (JSON is cast to this) ---------- */

export interface StepOption {
  value: string;
  label: string;
  desc?: string;
  /** Q1 sector group + Q10 relief target, where present. */
  group?: SectorGroup;
  relief?: LeakKey;
  urgency?: "low" | "medium" | "high";
  /** Q2 volume band + midpoint used by the revenue band. */
  band?: string;
  weeklyMid?: number;
  /** "Other" reveals a free type-in field in the UI. */
  typeIn?: boolean;
  /** Severity added toward each leak when this option is chosen. Missing = 0. */
  deltas?: Partial<Record<LeakKey, number>>;
}

export interface Step {
  id: string;
  kicker: string;
  stem: string;
  /** Key into config.groupStems — present on the group-swapping questions. */
  stemGroupKey?: string;
  inputType: InputType;
  helper?: string;
  insight?: string;
  insightApproval?: string;
  options: StepOption[];
}

interface JobValueEntry {
  verified: boolean;
  enabled: boolean;
  low: number;
  high: number;
  emergencyCallout?: number;
  note?: string;
}

interface TaskTime {
  label: string;
  minutesLow: number;
  minutesHigh: number;
  perWeekLow?: number;
  perWeekHigh?: number;
  perJob?: boolean;
}

interface CatalystConfig {
  configVersion: string;
  currency: string;
  leaks: LeakKey[];
  systems: SystemKey[];
  leakToSystem: Record<LeakKey, SystemKey>;
  chipThresholds: { clear: number; needsFullScan: number; likely: number; detected: number };
  tier: { proWeeklyEnquiries: number; proLikelyLeakCount: number; likelyThreshold: number };
  directionalTag: string;
  sectorGroups: Record<SectorGroup, { label: string; sectors: string[] }>;
  sectorPattern: Record<string, LeakKey[]>;
  groupStems: Record<string, Record<SectorGroup, string>>;
  steps: Step[];
  benchmarks: {
    bandsEnabled: boolean;
    jobValueBySector: Record<string, JobValueEntry>;
    captureLossRate: { bySeverity: Record<string, number> };
    taskTimes: {
      confidence: string;
      note: string;
      tasks: Record<string, TaskTime>;
      taskByMemoryOption: Record<string, string[]>;
    };
  };
}

const config = rawConfig as unknown as CatalystConfig;

/* ---------- Public data ---------- */

/** The ordered ten-question mini-scan. */
export const STEPS: Step[] = config.steps;

/** The six leaks in canonical (display + tie-break) order. */
export const LEAKS: LeakKey[] = config.leaks;

/** The five install systems. */
export const SYSTEMS: SystemKey[] = config.systems;

export const CONFIG_VERSION = config.configVersion;

/* ---------- Answers + result types ---------- */

/** Answers keyed by question id. Multi-select values are string[]. Type-in
 *  values live under "<id>_other" (e.g. "sector_other", "relief_other"). */
export type ScanAnswers = Record<string, string | string[] | undefined>;

export interface ScanNode {
  leak: LeakKey;
  severity: number;
  chip: Chip;
  needsFullScan: boolean;
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

/* ---------- Small internal helpers ---------- */

const stepById = (id: string): Step | undefined => STEPS.find((s) => s.id === id);

function optionByValue(step: Step, value: string): StepOption | undefined {
  return step.options.find((o) => o.value === value);
}

/** Selected option values for a step, always as an array (single or multi). */
function selectedValues(a: ScanAnswers, id: string): string[] {
  const v = a[id];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function zeroScores(): Record<LeakKey, number> {
  const out = {} as Record<LeakKey, number>;
  for (const l of LEAKS) out[l] = 0;
  return out;
}

/** The sector id chosen in Q1, or "other" as a safe default. */
export function sectorOf(a: ScanAnswers): string {
  const v = a.sector;
  return typeof v === "string" && v.length > 0 ? v : "other";
}

/** Sector group A/B/C for the chosen sector. */
export function groupOf(a: ScanAnswers): SectorGroup {
  const opt = optionByValue(stepById("sector")!, sectorOf(a));
  return opt?.group ?? "A";
}

/** The group-specific stem for a question (falls back to the base stem). */
export function stemFor(step: Step, group: SectorGroup): string {
  if (step.stemGroupKey) {
    const swap = config.groupStems[step.stemGroupKey];
    if (swap && swap[group]) return swap[group];
  }
  return step.stem;
}

/** Convenience: resolve a step's stem for a given answer set. */
export function stemForAnswers(step: Step, a: ScanAnswers): string {
  return stemFor(step, groupOf(a));
}

/* ---------- Scoring ---------- */

/** Sum the per-option severity deltas across every answered question. */
export function scoreLeaks(a: ScanAnswers): Record<LeakKey, number> {
  const scores = zeroScores();
  for (const step of STEPS) {
    for (const value of selectedValues(a, step.id)) {
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
  if (severity >= t.detected) return "Detected";
  if (severity >= t.likely) return "Likely";
  if (severity >= t.needsFullScan) return "Needs full scan";
  return "Clear";
}

/* ---------- Tie-breaking + primary/secondary ---------- */

/** Relief leak chosen in Q10, if any (used only as a tie-breaker). */
function reliefLeak(a: ScanAnswers): LeakKey | null {
  const v = a.relief;
  if (typeof v !== "string") return null;
  const opt = optionByValue(stepById("relief")!, v);
  return opt?.relief ?? null;
}

/**
 * Rank leaks by severity, breaking ties by (1) the sector's leak pattern,
 * then (2) the Q10 relief choice, then (3) canonical leak order. Returns the
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
  return config.leakToSystem[primary];
}

/* ---------- Tier ---------- */

/** Weekly-enquiry midpoint from Q2 (0 when unanswered). */
function weeklyMid(a: ScanAnswers): number {
  const v = a.volume;
  if (typeof v !== "string") return 0;
  return optionByValue(stepById("volume")!, v)?.weeklyMid ?? 0;
}

/** Pro if 30+ weekly enquiries, or three leaks at Likely+ severity. Never Max. */
export function matchTier(a: ScanAnswers): "Starter" | "Pro" {
  const { proWeeklyEnquiries, proLikelyLeakCount, likelyThreshold } = config.tier;
  if (weeklyMid(a) >= proWeeklyEnquiries) return "Pro";
  const scores = scoreLeaks(a);
  const likelyOrWorse = LEAKS.filter((l) => scores[l] >= likelyThreshold).length;
  return likelyOrWorse >= proLikelyLeakCount ? "Pro" : "Starter";
}

/* ---------- Benchmark bands (behind flags) ---------- */

const DISABLED_BAND: Band = { low: 0, high: 0, formula: "", enabled: false };

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Directional monthly revenue at risk. Enabled only when bands are globally on
 * AND the sector has a VERIFIED job value (plumbers, electricians). Every other
 * sector returns enabled:false with guard values, so no guessed figure shows.
 */
export function revenueBand(a: ScanAnswers): Band {
  if (!config.benchmarks.bandsEnabled) return DISABLED_BAND;
  const sector = sectorOf(a);
  const job = config.benchmarks.jobValueBySector[sector];
  if (!job || !job.enabled) return DISABLED_BAND;

  const enquiries = weeklyMid(a);
  if (enquiries <= 0) return DISABLED_BAND;

  const capture = scoreLeaks(a)["Missed calls"];
  const rateKey = String(Math.min(capture, 3));
  const lossRate = config.benchmarks.captureLossRate.bySeverity[rateKey] ?? 0;
  const missedPerMonth = enquiries * lossRate * 4.33;

  const low = round10(missedPerMonth * job.low);
  const high = round10(missedPerMonth * job.high);
  const formula =
    "≈ " +
    enquiries +
    " enquiries/wk × " +
    Math.round(lossRate * 100) +
    "% at risk × £" +
    job.low +
    "–£" +
    job.high +
    "/job. Directional, confirmed by the full scan.";
  return { low, high, formula, enabled: true };
}

/**
 * Directional weekly minutes lost to manual admin, from the Q9 selections and
 * the "Likely" task-time table. Enabled whenever bands are on and at least one
 * manual task was flagged; otherwise enabled:false with guard values.
 */
export function timeBand(a: ScanAnswers): Band {
  if (!config.benchmarks.bandsEnabled) return DISABLED_BAND;
  const { tasks, taskByMemoryOption } = config.benchmarks.taskTimes;
  const jobs = weeklyMid(a) || 0;

  let low = 0;
  let high = 0;
  const seen = new Set<string>();
  for (const value of selectedValues(a, "memory")) {
    for (const taskKey of taskByMemoryOption[value] ?? []) {
      if (seen.has(taskKey)) continue;
      seen.add(taskKey);
      const t = tasks[taskKey];
      if (!t) continue;
      const countLow = t.perJob ? jobs : t.perWeekLow ?? 0;
      const countHigh = t.perJob ? jobs : t.perWeekHigh ?? 0;
      low += t.minutesLow * countLow;
      high += t.minutesHigh * countHigh;
    }
  }

  if (high <= 0) return DISABLED_BAND;
  return {
    low: Math.round(low),
    high: Math.round(high),
    formula: "≈ " + Math.round(low) + "–" + Math.round(high) + " min/week on manual admin. Likely estimate, not measured.",
    enabled: true,
  };
}

/* ---------- Result assembly ---------- */

export function buildResult(a: ScanAnswers): ScanResult {
  const scores = scoreLeaks(a);
  const nodes: ScanNode[] = LEAKS.map((leak) => {
    const chip = chipFor(scores[leak]);
    return { leak, severity: scores[leak], chip, needsFullScan: chip === "Needs full scan" };
  });

  // Honesty guarantee: a ten-question mini-scan cannot truly clear a leak, so if
  // nothing already reads "Needs full scan", relabel one otherwise-"Clear" node.
  // We only ever upgrade a zero-signal "Clear" node, never downgrade a leak that
  // carries real signal (Likely / Detected) — that would hide a genuine finding.
  // When every leak already carries signal there is no false "all clear" to
  // correct, so we leave the honest result as-is.
  if (!nodes.some((n) => n.chip === "Needs full scan")) {
    const target = nodes.filter((n) => n.chip === "Clear").sort((x, y) => x.severity - y.severity)[0];
    if (target) {
      target.chip = "Needs full scan";
      target.needsFullScan = true;
    }
  }

  const ranked = rankedLeaks(a, scores);
  const primary = ranked[0];
  const secondary = ranked[1];
  const sector = sectorOf(a);
  const sectorOpt = optionByValue(stepById("sector")!, sector);

  return {
    sector,
    sectorLabel: sectorOpt?.label ?? "your business",
    sectorGroup: groupOf(a),
    directionalTag: config.directionalTag,
    nodes,
    primaryLeak: primary,
    secondaryLeak: secondary,
    needsFullScan: nodes.filter((n) => n.needsFullScan).map((n) => n.leak),
    fixFirst: fixFirstSystem(primary),
    tier: matchTier(a),
    revenueBand: revenueBand(a),
    timeBand: timeBand(a),
  };
}

/* ---------- Backend payload (brief §3) ---------- */

export interface ScanContact {
  name?: string;
  company?: string;
  email?: string;
  location?: string;
}

export interface ScanMeta {
  utmSource?: string | null;
  problemsRaw?: string;
  intake?: Record<string, unknown>;
  completedAt?: string;
}

/** Volume band label (e.g. "steady") from Q2. */
function volumeBand(a: ScanAnswers): string {
  const v = a.volume;
  if (typeof v !== "string") return "";
  return optionByValue(stepById("volume")!, v)?.band ?? "";
}

/** Urgency signalled by the Q10 relief choice. */
function urgencyOf(a: ScanAnswers): string {
  const v = a.relief;
  if (typeof v !== "string") return "medium";
  return optionByValue(stepById("relief")!, v)?.urgency ?? "medium";
}

export function buildPayload(a: ScanAnswers, contact: ScanContact, meta: ScanMeta = {}) {
  const result = buildResult(a);
  const answers = STEPS.map((s) => ({ id: s.id, value: a[s.id] ?? null }));

  // Type-in reveals collected alongside the scan feed intake + problems_raw.
  const intake: Record<string, unknown> = {
    sector_other: a.sector_other ?? null,
    relief_other: a.relief_other ?? null,
    ...(meta.intake ?? {}),
  };
  const problemsRaw = meta.problemsRaw ?? (typeof a.relief_other === "string" ? a.relief_other : "");

  return {
    sector: result.sector,
    sector_group: result.sectorGroup,
    volume_band: volumeBand(a),
    channels: selectedValues(a, "channels"),
    answers,
    leak_severities: scoreLeaks(a),
    primary_leak: result.primaryLeak,
    secondary_leak: result.secondaryLeak,
    needs_full_scan: result.needsFullScan,
    fix_first_system: result.fixFirst,
    tier_match: result.tier,
    revenue_band: result.revenueBand,
    time_band: result.timeBand,
    urgency: urgencyOf(a),
    problems_raw: problemsRaw,
    intake,
    contact,
    utm_source: meta.utmSource ?? null,
    config_version: CONFIG_VERSION,
    completed_at: meta.completedAt ?? new Date().toISOString(),
  };
}
