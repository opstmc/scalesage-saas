import { describe, expect, it } from "vitest";
import type { ScanAnswers } from "@/lib/catalyst";
import type { LookupMatch, PublicFinding, ResearchState } from "@/lib/catalyst-api";
import type { LookupState } from "./session";
import { pounds } from "./sections";
import {
  LINES,
  OTHER,
  buildThread,
  findingKey,
  pinLeads,
  tradesForLookup,
  type Message,
  type Open,
  type ThreadInput,
} from "./thread";

const YEAR = 2026;

const MATCH: LookupMatch = {
  name: "Aspect Plumbing",
  sector: "hvac_plumbing_heating",
  incorporated_year: 2014,
  location: "Leeds",
  review_count: 63,
  rating: 4.8,
  source: "both",
  confidence: 0.9,
};
const FOUND: LookupState = { confirmed: true, manual: false, match: MATCH };
const MANUAL: LookupState = { confirmed: true, manual: true, match: null };

const CALLS_1: PublicFinding = {
  leak: "missed_calls",
  side: "for",
  claim: "The site gives one phone line and no out-of-hours option.",
  quote: "Call us Monday to Friday, 8am to 5pm",
};
const CALLS_2: PublicFinding = {
  leak: "missed_calls",
  side: "for",
  claim: "A review mentions an unanswered call.",
  quote: "Rang three times and nobody picked up",
};
const QUOTES_1: PublicFinding = {
  leak: "cold_quotes",
  side: "against",
  claim: "Reviews praise quick quotes.",
  quote: "Quote came back the same afternoon",
};

const RESEARCH: ResearchState = {
  status: "complete",
  google_business: { exists: true, rating: 4.8, review_count: 63, ranks_page_one: false },
  website: { loads: true, load_ms: 1840, click_to_call: false },
  ai_presence: { appears: false, note: "" },
  finished: true,
  activity: null,
  findings: [CALLS_1, CALLS_2, QUOTES_1],
  rivals: [{ name: "Leeds Heat Ltd", rating: 4.9, review_count: 212 }],
  ai_named_by: [],
  estimates: {
    one_job_a_week_pence: 140000,
    missed_calls: { monthly_pence: 182000, basis: "benchmark", workings: "" },
    cold_quotes: { monthly_pence: 96000, basis: "benchmark", workings: "" },
    lapsed_customers: null,
  },
};

const ALL: ScanAnswers = {
  business: "Aspect Plumbing",
  sectors: ["plumbers"],
  team: "2-5",
  job_value: "150_500",
  capture: "rings-out",
  followup: "try-once",
  reviews: "when-remember",
  retention: "just-hope",
  ai_check: "not-checked",
  relief: "stop-missing",
  problems_raw: "",
};

function input(over: Partial<ThreadInput> = {}): ThreadInput {
  return {
    answers: ALL,
    lookup: FOUND,
    naming: { submitted: null, pending: false, match: null, rejected: false },
    checks: RESEARCH,
    research: RESEARCH,
    running: false,
    leads: {},
    editing: null,
    tradeList: false,
    year: YEAR,
    ...over,
  };
}

function sageTexts(messages: Message[]): string[] {
  const out: string[] = [];
  for (const m of messages) {
    if (m.kind === "sage" || m.kind === "question" || m.kind === "details") out.push(m.text);
    if (m.kind === "question" && m.hint) out.push(m.hint);
    if (m.kind === "lead") out.push(m.finding.claim, m.finding.quote);
    if (m.kind === "result") {
      out.push(...m.lines, ...m.findings.flatMap((f) => [f.claim, f.quote]));
      if (m.estimate) out.push(m.estimate.text, m.estimate.note);
    }
  }
  return out;
}

function answerOpen(answers: ScanAnswers, open: Open): ScanAnswers {
  if (open.kind === "trade-confirm") return { ...answers, sectors: [open.trades[0].value] };
  if (open.kind === "trades") return { ...answers, sectors: [open.groups[0].options[0].value] };
  if (open.kind === "single") return { ...answers, [open.stepId]: open.options[0].value };
  if (open.kind === "valve") return { ...answers, problems_raw: "" };
  throw new Error(`cannot answer ${open.kind}`);
}

