/**
 * Sage / Catalyst Journey logic — ported verbatim (semantics) from the
 * ScaleSage.dc.html prototype. Pure functions + data, no DOM, fully
 * deterministic (scripted Sage, as the brief locked in).
 */

export type Answers = Record<string, string | number>;

export interface ChooseOption {
  value: string;
  label: string;
  desc?: string;
}

export interface Step {
  id: string;
  kicker: string;
  question: string;
  hint: string;
  inputType: "choose" | "slide" | "type";
  options?: ChooseOption[];
  chips?: string[];
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  minLabel?: string;
  maxLabel?: string;
  money?: boolean;
}

export const INDUSTRY: Record<string, string> = {
  mep: "Commercial MEP",
  trades: "trades & home services",
  realestate: "real estate",
  restaurant: "restaurant & hospitality",
  saas: "B2B SaaS",
  healthcare: "healthcare",
  deeptech: "deeptech",
  gov: "government & defense",
  other: "business",
};

export const STEPS: Step[] = [
  {
    id: "industry",
    kicker: "01 · Your world",
    question: "What kind of business are we diagnosing?",
    hint: "Pick the closest — it shapes everything Sage looks at next.",
    inputType: "choose",
    options: [
      { value: "mep", label: "Commercial MEP / Construction", desc: "Mechanical, electrical, plumbing, data-center buildout" },
      { value: "trades", label: "Trades & home services", desc: "Local, recurring, call-driven" },
      { value: "realestate", label: "Real estate", desc: "Agencies, brokerages, property" },
      { value: "restaurant", label: "Restaurants & hospitality" },
      { value: "saas", label: "B2B SaaS" },
      { value: "healthcare", label: "Healthcare" },
      { value: "deeptech", label: "Deeptech / Space / Robotics" },
      { value: "gov", label: "Government & Defense" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "scale",
    kicker: "02 · Scale",
    question: "How big is the team today?",
    hint: "Drag to your headcount. Close enough is fine.",
    inputType: "slide",
    min: 1,
    max: 300,
    step: 1,
    default: 12,
    minLabel: "Solo",
    maxLabel: "300+",
  },
  {
    id: "stage",
    kicker: "03 · Stage",
    question: "Where are you on the growth curve?",
    hint: "Be honest — it changes what we prioritise.",
    inputType: "choose",
    options: [
      { value: "starting", label: "Just starting" },
      { value: "traction", label: "Finding traction" },
      { value: "growing", label: "Growing fast" },
      { value: "established", label: "Established & scaling" },
    ],
  },
  {
    id: "ai",
    kicker: "04 · AI maturity",
    question: "How much AI is already in your operation?",
    hint: "There is no wrong answer here.",
    inputType: "choose",
    options: [
      { value: "none", label: "None yet" },
      { value: "experimenting", label: "Experimenting" },
      { value: "tools", label: "A few tools in places" },
      { value: "embedded", label: "Embedded across ops" },
    ],
  },
  {
    id: "pain",
    kicker: "05 · The leak",
    question: "Where is revenue leaking out right now?",
    hint: "Pick the one that stings the most.",
    inputType: "choose",
    options: [
      { value: "calls", label: "Missed calls & lost leads" },
      { value: "followup", label: "Slow or no follow-up" },
      { value: "search", label: "Invisible in search & AI answers" },
      { value: "crm", label: "CRM & data chaos" },
      { value: "admin", label: "Manual quoting & admin" },
      { value: "scale", label: "Can't scale without hiring" },
    ],
  },
  {
    id: "goal",
    kicker: "06 · The win",
    question: "In one line — what does a win look like in 90 days?",
    hint: "Type it, or tap a starting point.",
    inputType: "type",
    chips: ["More booked jobs", "Recover lost revenue", "Win back my time", "Get found in AI search"],
  },
  {
    id: "value",
    kicker: "07 · The stakes",
    question: "Roughly how much revenue slips away each month?",
    hint: "A gut number is fine — it calibrates the diagnostic.",
    inputType: "slide",
    min: 0,
    max: 100000,
    step: 1000,
    default: 8000,
    money: true,
    minLabel: "£0",
    maxLabel: "£100k+",
  },
];

export function fmtMoney(v: number): string {
  if (v >= 100000) return "£100k+";
  if (v >= 1000) return "£" + v / 1000 + "k";
  return "£" + v;
}

export function scaleLabel(v: number): string {
  return v >= 300 ? "300+ people" : v === 1 ? "Solo / 1" : v + " people";
}

function findLabel(id: string, v: string | number): string {
  const s = STEPS.find((x) => x.id === id);
  const o = s && s.options && s.options.find((x) => x.value === v);
  return o ? o.label : String(v);
}

export interface LearnedChip {
  label: string;
  value: string;
}

export function learnedChips(a: Answers): LearnedChip[] {
  const out: LearnedChip[] = [];
  if (a.industry != null) out.push({ label: "Sector", value: findLabel("industry", a.industry) });
  if (a.scale != null) out.push({ label: "Team", value: scaleLabel(Number(a.scale)) });
  if (a.stage != null) out.push({ label: "Stage", value: findLabel("stage", a.stage) });
  if (a.ai != null) out.push({ label: "AI", value: findLabel("ai", a.ai) });
  if (a.pain != null) out.push({ label: "Primary leak", value: findLabel("pain", a.pain) });
  if (a.goal != null) out.push({ label: "Goal", value: String(a.goal) });
  if (a.value != null) out.push({ label: "Est. monthly leak", value: fmtMoney(Number(a.value)) });
  return out;
}

export function computeTier(a: Answers): "local" | "business" | "enterprise" {
  const team = Number(a.scale) || 0;
  const val = Number(a.value) || 0;
  if (team >= 120 || ((a.industry === "gov" || a.industry === "deeptech") && team >= 40) || val >= 60000) return "enterprise";
  if (team >= 15 || a.stage === "growing" || a.stage === "established" || val >= 20000) return "business";
  return "local";
}

export interface SnapshotLine {
  tag: string;
  text: string;
}

export interface Snapshot {
  title: string;
  lines: SnapshotLine[];
  tierLabel: string;
  track: string;
  price: string;
  ctaLabel: string;
  note: string;
}

export function buildSnapshot(a: Answers): Snapshot {
  const ind = INDUSTRY[a.industry as string] || "business";
  const painObs: Record<string, string> = {
    calls: "Unanswered calls are walking revenue out the door. An AI receptionist books them around the clock — typically 15–30% more captured.",
    followup: "Leads cool within minutes. Instant, persistent AI follow-up keeps every enquiry warm until it converts.",
    search: "Your buyers increasingly ask AI engines, not just Google — and right now you're likely absent from the answer.",
    crm: "Scattered data is silent leakage. One clean source of truth, maintained by agents, stops the bleed.",
    admin: "Hours vanish into manual quoting and admin each week. Automated, that time returns to billable work.",
    scale: "Growth shouldn't mean more headcount. Systems absorb the load so your margins hold as you scale.",
  };
  const aiObs: Record<string, string> = {
    none: "Starting from zero is an advantage — we build clean, owned systems with no legacy mess to unwind.",
    experimenting: "You've proven appetite. We consolidate the scattered experiments into one system you own.",
    tools: "You've proven appetite. We consolidate the scattered tools into one coherent system you own.",
    embedded: "You're already operating with AI — the leverage now is governance, verification and provable ROI.",
  };
  const indObs =
    a.industry === "mep"
      ? "In commercial MEP the leak is rarely the work — it's response speed, quoting throughput and being invisible when a GC searches for a partner."
      : "For " + ind + ", the highest-leverage fixes are usually faster capture, relentless follow-up and AI-search visibility.";
  const lines: SnapshotLine[] = [
    { tag: "01", text: indObs },
    { tag: "02", text: painObs[a.pain as string] || painObs.calls },
    { tag: "03", text: aiObs[a.ai as string] || aiObs.none },
  ];
  const tier = computeTier(a);
  const route = {
    local: { tierLabel: "Local", track: "Local Health Check", price: "£150", ctaLabel: "Book your Local Health Check", note: "Fully credited against your first retainer if you sign within 60 days — and you keep the report either way." },
    business: { tierLabel: "Business", track: "ScaleSage Diagnostic", price: "£750", ctaLabel: "Book your ScaleSage Diagnostic", note: "Credited in full against your first retainer if you sign within 60 days. The report is yours regardless." },
    enterprise: { tierLabel: "Enterprise", track: "Specialist consultation", price: "Direct", ctaLabel: "Talk to a specialist", note: "Enterprise scope is set with a specialist directly — no automated tier, no templates." },
  }[tier];
  const indLabel = (STEPS[0].options!.find((o) => o.value === a.industry) || ({} as ChooseOption)).label || "business";
  return {
    title: "Here's what we see in your " + (a.industry === "other" ? "business" : indLabel) + ".",
    lines,
    ...route,
  };
}

/* ---------- Sage scripted brain ---------- */

export const SAGE_SUGGEST = [
  "What's the diagnostic?",
  "How much does it cost?",
  "Do I own what you build?",
  "How is this different?",
];

export const SAGE_GREETING =
  "Hi, I'm Sage. Ask me anything about the diagnostic, pricing, ownership, or what we build.";

export function sageReply(q: string): string {
  const t = (q || "").toLowerCase();
  if (/diagnostic|catalyst|audit|journey/.test(t))
    return "The Catalyst Diagnostic is a paid, structured diagnosis of your business. Before any call, our agents study your site, reviews and competitor stack and build a working demo of the top fixes. Local Health Check is £150; the ScaleSage Diagnostic is £750 — and you keep the report either way.";
  if (/price|pricing|cost|how much|fee|£|expensive|budget/.test(t))
    return "Tiers are public: Local from £297/mo, Business from £997/mo, Enterprise from £9,997/mo. Your exact scope and quote are set by your diagnostic — and the diagnostic fee is credited in full against your first retainer if you sign within 60 days.";
  if (/own|ownership|keep|lock.?in|template/.test(t))
    return "You own everything we build — every system and agent. No templates, no lock-in. If we ever part ways, what we built stays with you.";
  if (/fast|quick|long|time|timeline|when/.test(t))
    return "The diagnostic turns around in days, not weeks — you'll often see a working demo before we've even met. Build timelines are set in your scope.";
  if (/different|why|agency|better|compare/.test(t))
    return "We diagnose before we pitch, prove with working demos, build systems you own, and verify outputs across multiple models. We're specialists — not a templated agency. Most agencies pitch features; we diagnose and deliver.";
  if (/data|secur|gdpr|privacy|safe|train/.test(t))
    return "Everything is encrypted, GDPR-compliant and consent-first. We never sell your data or use it to train external AI. You stay in control throughout.";
  if (/build|service|fix|do you|offer|agent|automat|seo|aeo|search|visib/.test(t))
    return "We build custom AI agents, automation (n8n/Make/custom), a Revenue Recovery OS, Search & AI Visibility (AEO/GEO/LLMO/SEO), Frontier Intelligence with working demos, a Trades Talent Engine, and AI Ops & Governance — all owned by you.";
  if (/book|start|begin|talk|contact|human|call/.test(t))
    return "The best way in is the Catalyst Journey — tap “Book Your Catalyst Diagnostic” anywhere on the page. No login or payment to begin, and Enterprise routes straight to a specialist.";
  return "Good question. I'm scoped to ScaleSage — the diagnostic, pricing, ownership, security, and what we build. For anything beyond that, the Catalyst Diagnostic is the best next step. Want me to point you to it?";
}
