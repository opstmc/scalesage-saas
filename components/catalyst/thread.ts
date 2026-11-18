import {
  STEPS,
  VALVE,
  buildResult,
  jobValueOf,
  pipe,
  sectorOf,
  stemForAnswers,
  type Chip,
  type LeakKey,
  type ScanAnswers,
  type Step,
} from "@/lib/catalyst";
import type { ChecksResult, LookupMatch, PublicFinding, ResearchState } from "@/lib/catalyst-api";
import { reactionForLookup } from "./reactions";
import type { LookupState } from "./session";
import { SECTIONS, evidenceFrom, pounds, type Section, type SectionId } from "./sections";

/* The Catalyst scan as one conversation with Sage. The thread is calculated,
 * never stored: buildThread turns the answers, the lookup and the research into
 * Sage's messages and the visitor's replies, and says which question is open.
 * Editing, a refresh and the honesty rule all follow from that: every Sage line
 * is a fixed template filled from the answers, the lookup or the research, and
 * nothing is generated on the page.
 *
 * Question wording comes from catalyst.config.json. The connecting lines in
 * LINES and the trade groups are new and JW-approval-pending. The result lines
 * are the ones the section results used before, unchanged. */

export const OTHER = "__other__";

export interface Option {
  value: string;
  label: string;
  desc?: string;
}

/** The business name before the lookup is confirmed. */
export interface Naming {
  submitted: string | null;
  pending: boolean;
  match: LookupMatch | null;
  rejected: boolean;
}

/** Per section, the finding Sage led with, pinned when its question opened
 *  (null: nothing had landed yet). */
export type Leads = Partial<Record<SectionId, string | null>>;

export interface ThreadInput {
  answers: ScanAnswers;
  lookup: LookupState | null;
  naming: Naming;
  checks: ChecksResult | null;
  research: ResearchState | null;
  running: boolean;
  leads: Leads;
  editing: string | null;
  /** The visitor said "Not quite" to the trade the lookup found. */
  tradeList: boolean;
  year: number;
}

export interface Estimate {
  text: string;
  note: string;
}

export type Message =
  | { id: string; kind: "sage"; text: string }
  | { id: string; kind: "question"; stepId: string; text: string; hint?: string }
  | { id: string; kind: "match"; match: LookupMatch }
  | { id: string; kind: "lead"; section: SectionId; finding: PublicFinding }
  | {
      id: string;
      kind: "result";
      section: SectionId;
      title: string;
      leak: LeakKey | null;
      chip: Chip | null;
      lines: string[];
      estimate: Estimate | null;
      findings: PublicFinding[];
      stillChecking: boolean;
    }
  | { id: string; kind: "reply"; stepId: string; text: string; editable: boolean }
  | { id: string; kind: "details"; text: string };

export interface TradeGroup {
  label: string;
  options: Option[];
}

export type Open =
  | { kind: "name" }
  | { kind: "pending" }
  | { kind: "match"; match: LookupMatch }
  | { kind: "manual"; name: string }
  | { kind: "trade-confirm"; stepId: "sectors"; trades: Option[] }
  | { kind: "trades"; stepId: "sectors"; groups: TradeGroup[]; other: boolean }
  | { kind: "single"; stepId: string; options: Option[]; other: boolean }
  | { kind: "valve"; stepId: string }
  | { kind: "details" };

export interface Thread {
  messages: Message[];
  open: Open;
}

/* ---- copy: JW-approval-pending ---- */

