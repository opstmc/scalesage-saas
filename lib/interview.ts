/* ---------------------------------------------------------------------------
 * The Catalyst deep interview — the second depth of the one Catalyst flow.
 *
 * The 13-question mini is the opening act. This is where we learn how the
 * business actually runs and, critically, capture THEIR NUMBERS: what a job is
 * worth, how many they do, what they spend winning customers. Those figures are
 * what let the report price a leak in pounds from the client's own data rather
 * than from our benchmarks, which is the whole difference between a diagnostic
 * and an audit.
 *
 * Structure (docs/plans/catalyst-full-interview.md):
 *
 *   common        every business, regardless of trade
 *   spine         one of three: quote-led / booking-led / order-led
 *   overlay       a small per-sector block, one for each of the 18 sectors
 *   evidence      questions about what the live checks actually found (phase 2)
 *   numbers       the load-bearing set
 *   offGuard      one or two late, unscored questions that get a real answer
 *
 * Eighteen sectors get eighteen genuinely different interviews without eighteen
 * copies of the same file: the spine carries the structural difference (a
 * plumber and a solicitor both quote; a salon and a clinic both book) and the
 * overlay carries the vocabulary.
 *
 * The question COPY here is first-draft and JW-approval-pending, exactly like
 * reactions.ts. Editing a line never affects the mini or its scoring.
 * ------------------------------------------------------------------------- */

import raw from "@/catalyst.interview.json";
import scanRaw from "@/catalyst.config.json";
import { loadSession } from "@/components/catalyst/session";
import type { ChecksResult, LookupMatch } from "@/lib/catalyst-api";

export type InterviewKind = "single" | "multi" | "text";

export interface InterviewOption {
  value: string;
  label: string;
  /** Midpoint of the band, for turning an answer into a usable figure. */
  mid?: number;
  /** "Not sure" — falls back to a benchmark and is marked inferred. */
  unknown?: boolean;
  /** An honest way out, so nobody has to guess. `unknown` implies it. */
  escape?: boolean;
}

export type InterviewBlock = "common" | "spine" | "overlay" | "evidence" | "numbers" | "offGuard";

export interface InterviewStep {
  id: string;
  kind: InterviewKind;
  kicker?: string;
  question: string;
  hint?: string;
  optional?: boolean;
  /** True for the numbers block — these answers carry a figure. */
  numeric?: boolean;
  options?: InterviewOption[];
  /** Evidence questions only: at most one question per group is ever asked, so
   *  a business with three website findings is not asked three website
   *  questions in a row. */
  group?: string;
  /** Which block it came from, for progress and for the report. */
  block: InterviewBlock;
}

export type SpineKey = "A" | "B" | "C";

/* ---------------------------------------------------------------------------
 * Evidence conditions
 *
 * Phase 2, "the credibility moment": the interview asks about what the live
 * checks actually found rather than asking blind. The mechanism lives here and
 * the questions live in catalyst.interview.json, so a question can be added,
 * reworded or retired without touching code.
 *
 * The single rule that makes this safe: A FACT WE DO NOT KNOW IS ALWAYS FALSE.
 * Every operator below returns false for a null fact, there is no negation
 * operator that could invert an unknown into a match, and a question whose copy
 * references a fact we could not resolve is dropped rather than rendered. So a
 * check that failed, timed out, was deferred or returned an empty body simply
 * removes those questions: the interview is shorter, never holed, and never
 * asks about something we did not actually find.
 * ------------------------------------------------------------------------- */

export type FactName =
  | "google_profile"
  | "review_count"
  | "google_rating"
  | "ranks_page_one"
  | "website_status"
  | "website_load_seconds"
  | "click_to_call"
  | "ai_listed";

const FACT_NAMES = [
  "google_profile",
  "review_count",
  "google_rating",
  "ranks_page_one",
  "website_status",
  "website_load_seconds",
  "click_to_call",
  "ai_listed",
] as const satisfies readonly FactName[];

export type FactValue = string | number | boolean | null;
export type Facts = Record<FactName, FactValue>;

export type ConditionOp =
  | "known"
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "isTrue"
  | "isFalse"
  | "in";

