/**
 * Sage / Catalyst diagnostic logic — "This isn't a form. It's a scan."
 * Pure functions + data, no DOM, fully deterministic (scripted demo).
 * Voice: business doctor for SMEs · leak language · Diagnose. Build. Prove.
 * Tiers: Starter £597 / Pro £1,497 / Max £4,997.
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
  trades: "trades & home services",
  property: "property & estate agencies",
  hospitality: "hospitality",
  clinic: "clinics & healthcare",
  beauty: "salons & personal care",
  auto: "auto & repair",
  professional: "professional services",
  ecommerce: "e-commerce & retail",
  other: "business",
};

export const STEPS: Step[] = [
  {
    id: "industry",
    kicker: "01 · Your world",
    question: "What kind of business are we scanning?",
    hint: "Pick the closest — Sage already knows the leak patterns for your industry.",
    inputType: "choose",
    options: [
      { value: "trades", label: "Trades & home services", desc: "Plumbing, electrical, gas, building" },
      { value: "property", label: "Property & estate agents", desc: "Sales, lettings, management" },
      { value: "hospitality", label: "Hospitality & restaurants" },
      { value: "clinic", label: "Clinics & healthcare" },
      { value: "beauty", label: "Salons & personal care" },
      { value: "auto", label: "Auto & repair" },
      { value: "professional", label: "Professional services", desc: "Accountants, solicitors, recruitment" },
      { value: "ecommerce", label: "E-commerce & retail" },
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
    default: 8,
    minLabel: "Solo",
    maxLabel: "300+",
  },
  {
    id: "stage",
    kicker: "03 · Stage",
    question: "Where are you on the growth curve?",
    hint: "Be honest — it changes what we fix first.",
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
    hint: "There's no wrong answer here.",
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
      { value: "quotes", label: "Cold quotes — no follow-up" },
      { value: "reviews", label: "Forgotten reviews" },
      { value: "lapsed", label: "Lapsed customers" },
      { value: "search", label: "Invisible online & in AI search" },
      { value: "admin", label: "Admin drag — quoting, invoicing, chasing" },
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
    hint: "A gut number is fine — it calibrates the scan.",
    inputType: "slide",
    min: 0,
    max: 100000,
    step: 1000,
    default: 6000,
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

export function computeTier(a: Answers): "starter" | "pro" | "max" {
  const team = Number(a.scale) || 0;
  const val = Number(a.value) || 0;
  if (team >= 25 || val >= 30000 || (a.stage === "established" && val >= 15000)) return "max";
  if (team >= 6 || a.stage === "growing" || a.stage === "established" || val >= 8000) return "pro";
  return "starter";
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
    calls: "Missed calls are your loudest leak — 30–60% of inbound calls go unanswered, and most callers just dial the next business. Voice AI captures and books them, day or night.",
    quotes: "Quotes go cold while you're on the next job. Sequenced follow-up chases every one until it converts or closes — no second chance left on the table.",
    reviews: "Every happy customer is a 5-star review you didn't ask for. An automated review engine turns finished jobs into the proof that wins the next ones.",
    lapsed: "Past customers sitting in your database are worth more than every cold prospect combined. Reactivation campaigns bring them back on autopilot.",
    search: "Your buyers ask ChatGPT, Perplexity and Google for a recommendation — and right now you don't come up. AEO/GEO visibility puts you in the answer.",
    admin: "Quoting, invoicing and chasing eat hours your team should spend earning. Automated, that time comes straight back to billable work.",
  };
  const aiObs: Record<string, string> = {
    none: "Starting from zero is an advantage — we install clean, owned systems with no legacy mess to unwind.",
    experimenting: "You've proven appetite. We consolidate the scattered experiments into one operating system you own.",
    tools: "You've proven appetite. We consolidate the scattered tools into one operating system you own.",
    embedded: "You're already running on AI — the leverage now is governance, attribution and provable ROI.",
  };
  const indObs =
    a.industry === "trades"
      ? "In the trades the leak is rarely the work — it's the missed call while you're on a job, the quote never chased, and the review never asked for. We close all three."
      : "For " + ind + ", the pattern repeats: capture every enquiry, follow up relentlessly, stay findable in search, and let systems carry the admin.";
  const lines: SnapshotLine[] = [
    { tag: "01", text: indObs },
    { tag: "02", text: painObs[a.pain as string] || painObs.calls },
    { tag: "03", text: aiObs[a.ai as string] || aiObs.none },
  ];
  const tier = computeTier(a);
  const route = {
    starter: {
      tierLabel: "Starter",
      track: "Starter",
      price: "£597/mo",
      ctaLabel: "Start the Catalyst diagnostic",
      note: "Plug your biggest leak first — one core system installed, founder-led onboarding, and a monthly ROI report. The diagnostic shows what that leak is worth before you commit.",
    },
    pro: {
      tierLabel: "Pro · most popular",
      track: "Pro",
      price: "£1,497/mo",
      ctaLabel: "Start the Catalyst diagnostic",
      note: "Two to three systems installed as one operating system, a full Catalyst diagnostic, quarterly strategy review, and a 90-day ROI proof report.",
    },
    max: {
      tierLabel: "Max",
      track: "Max",
      price: "£4,997/mo",
      ctaLabel: "Talk to us first",
      note: "Full service stack, dedicated capacity, custom AI builds and weekly proof reporting — operational transformation with an executive strategy partnership.",
    },
  }[tier];
  const indLabel = (STEPS[0].options!.find((o) => o.value === a.industry) || ({} as ChooseOption)).label || "business";
  return {
    title: "Here's where you're leaking in your " + (a.industry === "other" ? "business" : indLabel.toLowerCase()) + ".",
    lines,
    ...route,
  };
}

/* ---------- Sage scripted brain ---------- */