function listOf(items: string[], last = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

export const LINES = {
  matchAsk: "Is this you?",
  matchYes: "Yes, that's us",
  matchNo: "Not this one",
  found: reactionForLookup(false),
  manual: reactionForLookup(true),
  noMatch: "I couldn't find a match. Check the name and send it again, or use it exactly as you typed it.",
  retype: "No problem. Type the name again, or use it exactly as you wrote it.",
  asTyped: (name: string) => `Use "${name}"`,
  tradeAsk: (labels: string[]) =>
    labels.length === 1
      ? `Your listing says ${labels[0].toLowerCase()}. Is that right?`
      : `Your listing says ${listOf(labels.map((l) => l.toLowerCase()), "or")}. Which fits best?`,
  tradeYes: "Yes, that's right",
  tradeNo: "Not quite",
  leadFor: "Before I ask, here's what I found",
  leadAgainst: "Before I ask, one in your favour",
  resultFor: "What Sage found",
  resultAgainst: "In your favour",
  stillChecking: "Sage is still checking this. Anything it finds goes into your report.",
  valveSkip: "Nothing else",
  closing: (leaks: string[]) =>
    leaks.length ? `That's everything I need. I can see likely leaks in ${listOf(leaks)}.` : "That's everything I need.",
  closingAsk: "Where should I send your report?",
};

export const TRADE_GROUPS: { label: string; values: string[] }[] = [
  { label: "Building and home", values: ["plumbers", "electricians", "gas-engineers", "builders", "tree-surgeons", "cleaning"] },
  { label: "Professional services", values: ["accountants", "solicitors", "recruitment", "estate-agents", "property-mgmt"] },
  { label: "Health, beauty and care", values: ["clinics", "salons", "fitness", "pet-services"] },
  { label: "Motor, hospitality and retail", values: ["auto-repair", "hospitality", "ecommerce"] },
];

/* ---- steps and answers ---- */

const STEP_BY_ID = new Map<string, Step>(STEPS.map((s) => [s.id, s]));
const BUSINESS = STEPS[0];
const SECTORS = STEP_BY_ID.get("sectors")!;

/** Every question after the business name, in the order Sage asks them. */
export const ASKED: string[] = SECTIONS.flatMap((s) => s.steps);

/** The questions the header counts: the business name and ASKED. */
export const QUESTION_COUNT = 1 + ASKED.length;

function optionsOf(step: Step): Option[] {
  return step.options.map((o) => ({ value: o.value, label: o.label, desc: o.desc }));
}

function selected(answers: ScanAnswers, id: string): string[] {
  const v = answers[id];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x !== "");
  return typeof v === "string" && v !== "" ? [v] : [];
}

function otherText(answers: ScanAnswers, id: string): string {
  const v = answers[`${id}_other`];
  return typeof v === "string" ? v.trim() : "";
}

export function isAnswered(answers: ScanAnswers, id: string): boolean {
  if (id === VALVE.id) return typeof answers[id] === "string";
  return selected(answers, id).length > 0;
}

/** The step to ask now: the one being edited, else the first one unanswered,
 *  else null (the scan is done and the details form opens). */
export function openStepId(answers: ScanAnswers, editing: string | null): string | null {
  if (editing) return editing;
  return [...ASKED, VALVE.id].find((id) => !isAnswered(answers, id)) ?? null;
}

export function answeredCount(answers: ScanAnswers, lookup: LookupState | null): number {
  return (lookup?.confirmed ? 1 : 0) + ASKED.filter((id) => isAnswered(answers, id)).length;
}

export function questionText(step: Step, answers: ScanAnswers): string {
  let text = step.question;
  try {
    text = stemForAnswers(step, answers) || step.question;
  } catch {
    text = step.question;
  }
  return pipe(text, answers);
}

export function replyText(answers: ScanAnswers, id: string): string {
  if (id === VALVE.id) {
    const text = typeof answers[id] === "string" ? String(answers[id]).trim() : "";
    return text || LINES.valveSkip;
  }
  const step = STEP_BY_ID.get(id);
  const labels = selected(answers, id).map((v) =>
    v === OTHER ? otherText(answers, id) || "Something else" : step?.options.find((o) => o.value === v)?.label ?? v,
  );
  return labels.join(", ");
}

/** The trades whose `matches` include the lookup's sector. */
export function tradesForLookup(match: LookupMatch | null | undefined): Option[] {
  const sector = match?.sector;
  if (!sector) return [];
  return optionsOf({ ...SECTORS, options: SECTORS.options.filter((o) => o.matches?.includes(sector)) });
}

export function tradeGroups(): TradeGroup[] {
  const all = optionsOf(SECTORS);
  return TRADE_GROUPS.map((g) => ({
    label: g.label,
    options: g.values.map((v) => all.find((o) => o.value === v)).filter((o): o is Option => Boolean(o)),
  }));
}