const CONDITION_OPS = [
  "known",
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "isTrue",
  "isFalse",
  "in",
] as const satisfies readonly ConditionOp[];

/** Ops that need a `value`, and what type that value has to be. */
const OP_VALUE: Record<ConditionOp, "none" | "number" | "scalar" | "array"> = {
  known: "none",
  isTrue: "none",
  isFalse: "none",
  eq: "scalar",
  neq: "scalar",
  lt: "number",
  lte: "number",
  gt: "number",
  gte: "number",
  in: "array",
};

export interface LeafCondition {
  fact: FactName;
  op: ConditionOp;
  value?: string | number | boolean | Array<string | number | boolean>;
}
export interface AllCondition {
  all: Condition[];
}
export interface AnyCondition {
  any: Condition[];
}
export type Condition = LeafCondition | AllCondition | AnyCondition;

/** What the interview knows about the business before it asks anything. Both
 *  halves are optional and both may be null: the interview has to work for
 *  someone whose checks never came back. */
export interface InterviewEvidence {
  /** The mini's live background checks, fired from Q1. */
  checks?: ChecksResult | null;
  /** The Q1 lookup match, which carries public Google review data of its own. */
  lookup?: LookupMatch | null;
}

/* ---- raw config shape --------------------------------------------------- */

type RawStep = Omit<InterviewStep, "block">;
type RawEvidenceStep = RawStep & { when?: unknown; group?: string };

interface Config {
  configVersion: string;
  spines: Record<SpineKey, { label: string; note: string; sectors: string[] }>;
  common: RawStep[];
  spineQuestions: Record<SpineKey, RawStep[]>;
  numbers: { questions: RawStep[] };
  offGuard: RawStep[];
  evidenceQuestions?: { maxPerInterview?: number; questions?: RawEvidenceStep[] };
  sectorOverlays: Record<string, RawStep[]>;
}

const CONFIG = raw as unknown as Config;

export const INTERVIEW_VERSION = CONFIG.configVersion;

/** The spine a sector belongs to. Unknown sectors get the quote-led spine,
 *  which is the most common shape and the least wrong default. The validator
 *  below makes sure no sector the mini can actually produce ever lands here. */
export function spineFor(sector: string | null | undefined): SpineKey {
  const key = (sector ?? "").trim().toLowerCase();
  for (const [spine, def] of Object.entries(CONFIG.spines) as [SpineKey, Config["spines"]["A"]][]) {
    if (def.sectors.includes(key)) return spine;
  }
  return "A";
}

export function spineLabel(spine: SpineKey): string {
  return CONFIG.spines[spine]?.label ?? "";
}

function tag(steps: RawStep[] | undefined, block: InterviewBlock): InterviewStep[] {
  return (steps ?? []).map((s) => ({ ...s, block }));
}

/* ---------------------------------------------------------------------------
 * Evidence -> facts
 * ------------------------------------------------------------------------- */

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

const EMPTY_FACTS: Facts = {
  google_profile: null,
  review_count: null,
  google_rating: null,
  ranks_page_one: null,
  website_status: null,
  website_load_seconds: null,
  click_to_call: null,
  ai_listed: null,
};

/**
 * Turn whatever came back from the live checks into the small set of facts the
 * config is allowed to ask about.
 *
 * Everything here is deliberately conservative. "deferred" means the check
 * never ran, so it yields nothing at all. A Google profile is only "missing"
 * when the check explicitly said so, never because a field happened to be null.
 * Website facts are only read when the site actually loaded, because a load
 * time or a tap-to-call flag from a site that did not open is meaningless.
 */