export const SAGE_SUGGEST = [
  "What's the Catalyst diagnostic?",
  "How much does it cost?",
  "What if it doesn't work?",
  "How is this different?",
];

export const SAGE_GREETING =
  "Hi, I'm Sage — ScaleSage's diagnostic intelligence. Ask me about the scan, pricing, what we fix, or how we prove it.";

export function sageReply(q: string): string {
  const t = (q || "").toLowerCase();
  if (/diagnostic|catalyst|scan|audit|journey|form/.test(t))
    return "This isn't a form — it's a scan. The Catalyst diagnostic checks your missed calls, follow-up speed, search and AI visibility, retention and operations drag, then shows you exactly where revenue is leaving the building, what to fix first, and what recovery looks like in numbers. About 15 minutes.";
  if (/price|pricing|cost|how much|fee|£|expensive|budget|tier/.test(t))
    return "Three tiers, monthly: Starter £597 (one acute leak plugged), Pro £1,497 (a 2–3 system operating system — most popular), and Max £4,997 (full transformation, dedicated capacity). Not sure which? Run the Catalyst diagnostic — it shows what your leak is worth and what to fix first.";
  if (/work|prove|proof|result|roi|guarantee|number|baseline/.test(t))
    return "Every system has a number against it. We measure a baseline at install, track improvement weekly, and ship a ROI proof report every 90 days. If we can't prove it moved your numbers, we didn't earn the retainer.";
  if (/own|ownership|keep|lock.?in|template|contract|cancel/.test(t))
    return "The systems are built into your business, not bolted on — and cancellation is self-serve, never “email us”. No long lock-in. You stay in control.";
  if (/different|why|agency|better|compare|tool|chatbot|receptionist|99/.test(t))
    return "Most AI agencies hand you a tool — a chatbot, a £99 receptionist — and leave. We're the business doctor: we diagnose the leak, install the system that closes it, monitor it, and prove it moved your numbers. We don't sell tools; we fix what's costing you money.";
  if (/fast|quick|long|time|timeline|when|live/.test(t))
    return "The diagnostic turns around fast — you'll see your leak map in minutes. Build timelines are set in your scope; most first systems are live within days, not months.";
  if (/data|secur|gdpr|privacy|safe|train/.test(t))
    return "GDPR-compliant by design, UK and EU. We disclose exactly what the site loads, you own your data, and nothing is sold or used to train external AI.";
  if (/fix|service|do you|offer|build|voice|call|review|follow|seo|aeo|geo|visib|automat/.test(t))
    return "We close leaks in five groups: capture every enquiry (voice AI, missed-call recovery), convert every quote (sequenced follow-up), bring back every customer (reactivation), be findable everywhere (AEO/GEO + reviews), and run without you (ops automation). The diagnostic decides which leak we close first.";
  if (/book|start|begin|talk|contact|human|call you|speak/.test(t))
    return "Best way in is the Catalyst diagnostic — tap “Start the Catalyst diagnostic” anywhere on the page. No payment to begin, and you can book a call with the team straight after if you'd rather talk first.";
  return "Good question. I'm scoped to ScaleSage — the diagnostic, pricing, what we fix, ownership and how we prove results. The fastest way to your answer is the Catalyst diagnostic: it shows your leak, the fix, and the number. Want me to point you to it?";
}