describe("buildThread", () => {
  it("only puts numbers in Sage's lines that come from the answers, the lookup or the research", () => {
    const { messages } = buildThread(input({ leads: { enquiries: findingKey(CALLS_1) } }));
    const estimates = RESEARCH.estimates!;
    const sources = [
      JSON.stringify(ALL),
      JSON.stringify(MATCH),
      JSON.stringify(RESEARCH),
      pounds(estimates.one_job_a_week_pence!),
      pounds(estimates.missed_calls!.monthly_pence),
      pounds(estimates.cold_quotes!.monthly_pence),
      String(YEAR - MATCH.incorporated_year!),
    ].join(" ");
    const numbers = sageTexts(messages).flatMap((t) => t.match(/\d[\d,.]*\d|\d/g) ?? []);
    expect(numbers.length).toBeGreaterThan(0);
    for (const n of numbers) expect(sources, `"${n}" is not in the inputs`).toContain(n);
  });

  it("shows each finding with its exact quote", () => {
    const { messages } = buildThread(input({ leads: { enquiries: findingKey(CALLS_1) } }));
    const shown = messages.flatMap((m) => (m.kind === "lead" ? [m.finding] : m.kind === "result" ? m.findings : []));
    expect(shown).toContainEqual(CALLS_1);
    expect(shown).toContainEqual(CALLS_2);
    expect(shown).toContainEqual(QUOTES_1);
  });

  it("does not repeat a lead finding in its section's result", () => {
    const { messages } = buildThread(input({ leads: { enquiries: findingKey(CALLS_1) } }));
    const lead = messages.find((m) => m.kind === "lead");
    const result = messages.find((m) => m.kind === "result" && m.section === "enquiries");
    expect(lead && lead.kind === "lead" && lead.finding).toEqual(CALLS_1);
    expect(result && result.kind === "result" && result.findings).toEqual([CALLS_2]);
  });

  it("never waits for research: every question is asked and each leak result says it is still checking", () => {
    let answers: ScanAnswers = { business: "Aspect Plumbing" };
    let thread = buildThread(input({ answers, research: null, checks: null, running: true }));
    for (let guard = 0; thread.open.kind !== "details" && guard < 20; guard += 1) {
      answers = answerOpen(answers, thread.open);
      thread = buildThread(input({ answers, research: null, checks: null, running: true }));
    }
    expect(thread.open.kind).toBe("details");
    for (const section of ["enquiries", "quotes", "reviews", "past_customers"]) {
      const result = thread.messages.find((m) => m.kind === "result" && m.section === section);
      expect(result && result.kind === "result" && result.stillChecking, section).toBe(true);
    }
  });

  it("asks Jordan's AI question in the Online section, before the online result", () => {
    const { messages } = buildThread(input());
    const question = messages.findIndex((m) => m.kind === "question" && m.stepId === "ai_check");
    const result = messages.findIndex((m) => m.kind === "result" && m.section === "online");
    expect(question).toBeGreaterThan(-1);
    expect(messages[question].kind === "question" && messages[question].text).toBe(
      "Have you checked whether tools such as ChatGPT or Perplexity suggest your business when someone asks for this service?",
    );
    expect(question).toBeLessThan(result);
  });

  it("explains AI assistants to a visitor who asks what they are", () => {
    const { messages } = buildThread(input({ answers: { ...ALL, ai_check: "what-are-those" } }));
    const answered = messages.findIndex((m) => m.kind === "reply" && m.stepId === "ai_check");
    expect(messages[answered + 1]).toEqual({ id: "s:ai-explained", kind: "sage", text: LINES.aiExplained });
    expect(buildThread(input()).messages.some((m) => m.id === "s:ai-explained")).toBe(false);
  });

  it("opens the AI question when it is the first one unanswered", () => {
    const { open } = buildThread(input({ answers: { ...ALL, ai_check: undefined, relief: undefined } }));
    expect(open.kind === "single" && open.stepId).toBe("ai_check");
    expect(open.kind === "single" && open.options.map((o) => o.value)).toEqual([
      "yes-suggested",
      "yes-not-suggested",
      "not-checked",
      "what-are-those",
    ]);
  });

  it("keeps later answers when an earlier one is edited", () => {
    const editing = buildThread(input({ editing: "team" }));
    expect(editing.open).toMatchObject({ kind: "single", stepId: "team" });
    expect(editing.messages.some((m) => m.kind === "reply" && m.stepId === "capture")).toBe(false);

    const changed = buildThread(input({ answers: { ...ALL, team: "6-15" } }));
    expect(changed.open.kind).toBe("details");
    const reply = changed.messages.find((m) => m.kind === "reply" && m.stepId === "capture");
    expect(reply && reply.kind === "reply" && reply.text).toBe("It rings out or goes to voicemail");
  });

  it("confirms the trade the lookup found instead of asking for it", () => {
    expect(tradesForLookup(MATCH).map((o) => o.value)).toEqual(["plumbers", "gas-engineers"]);
    const { open } = buildThread(input({ answers: { business: "Aspect Plumbing" } }));
    expect(open.kind).toBe("trade-confirm");
    const notQuite = buildThread(input({ answers: { business: "Aspect Plumbing" }, tradeList: true }));
    expect(notQuite.open.kind).toBe("trades");
  });

  it("asks for the trade from the grouped list after a manual add", () => {
    const { open } = buildThread(input({ answers: { business: "Aspect Plumbing" }, lookup: MANUAL }));
    expect(open.kind).toBe("trades");
    if (open.kind === "trades") {
      expect(open.groups).toHaveLength(4);
      expect(open.groups.flatMap((g) => g.options)).toHaveLength(18);
      expect(open.other).toBe(true);
    }
  });

  it("shows Something else answers in the visitor's words", () => {
    const { messages } = buildThread(input({ answers: { ...ALL, capture: OTHER, capture_other: "My wife answers" } }));
    const reply = messages.find((m) => m.kind === "reply" && m.stepId === "capture");
    expect(reply && reply.kind === "reply" && reply.text).toBe("My wife answers");
  });

  it("asks the business name first and offers the match it found", () => {
    const empty = buildThread(input({ answers: {}, lookup: null, research: null, checks: null }));
    expect(empty.open.kind).toBe("name");
    const found = buildThread(
      input({
        answers: {},
        lookup: null,
        research: null,
        checks: null,
        naming: { submitted: "aspect", pending: false, match: MATCH, rejected: false },
      }),
    );
    expect(found.open.kind).toBe("match");
    expect(found.messages.some((m) => m.kind === "match")).toBe(true);
  });
});

describe("pinLeads", () => {
  it("pins the first finding for the section whose question is open, and keeps it", () => {
    const answers: ScanAnswers = { ...ALL, capture: undefined, followup: undefined };
    const pinned = pinLeads({}, input({ answers }));
    expect(pinned.enquiries).toBe(findingKey(CALLS_1));
    const later = pinLeads(pinned, input({ answers, research: { ...RESEARCH, findings: [CALLS_2, CALLS_1] } }));
    expect(later.enquiries).toBe(findingKey(CALLS_1));
  });

  it("pins no lead when nothing has landed, so a late finding goes in the result", () => {
    const answers: ScanAnswers = { ...ALL, capture: undefined, followup: undefined };
    const pinned = pinLeads({}, input({ answers, research: { ...RESEARCH, findings: [] } }));
    expect(pinned.enquiries).toBeNull();
    const { messages } = buildThread(input({ answers: ALL, leads: pinned }));
    expect(messages.some((m) => m.kind === "lead")).toBe(false);
    const result = messages.find((m) => m.kind === "result" && m.section === "enquiries");
    expect(result && result.kind === "result" && result.findings).toEqual([CALLS_1, CALLS_2]);
  });
});