export function factsFrom(evidence?: InterviewEvidence | null): Facts {
  const facts: Facts = { ...EMPTY_FACTS };
  if (!evidence) return facts;

  const checks = evidence.checks && evidence.checks.status !== "deferred" ? evidence.checks : null;
  const lookup = evidence.lookup ?? null;

  const gb = checks?.google_business ?? null;
  const gbExists = gb ? bool(gb.exists) : null;
  const lookupReviews = num(lookup?.review_count);

  if (gbExists === true) facts.google_profile = "found";
  else if (gbExists === false) facts.google_profile = "missing";
  else if (lookupReviews !== null && lookupReviews > 0) {
    // You cannot collect Google reviews without a profile, so the Q1 match is
    // enough on its own. Absence of reviews is NOT enough to claim the reverse.
    facts.google_profile = "found";
  }

  if (facts.google_profile === "found") {
    const reviews = gbExists === true ? (num(gb?.review_count) ?? lookupReviews) : lookupReviews;
    if (reviews !== null && reviews >= 0) facts.review_count = Math.round(reviews);
    const rating = gbExists === true ? (num(gb?.rating) ?? num(lookup?.rating)) : num(lookup?.rating);
    if (rating !== null && rating > 0) facts.google_rating = Math.round(rating * 10) / 10;
    if (gbExists === true) facts.ranks_page_one = bool(gb?.ranks_page_one);
  }

  const site = checks?.website ?? null;
  const loads = site ? bool(site.loads) : null;
  if (loads === true) {
    facts.website_status = "up";
    const ms = num(site?.load_ms);
    if (ms !== null && ms > 0) facts.website_load_seconds = Math.round(ms / 100) / 10;
    facts.click_to_call = bool(site?.click_to_call);
  } else if (loads === false) {
    facts.website_status = "down";
  }

  const assistant = checks?.ai_presence ?? null;
  if (assistant) facts.ai_listed = bool(assistant.appears);

  return facts;
}

/** True when we learned anything at all. Lets the UI stay quiet about checks
 *  that never came back rather than promising something it cannot show. */
export function hasEvidence(facts: Facts): boolean {
  return Object.values(facts).some((v) => v !== null);
}

/* ---------------------------------------------------------------------------
 * Condition evaluation
 * ------------------------------------------------------------------------- */

function isAll(c: Condition): c is AllCondition {
  return Array.isArray((c as AllCondition).all);
}
function isAny(c: Condition): c is AnyCondition {
  return Array.isArray((c as AnyCondition).any);
}

export function evaluateCondition(condition: Condition | undefined, facts: Facts): boolean {
  if (!condition || typeof condition !== "object") return false;
  // An empty group matches nothing. A `when: { all: [] }` is far more likely to
  // be a half-finished edit than an intent to ask everyone.
  if (isAll(condition)) {
    return condition.all.length > 0 && condition.all.every((c) => evaluateCondition(c, facts));
  }
  if (isAny(condition)) {
    return condition.any.length > 0 && condition.any.some((c) => evaluateCondition(c, facts));
  }

  const leaf = condition as LeafCondition;
  const actual = facts[leaf.fact];
  // The rule the whole phase rests on: unknown never matches.
  if (actual === null || actual === undefined) return false;

  switch (leaf.op) {
    case "known":
      return true;
    case "eq":
      return actual === leaf.value;
    case "neq":
      return actual !== leaf.value;
    case "isTrue":
      return actual === true;
    case "isFalse":
      return actual === false;
    case "in":
      return Array.isArray(leaf.value) && leaf.value.includes(actual as string | number | boolean);
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      if (typeof actual !== "number" || typeof leaf.value !== "number") return false;
      if (leaf.op === "lt") return actual < leaf.value;
      if (leaf.op === "lte") return actual <= leaf.value;
      if (leaf.op === "gt") return actual > leaf.value;
      return actual >= leaf.value;
    }
    default:
      return false;
  }
}

/* ---- copy tokens -------------------------------------------------------- */

const TOKEN = /\{([a-z_]+)\}/g;

function formatFact(value: FactValue): string | null {
  if (value === null) return null;
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(value);
}

/**
 * Fill `{review_count}` style tokens from the facts.
 *
 * Returns null if ANY token cannot be resolved, and the caller then drops the
 * question. Rendering "Sage found {review_count} reviews" would be worse than
 * not asking, and quietly rendering a zero would be a fabricated finding.
 */
export function fillTokens(text: string, facts: Facts): string | null {
  let ok = true;
  const out = text.replace(TOKEN, (whole, name: string) => {
    const value = formatFact(facts[name as FactName] ?? null);
    if (value === null) {
      ok = false;
      return whole;
    }
    return value;
  });
  return ok ? out : null;
}