/* ---- findings ---- */

export function findingKey(f: PublicFinding): string {
  return `${f.leak}|${f.claim}|${f.quote}`;
}

function sectionOf(stepId: string | null): Section | null {
  if (!stepId) return null;
  return SECTIONS.find((s) => s.steps.includes(stepId)) ?? null;
}

function leadOf(section: Section, input: ThreadInput, openSection: Section | null): PublicFinding | null {
  if (!section.findingLeak || !section.steps.length) return null;
  const findings = input.research?.findings ?? [];
  const pinned = input.leads[section.id];
  if (pinned === null) return null;
  if (typeof pinned === "string") return findings.find((f) => findingKey(f) === pinned) ?? null;
  if (openSection?.id !== section.id) return null;
  return findings.find((f) => f.leak === section.findingLeak) ?? null;
}

/** Pin the lead of the section whose question is open, the moment it opens, so
 *  a finding that lands later goes in the result instead of appearing above a
 *  question already on screen. */
export function pinLeads(leads: Leads, input: ThreadInput): Leads {
  if (!input.lookup?.confirmed) return leads;
  const section = sectionOf(openStepId(input.answers, input.editing));
  if (!section?.findingLeak || leads[section.id] !== undefined) return leads;
  const lead = (input.research?.findings ?? []).find((f) => f.leak === section.findingLeak);
  return { ...leads, [section.id]: lead ? findingKey(lead) : null };
}

/* ---- result lines (moved unchanged from the section results) ---- */

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
}

function sectorPhrase(answers: ScanAnswers): string {
  const sector = sectorOf(answers);
  if (sector !== "other") return pipe("{sectors}", { sectors: [sector] } as ScanAnswers).toLowerCase();
  const typed = typeof answers.sectors_other === "string" ? answers.sectors_other.trim() : "";
  return typed || "your trade";
}

function teamPhrase(team: unknown): string {
  if (team === "just-me") return "just you";
  return pipe("a team of {team}", { team } as ScanAnswers);
}

function businessLines(input: ThreadInput): string[] {
  const { answers, checks, lookup, running } = input;
  const name = pipe("{business}", answers);
  const lines = [`Sage has ${name} down as ${sectorPhrase(answers)}, with ${teamPhrase(answers.team)}.`];
  const rating = checks?.google_business?.rating ?? lookup?.match?.rating ?? null;
  const count = checks?.google_business?.review_count ?? lookup?.match?.review_count ?? null;
  if (rating != null && count != null) lines.push(`Google shows ${rating} stars from ${plural(count, "review", "reviews")}.`);
  else if (running) lines.push("Sage is looking up your Google listing and Companies House record now.");
  else lines.push("Sage couldn't find your Google listing yet. Your report checks again.");
  const year = lookup?.match?.incorporated_year;
  if (typeof year === "number") {
    const age = input.year - year;
    if (age > 0) lines.push(`Registered with Companies House in ${year}: ${plural(age, "year", "years")} of customers behind you.`);
  }
  return lines;
}

function jobValueLines(answers: ScanAnswers, research: ResearchState | null): string[] {
  if (jobValueOf(answers) == null) {
    return ["No problem. Sage will use typical figures for your trade and mark them as estimates."];
  }
  const pence = research?.estimates?.one_job_a_week_pence;
  if (typeof pence === "number") return [`One lost job a week is about ${pounds(pence)} a month.`];
  return ["Sage will use this to put pounds on each leak."];
}

function reviewLines(checks: ChecksResult | null, research: ResearchState | null, running: boolean): string[] {
  const lines: string[] = [];
  const own = checks?.google_business;
  if (own?.rating != null && own.review_count != null) {
    lines.push(`You: ${own.rating} stars from ${plural(own.review_count, "review", "reviews")}.`);
  }
  for (const rival of research?.rivals ?? []) {
    if (rival.name && rival.rating != null && rival.review_count != null) {
      lines.push(`Nearby, ${rival.name}: ${rival.rating} stars from ${plural(rival.review_count, "review", "reviews")}.`);
    }
  }
  if (!lines.length && !running) lines.push("Sage couldn't compare your reviews with local rivals yet. Your report checks again.");
  return lines;
}

