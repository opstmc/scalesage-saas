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
 *   overlay       a small per-sector block, where one exists
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

export type InterviewKind = "single" | "multi" | "text";

export interface InterviewOption {
  value: string;
  label: string;
  /** Midpoint of the band, for turning an answer into a usable figure. */
  mid?: number;
  /** "Not sure" — falls back to a benchmark and is marked inferred. */
  unknown?: boolean;
}

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
  /** Which block it came from, for progress and for the report. */
  block: "common" | "spine" | "overlay" | "numbers" | "offGuard";
}

export type SpineKey = "A" | "B" | "C";

interface Config {
  configVersion: string;
  spines: Record<SpineKey, { label: string; note: string; sectors: string[] }>;
  common: Omit<InterviewStep, "block">[];
  spineQuestions: Record<SpineKey, Omit<InterviewStep, "block">[]>;
  numbers: { questions: Omit<InterviewStep, "block">[] };
  offGuard: Omit<InterviewStep, "block">[];
  sectorOverlays: Record<string, Omit<InterviewStep, "block">[]>;
}

const CONFIG = raw as unknown as Config;

export const INTERVIEW_VERSION = CONFIG.configVersion;

/** The spine a sector belongs to. Unknown sectors get the quote-led spine,
 *  which is the most common shape and the least wrong default. */
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

function tag(
  steps: Omit<InterviewStep, "block">[] | undefined,
  block: InterviewStep["block"],
): InterviewStep[] {
  return (steps ?? []).map((s) => ({ ...s, block }));
}

/**
 * The full ordered question set for one business.
 *
 * Order is deliberate: operational questions first while they are warmed up and
 * still describing their world, the numbers in the middle once they trust that
 * we are actually listening, and the off-guard questions last, where an honest
 * answer costs them nothing.
 */
export function buildInterview(sector: string | null | undefined): InterviewStep[] {
  const spine = spineFor(sector);
  const key = (sector ?? "").trim().toLowerCase();
  return [
    ...tag(CONFIG.common, "common"),
    ...tag(CONFIG.spineQuestions[spine], "spine"),
    ...tag(CONFIG.sectorOverlays[key], "overlay"),
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
 * your trade specifically runs, your numbers, and the last couple of questions.
 * Splitting mid-topic, or mixing operational questions with money questions on
 * one screen, is what makes a form feel like a form. A block larger than the cap
 * splits across consecutive pages keeping its own order and title.
 * ------------------------------------------------------------------------- */

export interface InterviewPage {
  title: string;
  steps: InterviewStep[];
}

const BLOCK_TITLES: Record<InterviewStep["block"], string> = {
  common: "How the work reaches you",
  spine: "How your business runs",
  overlay: "Your trade specifically",
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
  let currentBlock: InterviewStep["block"] | null = null;

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