/* ---- selection ---------------------------------------------------------- */

const DEFAULT_EVIDENCE_CAP = 2;

/**
 * The evidence questions this business has earned, in config priority order.
 *
 * At most one per `group` (so three website findings never produce three
 * website questions) and at most `maxPerInterview` in total, because the
 * interview is already at the length the plan budgets for and a run of extra
 * questions is how a diagnostic turns into a form.
 */
export function evidenceSteps(evidence?: InterviewEvidence | null): InterviewStep[] {
  const block = CONFIG.evidenceQuestions;
  const questions = block?.questions;
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const cap = typeof block?.maxPerInterview === "number" ? block.maxPerInterview : DEFAULT_EVIDENCE_CAP;
  if (cap <= 0) return [];

  const facts = factsFrom(evidence);
  if (!hasEvidence(facts)) return [];

  const out: InterviewStep[] = [];
  const usedGroups = new Set<string>();

  for (const q of questions) {
    if (out.length >= cap) break;
    const group = typeof q.group === "string" ? q.group : q.id;
    if (usedGroups.has(group)) continue;
    if (!evaluateCondition(q.when as Condition | undefined, facts)) continue;

    const question = fillTokens(q.question, facts);
    if (question === null) continue;
    let hint: string | undefined;
    if (typeof q.hint === "string") {
      const filled = fillTokens(q.hint, facts);
      if (filled === null) continue;
      hint = filled;
    }

    const { when: _when, ...rest } = q as RawEvidenceStep & { when?: unknown };
    void _when;
    out.push({ ...rest, question, hint, block: "evidence" });
    usedGroups.add(group);
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Assembly
 * ------------------------------------------------------------------------- */

/**
 * The evidence the mini already gathered and left in the session.
 *
 * The checks fire from Q1 of the mini and are written to the session there, so
 * by the time anything asks about the interview the findings are sitting in the
 * browser waiting. Returns nothing at all on the server, and nothing when the
 * session is unreadable.
 */
export function ambientEvidence(): InterviewEvidence {
  if (typeof window === "undefined") return {};
  try {
    const session = loadSession();
    return { checks: session.checks, lookup: session.lookup?.match ?? null };
  } catch {
    return {};
  }
}

/**
 * The full ordered question set for one business.
 *
 * Order is deliberate: operational questions first while they are warmed up and
 * still describing their world, then what the live checks found while they were
 * answering (the moment the diagnostic stops sounding like a form), then the
 * numbers once they trust that we are actually listening, and the off-guard
 * questions last, where an honest answer costs them nothing.
 *
 * The two ways to say "no evidence" are deliberately different:
 *
 *   omitted    the caller has not looked, so we look for them (the session the
 *              mini wrote). This is what keeps the question count promised on
 *              the unlock screen equal to the number of questions they get.
 *   null       the caller means none. Used by the validator, and by anyone who
 *              wants the base interview.
 *
 * Either way the result is complete. A check that failed, timed out, was
 * deferred or came back empty removes its question rather than asking it blind,
 * so the worst case is the shorter interview that shipped in phase 1, never a
 * form with holes in it.
 */
export function buildInterview(
  sector: string | null | undefined,
  evidence?: InterviewEvidence | null,
): InterviewStep[] {
  const spine = spineFor(sector);
  const key = (sector ?? "").trim().toLowerCase();
  const resolved = evidence === undefined ? ambientEvidence() : evidence;
  return [
    ...tag(CONFIG.common, "common"),
    ...tag(CONFIG.spineQuestions[spine], "spine"),
    ...tag(CONFIG.sectorOverlays[key], "overlay"),
    ...evidenceSteps(resolved),
    ...tag(CONFIG.numbers.questions, "numbers"),
    ...tag(CONFIG.offGuard, "offGuard"),
  ];
}

/* ---------------------------------------------------------------------------
 * Answers -> figures
 * ------------------------------------------------------------------------- */

export interface Figure {
  value: number | null;
  /** Where the number came from. "their_number" only when they actually chose
   *  a band; "benchmark" whenever we fell back, so the report can show the
   *  difference. Never claim a figure is theirs when it is ours. */
  basis: "their_number" | "benchmark";
}

/**
 * Resolve one numeric answer to a figure.
 *
 * A chosen band gives their number (its midpoint). "Not sure", a missing
 * answer, or anything unrecognised gives null with a benchmark basis — the
 * caller substitutes a sector benchmark and the report marks it as modelled.
 */
export function figureFor(step: InterviewStep, answer: unknown): Figure {
  if (!step.numeric || typeof answer !== "string") return { value: null, basis: "benchmark" };
  const option = (step.options ?? []).find((o) => o.value === answer);
  if (!option || option.unknown || typeof option.mid !== "number") {
    return { value: null, basis: "benchmark" };
  }
  return { value: option.mid, basis: "their_number" };
}

/** Every numeric answer, resolved. The shape the report and the baseline read. */
export function figuresFrom(
  steps: InterviewStep[],
  answers: Record<string, unknown>,
): Record<string, Figure> {
  const out: Record<string, Figure> = {};
  for (const step of steps) {
    if (!step.numeric) continue;
    out[step.id] = figureFor(step, answers[step.id]);
  }
  return out;
}

/** Share of the numbers block they actually gave us (0..1).
 *  A report built on two answered figures out of eight is a much weaker claim
 *  than one built on all eight, and has to be able to say so. */
export function numbersConfidence(figures: Record<string, Figure>): number {
  const all = Object.values(figures);
  if (all.length === 0) return 0;
  const theirs = all.filter((f) => f.basis === "their_number").length;
  return Math.round((theirs / all.length) * 100) / 100;
}

/* ---------------------------------------------------------------------------
 * Progress + validation
 * ------------------------------------------------------------------------- */

/** Whether a step has been answered well enough to move on. */
export function isAnswered(step: InterviewStep, answer: unknown): boolean {
  if (step.optional) return true;
  if (step.kind === "multi") return Array.isArray(answer) && answer.length > 0;
  if (step.kind === "text") return typeof answer === "string" && answer.trim().length > 0;
  return typeof answer === "string" && answer.length > 0;
}

/** How far through, 0..1. Honest: it counts real steps, not a padded bar. */
export function progressFor(steps: InterviewStep[], idx: number): number {
  if (steps.length === 0) return 1;
  return Math.min(1, Math.max(0, idx / steps.length));
}


/* ---------------------------------------------------------------------------
 * Paging
 *
 * The interview was one question a screen, which is right for the 13-question
 * mini where each answer earns a reply from Sage. Twenty screens is a different
 * experience: it reads as long before it reads as thorough, and every screen is
 * another chance to close the tab.
 *
 * So questions are grouped onto pages. NOT in arbitrary chunks of five, but by
 * block, because the blocks are already coherent: how the work reaches you, how
 * your trade specifically runs, what Sage found, your numbers, and the last
 * couple of questions. Splitting mid-topic, or mixing operational questions
 * with money questions on one screen, is what makes a form feel like a form. A
 * block larger than the cap splits across consecutive pages keeping its own
 * order and title.
 * ------------------------------------------------------------------------- */

export interface InterviewPage {
  title: string;
  steps: InterviewStep[];
}

/* Typed as Record<InterviewBlock, string>, so adding a block to the union
 * without giving it a page title is a compile error rather than an undefined
 * heading in front of a customer. */
const BLOCK_TITLES: Record<InterviewBlock, string> = {
  common: "How the work reaches you",
  spine: "How your business runs",
  overlay: "Your trade specifically",
  evidence: "What Sage found",
  numbers: "Your numbers",
  offGuard: "One last thing",
};

export const MAX_QUESTIONS_PER_PAGE = 5;

export function buildPages(
  steps: InterviewStep[],
  maxPerPage: number = MAX_QUESTIONS_PER_PAGE,
): InterviewPage[] {
  const pages: InterviewPage[] = [];
  let current: InterviewStep[] = [];
  let currentBlock: InterviewBlock | null = null;

  const flush = () => {
    if (current.length === 0 || currentBlock === null) return;
    pages.push({ title: BLOCK_TITLES[currentBlock], steps: current });
    current = [];
  };

  // How many of each block are left to place, so a block can decide whether it
  // fits alongside what is already on the page.
  const remaining = new Map<string, number>();
  for (const step of steps) remaining.set(step.block, (remaining.get(step.block) ?? 0) + 1);

  for (const step of steps) {
    const startingNewBlock = step.block !== currentBlock;
    // A short block rides along with the previous one rather than getting a page
    // of its own. A single trade-specific question on its own screen reads as
    // padding, and padding is what makes twenty questions feel like fifty.
    const fitsAlongside =
      startingNewBlock &&
      current.length > 0 &&
      current.length + (remaining.get(step.block) ?? 0) <= maxPerPage;

    if ((startingNewBlock && !fitsAlongside) || current.length >= maxPerPage) {
      flush();
      currentBlock = step.block;
    } else if (startingNewBlock && currentBlock === null) {
      currentBlock = step.block;
    }
    current.push(step);
  }
  flush();
  return pages;
}

/** Every non-optional question on the page has been answered. */
export function pageComplete(page: InterviewPage, answers: Record<string, unknown>): boolean {
  return page.steps.every((step) => isAnswered(step, answers[step.id]));
}

/* ---------------------------------------------------------------------------
 * Config integrity
 *
 * There is no test runner in this repo, so this is the check. It runs when the
 * module is first evaluated, which happens during `next build` while the
 * /catalyst page is prerendered, so a malformed config fails the build rather
 * than reaching a visitor.
 *
 * The failure mode this exists to prevent is a silent one. A duplicate question
 * id does not crash anything: the second question simply overwrites the first
 * one's answer, the report is built on the wrong data, and nobody finds out. A
 * sector missing from every spine does not crash either: it quietly falls back
 * to the quote-led interview and a salon gets asked about quote follow-up.
 * Both of those are worse than a red build.
 * ------------------------------------------------------------------------- */

const ID_RE = /^[a-z][a-z0-9_]*$/;
const VALUE_RE = /^[a-z0-9][a-z0-9_]*$/;

/** The sector ids the mini can actually produce, read from its own config so
 *  the two files cannot drift apart unnoticed. */
function miniSectorIds(): string[] {
  const questions = (scanRaw as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return [];
  for (const entry of questions as Array<Record<string, unknown>>) {
    const id = String(entry?.id ?? "").toLowerCase();
    if (id !== "sectors" && id !== "sector" && id !== "industry" && id !== "trade") continue;
    const options = entry?.options;
    if (!Array.isArray(options)) return [];
    return (options as Array<Record<string, unknown>>)
      .map((o) => String(o?.value ?? "").trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function checkCondition(condition: unknown, where: string, problems: string[]): void {
  if (!condition || typeof condition !== "object") {
    problems.push(`${where}: condition must be an object`);
    return;
  }
  const c = condition as Record<string, unknown>;
  if (Array.isArray(c.all) || Array.isArray(c.any)) {
    const parts = (Array.isArray(c.all) ? c.all : c.any) as unknown[];
    if (parts.length === 0) {
      problems.push(`${where}: empty all/any group would never match`);
      return;
    }
    parts.forEach((p, i) => checkCondition(p, `${where}[${i}]`, problems));
    return;
  }
  const fact = String(c.fact ?? "");
  const op = String(c.op ?? "");
  if (!(FACT_NAMES as readonly string[]).includes(fact)) {
    problems.push(`${where}: unknown fact "${fact}"`);
  }
  if (!(CONDITION_OPS as readonly string[]).includes(op)) {
    problems.push(`${where}: unknown op "${op}"`);
    return;
  }
  const needs = OP_VALUE[op as ConditionOp];
  const value = c.value;
  if (needs === "none" && value !== undefined) {
    problems.push(`${where}: op "${op}" takes no value`);
  }
  if (needs === "number" && typeof value !== "number") {
    problems.push(`${where}: op "${op}" needs a numeric value`);
  }
  if (needs === "scalar" && !["string", "number", "boolean"].includes(typeof value)) {
    problems.push(`${where}: op "${op}" needs a string, number or boolean value`);
  }
  if (needs === "array" && (!Array.isArray(value) || value.length === 0)) {
    problems.push(`${where}: op "${op}" needs a non-empty array value`);
  }
}

function checkStep(
  step: RawEvidenceStep,
  where: string,
  problems: string[],
  opts: { evidence?: boolean } = {},
): void {
  const id = String(step?.id ?? "");
  if (!ID_RE.test(id)) {
    problems.push(`${where}: bad or missing id "${id}"`);
  }
  const kind = String(step?.kind ?? "");
  if (!["single", "multi", "text"].includes(kind)) {
    problems.push(`${where} (${id}): kind must be single, multi or text, got "${kind}"`);
  }
  if (typeof step?.question !== "string" || step.question.trim() === "") {
    problems.push(`${where} (${id}): missing question text`);
  }

  const options = step?.options;
  if (kind === "text") {
    if (options !== undefined) problems.push(`${where} (${id}): a text step must not carry options`);
  } else {
    if (!Array.isArray(options) || options.length < 2) {
      problems.push(`${where} (${id}): needs at least two options`);
    } else {
      const seen = new Set<string>();
      for (const option of options) {
        const value = String(option?.value ?? "");
        if (!VALUE_RE.test(value)) problems.push(`${where} (${id}): bad option value "${value}"`);
        if (seen.has(value)) problems.push(`${where} (${id}): duplicate option value "${value}"`);
        seen.add(value);
        if (typeof option?.label !== "string" || option.label.trim() === "") {
          problems.push(`${where} (${id}): option "${value}" has no label`);
        }
      }
    }
  }

  const hasEscape =
    Array.isArray(options) && options.some((o) => o?.escape === true || o?.unknown === true);

  if (step?.numeric) {
    if (kind !== "single") problems.push(`${where} (${id}): a numeric step must be single-select`);
    if (Array.isArray(options)) {
      for (const option of options) {
        if (option?.unknown === true) continue;
        if (typeof option?.mid !== "number") {
          problems.push(`${where} (${id}): option "${option?.value}" needs a mid or unknown: true`);
        }
      }
      if (!options.some((o) => o?.unknown === true)) {
        // Without it there is nowhere to go but a guess, and a guessed figure
        // that gets labelled "their number" is the one thing the report may
        // never do.
        problems.push(`${where} (${id}): a numeric step needs an unknown ("not sure") option`);
      }
      if (options.filter((o) => typeof o?.mid === "number").length < 2) {
        problems.push(`${where} (${id}): a numeric step needs at least two banded options`);
      }
    }
  }

  if (opts.evidence) {
    if (step?.when === undefined) {
      problems.push(`${where} (${id}): an evidence step must declare when`);
    } else {
      checkCondition(step.when, `${where} (${id}).when`, problems);
    }
    if (typeof step?.group !== "string" || step.group.trim() === "") {
      problems.push(`${where} (${id}): an evidence step needs a group`);
    }
    if (!hasEscape) {
      // These ask about something a check found. "I don't know" is a completely
      // reasonable answer to every one of them.
      problems.push(`${where} (${id}): an evidence step needs an escape option`);
    }
    const facts = { ...EMPTY_FACTS };
    for (const text of [step?.question, step?.hint]) {
      if (typeof text !== "string") continue;
      for (const match of text.matchAll(TOKEN)) {
        if (!(match[1] in facts)) {
          problems.push(`${where} (${id}): copy references unknown fact "{${match[1]}}"`);
        }
      }
    }
  }
}

/** Everything that is wrong with catalyst.interview.json, in plain English. */
export function validateInterviewConfig(): string[] {
  const problems: string[] = [];
  const c = CONFIG;

  if (typeof c?.configVersion !== "string" || c.configVersion.trim() === "") {
    problems.push("configVersion is missing");
  }

  /* ---- spines, and every sector mapping to exactly one ---- */
  const sectorSpine = new Map<string, SpineKey>();
  for (const key of ["A", "B", "C"] as SpineKey[]) {
    const spine = c?.spines?.[key];
    if (!spine) {
      problems.push(`spines.${key} is missing`);
      continue;
    }
    if (typeof spine.label !== "string" || spine.label.trim() === "") {
      problems.push(`spines.${key}: missing label`);
    }
    if (!Array.isArray(spine.sectors) || spine.sectors.length === 0) {
      problems.push(`spines.${key}: needs at least one sector`);
      continue;
    }
    for (const sector of spine.sectors) {
      if (typeof sector !== "string" || sector.trim() === "") {
        problems.push(`spines.${key}: empty sector id`);
        continue;
      }
      const already = sectorSpine.get(sector);
      if (already) problems.push(`sector "${sector}" is in both spine ${already} and spine ${key}`);
      else sectorSpine.set(sector, key);
    }
  }

  // Every sector the mini can hand us must resolve to a real spine. Without
  // this, a renamed sector id silently falls through to the quote-led default.
  for (const sector of miniSectorIds()) {
    if (!sectorSpine.has(sector)) {
      problems.push(`sector "${sector}" is offered by the mini but is in no spine`);
    }
  }

  /* ---- every question, everywhere ---- */
  const lists: Array<[string, RawEvidenceStep[] | undefined, { evidence?: boolean }]> = [
    ["common", c?.common, {}],
    ["spineQuestions.A", c?.spineQuestions?.A, {}],
    ["spineQuestions.B", c?.spineQuestions?.B, {}],
    ["spineQuestions.C", c?.spineQuestions?.C, {}],
    ["numbers.questions", c?.numbers?.questions, {}],
    ["offGuard", c?.offGuard, {}],
    ["evidenceQuestions.questions", c?.evidenceQuestions?.questions, { evidence: true }],
  ];
  for (const [name, list] of Object.entries(c?.sectorOverlays ?? {})) {
    if (!sectorSpine.has(name)) problems.push(`sectorOverlays."${name}" is not a known sector`);
    lists.push([`sectorOverlays.${name}`, list as RawEvidenceStep[], {}]);
  }

  const seenIds = new Map<string, string>();
  for (const [where, list, opts] of lists) {
    if (list === undefined) {
      if (where !== "evidenceQuestions.questions") problems.push(`${where} is missing`);
      continue;
    }
    if (!Array.isArray(list)) {
      problems.push(`${where} must be an array`);
      continue;
    }
    for (const step of list) {
      checkStep(step, where, problems, opts);
      const id = String(step?.id ?? "");
      // Ids are unique across the WHOLE file, not just within a block. Stricter
      // than strictly necessary (two spines never run together) and worth it: an
      // id collision does not fail, it silently overwrites an answer.
      const first = seenIds.get(id);
      if (first) problems.push(`duplicate question id "${id}" in ${first} and ${where}`);
      else seenIds.set(id, where);
    }
  }

  const cap = c?.evidenceQuestions?.maxPerInterview;
  if (cap !== undefined && (typeof cap !== "number" || !Number.isInteger(cap) || cap < 0)) {
    problems.push("evidenceQuestions.maxPerInterview must be a whole number of 0 or more");
  }

  /* ---- and finally, assemble every interview we can actually ship ---- */
  for (const sector of sectorSpine.keys()) {
    // null, not omitted: the validator must never depend on browser state.
    const ids = buildInterview(sector, null).map((s) => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) {
      problems.push(`interview for "${sector}" has duplicate ids: ${[...new Set(dupes)].join(", ")}`);
    }
    if (ids.length === 0) problems.push(`interview for "${sector}" is empty`);
  }

  return problems;
}

const CONFIG_PROBLEMS = validateInterviewConfig();
if (CONFIG_PROBLEMS.length > 0) {
  const message = [
    "catalyst.interview.json is invalid, so the deep interview cannot be trusted:",
    ...CONFIG_PROBLEMS.map((p) => `  - ${p}`),
  ].join("\n");
  // Fail hard everywhere the failure can still be fixed: the build (where there
  // is no window), and dev. In a production browser the config was already
  // validated at build time, so this branch is unreachable; it stays a log
  // rather than a throw purely so a corrupted deploy shows a visitor a working
  // page and shows us a red console, instead of a white screen.
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") {
    throw new Error(message);
  }
  console.error(message);
}