function onlineLines(checks: ChecksResult | null, research: ResearchState | null, running: boolean): string[] {
  const lines: string[] = [];
  const google = checks?.google_business;
  if (google?.exists === false) lines.push("No Google Business Profile found.");
  else if (google?.ranks_page_one === true) lines.push("You show on Google's first page for your trade.");
  else if (google?.ranks_page_one === false) lines.push("You don't show on Google's first page for your trade yet.");
  const named = research?.ai_named_by ?? [];
  if (named.length) lines.push(`Named by ${named.join(", ")} when Sage asked.`);
  else if (checks?.ai_presence?.appears === false) lines.push("Not named by the AI engines Sage asked.");
  if (!lines.length) {
    lines.push(running ? "Sage is still measuring this." : "Sage couldn't measure this yet. Your report checks again.");
  }
  return lines;
}

function estimateNote(basis: string, hasJobValue: boolean): string {
  if (basis === "their_number") return "From your own figures.";
  return hasJobValue
    ? "An estimate from your job value and typical figures for your trade."
    : "An estimate from typical figures for your trade.";
}

/* ---- the thread ---- */

function chipsOf(input: ThreadInput): Map<LeakKey, Chip> {
  try {
    return new Map(buildResult(input.answers, evidenceFrom(input.checks)).nodes.map((n) => [n.leak, n.chip]));
  } catch {
    return new Map();
  }
}

function resultOf(section: Section, input: ThreadInput, lead: PublicFinding | null, chips: Map<LeakKey, Chip>): Message {
  const { answers, checks, research, running } = input;
  const lines =
    section.id === "business"
      ? businessLines(input)
      : section.id === "job_value"
        ? jobValueLines(answers, research)
        : section.id === "reviews"
          ? reviewLines(checks, research, running)
          : section.id === "online"
            ? onlineLines(checks, research, running)
            : [];
  const priced = section.estimate ? research?.estimates?.[section.estimate] ?? null : null;
  const leadKey = lead ? findingKey(lead) : null;
  const findings = section.findingLeak
    ? (research?.findings ?? []).filter((f) => f.leak === section.findingLeak && findingKey(f) !== leadKey).slice(0, 2)
    : [];
  return {
    id: `res:${section.id}`,
    kind: "result",
    section: section.id,
    title: section.title,
    leak: section.leak ?? null,
    chip: section.leak ? chips.get(section.leak) ?? null : null,
    lines,
    estimate: priced
      ? {
          text: `Estimated leak: about ${pounds(priced.monthly_pence)} a month.`,
          note: estimateNote(priced.basis, jobValueOf(answers) != null),
        }
      : null,
    findings,
    stillChecking: Boolean(section.findingLeak) && !lead && findings.length === 0 && running,
  };
}

function question(step: Step, answers: ScanAnswers): Extract<Message, { kind: "question" }> {
  const hint = step.hint ? pipe(step.hint, answers) : undefined;
  return { id: `q:${step.id}`, kind: "question", stepId: step.id, text: questionText(step, answers), hint };
}

function reply(answers: ScanAnswers, stepId: string): Message {
  return { id: `r:${stepId}`, kind: "reply", stepId, text: replyText(answers, stepId), editable: true };
}

function openFor(step: Step): Open {
  return { kind: "single", stepId: step.id, options: optionsOf(step), other: step.other === true };
}

function opening(input: ThreadInput, messages: Message[]): Open | null {
  messages.push({ ...question(BUSINESS, input.answers), hint: undefined });
  const { lookup, naming } = input;
  if (lookup?.confirmed) {
    const name = typeof input.answers.business === "string" && input.answers.business ? input.answers.business : lookup.match?.name ?? "";
    messages.push({ id: "r:business", kind: "reply", stepId: "business", text: name, editable: false });
    if (!lookup.manual && lookup.match) {
      messages.push({ id: "match", kind: "match", match: lookup.match });
      messages.push({ id: "r:match", kind: "reply", stepId: "business", text: LINES.matchYes, editable: false });
      messages.push({ id: "s:found", kind: "sage", text: LINES.found });
    } else {
      messages.push({ id: "s:manual", kind: "sage", text: LINES.manual });
    }
    return null;
  }
  if (!naming.submitted) return { kind: "name" };
  messages.push({ id: "r:business", kind: "reply", stepId: "business", text: naming.submitted, editable: false });
  if (naming.pending) return { kind: "pending" };
  if (naming.match && !naming.rejected) {
    messages.push({ id: "match", kind: "match", match: naming.match });
    return { kind: "match", match: naming.match };
  }
  if (naming.match) {
    messages.push({ id: "match", kind: "match", match: naming.match });
    messages.push({ id: `r:match-no:${naming.submitted}`, kind: "reply", stepId: "business", text: LINES.matchNo, editable: false });
    messages.push({ id: `s:retype:${naming.submitted}`, kind: "sage", text: LINES.retype });
  } else {
    messages.push({ id: `s:no-match:${naming.submitted}`, kind: "sage", text: LINES.noMatch });
  }
  return { kind: "manual", name: naming.submitted };
}

/** The trade: confirmed from the lookup when it found one, else the grouped list. */
function trade(input: ThreadInput, messages: Message[], target: string | null): Open | null {
  const { answers, lookup, editing } = input;
  const trades = lookup?.manual ? [] : tradesForLookup(lookup?.match);
  const chosen = selected(answers, "sectors");
  const confirmed = chosen.length === 1 && trades.some((t) => t.value === chosen[0]);
  if (trades.length && editing !== "sectors") {
    messages.push({ id: "q:trade", kind: "question", stepId: "sectors", text: LINES.tradeAsk(trades.map((t) => t.label)) });
    const answeredHere = target !== "sectors" && confirmed;
    if (!answeredHere && !input.tradeList && target === "sectors") return { kind: "trade-confirm", stepId: "sectors", trades };
    if (answeredHere) {
      const text = trades.length === 1 ? LINES.tradeYes : replyText(answers, "sectors");
      messages.push({ id: "r:trade", kind: "reply", stepId: "sectors", text, editable: true });
      return null;
    }
    messages.push({ id: "r:trade-no", kind: "reply", stepId: "sectors", text: LINES.tradeNo, editable: false });
  }
  messages.push(question(SECTORS, answers));
  if (target === "sectors") return { kind: "trades", stepId: "sectors", groups: tradeGroups(), other: SECTORS.other === true };
  messages.push(reply(answers, "sectors"));
  return null;
}

export function buildThread(input: ThreadInput): Thread {
  const messages: Message[] = [];
  const first = opening(input, messages);
  if (first) return { messages, open: first };

  const { answers } = input;
  const target = openStepId(answers, input.editing);
  const openSection = sectionOf(target);
  const chips = chipsOf(input);

  for (const section of SECTIONS) {
    const lead = leadOf(section, input, openSection);
    if (lead) messages.push({ id: `lead:${section.id}`, kind: "lead", section: section.id, finding: lead });
    for (const stepId of section.steps) {
      if (stepId === "sectors") {
        const open = trade(input, messages, target);
        if (open) return { messages, open };
        continue;
      }
      const step = STEP_BY_ID.get(stepId);
      if (!step) continue;
      messages.push(question(step, answers));
      if (stepId === target) return { messages, open: openFor(step) };
      messages.push(reply(answers, stepId));
    }
    if (section.id !== "priority") messages.push(resultOf(section, input, lead, chips));
  }

  messages.push({
    id: `q:${VALVE.id}`,
    kind: "question",
    stepId: VALVE.id,
    text: pipe(VALVE.question, answers),
    hint: VALVE.hint,
  });
  if (target === VALVE.id) return { messages, open: { kind: "valve", stepId: VALVE.id } };
  messages.push(reply(answers, VALVE.id));

  const leaks = [...chips.entries()]
    .filter(([, chip]) => chip === "Detected" || chip === "Likely")
    .map(([leak]) => leak.toLowerCase());
  messages.push({ id: "s:closing", kind: "sage", text: LINES.closing(leaks) });
  messages.push({ id: "details", kind: "details", text: LINES.closingAsk });
  return { messages, open: { kind: "details" } };
}
