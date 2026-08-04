/* ---------------------------------------------------------------------------
 * The offer — every price, volume and allowance on this site, held once.
 *
 * Source of truth: Offer Book v1.7 (31 July 2026, LOCKED), section 11 "the full
 * offer at a glance", plus the ratified decisions in Fix List Decisions v1.4.
 * Copied from canon, never retyped from memory, never invented here.
 *
 * WHY THIS FILE EXISTS. Every pricing drift item on the fix list traces to one
 * cause: the numbers lived in several components and humans copied them between
 * them. Three different landing-page prices inside one month is the symptom.
 * So the numbers live here and the components render them. A price change is
 * one Decision Log row and one edit in this file.
 *
 * The API serves the same document at GET /offer (src/core/offer.py in
 * scalesage-agents is the backend's copy of this same canon, and the Stripe
 * charge derives from it). This file is a deliberate local mirror rather than a
 * fetch: the marketing pages are statically rendered and must build even when
 * the API is unreachable. If the two ever disagree, canon settles it and both
 * get corrected.
 *
 * NOT here, and never templatable: guarantee wording (verbatim from LG-001
 * only), and outcome or revenue commitments (a client's Schedule A only).
 * ------------------------------------------------------------------------- */

/** The guarantee's name. "The ScaleSage Promise" is the brand-promise umbrella
 *  and is NOT a synonym for it; "compliance guarantee" was a typo and is dead.
 *  (Decision D6.) The wording itself comes verbatim from LG-001 and is not
 *  drafted in this codebase. */
export const GUARANTEE_NAME = "Implementation Guarantee";

export interface FoundingTerms {
  places: number;
  monthly: string;
  setup: string;
  note: string;
}

export interface Tier {
  key: "starter" | "pro" | "max";
  name: string;
  price: string;
  setup: string;
  best: string;
  sub: string;
  /** Plain-English "what this means for you", before the feature list. */
  meaning: string;
  includes: string[];
  badge?: string;
  featured?: boolean;
  waitlist?: boolean;
  waitlistNote?: string;
  founding?: FoundingTerms;
  /** The one-line nudge to the tier above, where there is one. */
  upgradeNote?: string;
}

export const TIERS: Tier[] = [
  {
    key: "starter",
    name: "Starter",
    price: "£597",
    setup: "£297 one-off setup",
    best: "Best for: sole traders getting more leads without hiring",
    sub: "For businesses ready to plug their biggest leak.",
    meaning:
      "Your missed calls get answered with an instant text. Every quote you send gets followed up automatically. Your reviews grow while you work. New customers find you on Google and, increasingly, in AI answers. You stop losing jobs to businesses that just pick up faster.",
    includes: [
      "Missed-call text-back, unlimited within fair use. Every genuine missed call triggers an instant, personalised SMS.",
      // Quote follow-up and the review system came out of the standard package
      // (03 Aug). They are not dropped, they are built to the business: both
      // depend on how a firm actually quotes and closes, so shipping one
      // configuration to everyone was selling a button rather than a system.
      "Cold email outreach, 1,500 targeted emails a month.",
      "AI search visibility scan, monthly, with a prioritised improvement plan, not just a score.",
      "Your dashboard: live lead pipeline, deliverables and a plain-numbers monthly ROI report, powered by Orbit Pro, including the full ScaleSage Score.",
      "Catalyst diagnostic every quarter, re-run with a personal video walkthrough so progress is measured, not assumed.",
      "AI builds included every quarter, per your plan quota.",
      "Automated weekly brief, written from your live numbers.",
      "Guided onboarding, and 24 hour support response, 8 hours for urgent issues.",
      "1 portal seat.",
      "Quote follow-up and the review system are built into your plan, shaped around how you actually quote and close. A system you can rely on, not a magic button.",
    ],
    founding: {
      places: 10,
      monthly: "£478",
      setup: "£148.50",
      note: "First 10 founding clients, 20 percent off for life, 12 month minimum term.",
    },
    upgradeNote:
      "Want calls answered 24/7 by a full AI agent, not just a text-back? That is the key upgrade to Pro.",
  },
  {
    key: "pro",
    name: "Pro",
    price: "£1,497",
    setup: "£747 one-off setup",
    best: "Best for: established operators ready to scale without hiring",
    sub: "For businesses ready to operate at a different level.",
    meaning:
      "Everything in Starter, plus your calls answered around the clock by a full AI agent, an outreach engine reaching thousands of businesses a month across email and LinkedIn, live human review of your visibility, and a monthly session with our operations lead on your numbers.",
    includes: [
      "Everything in Starter, plus the full system upgrade below.",
      "Full Voice AI agent, 750 minutes a month. Answers every call, qualifies the enquiry, books the job into your calendar.",
      "LinkedIn outreach included, 100 personalised connections a month with the follow-up sequence.",
      "Cold email outreach, 3,000 targeted emails a month.",
      "Live visibility work: your AI and search presence monitored live, human-reviewed, fixes queued and worked every month.",
      "Catalyst diagnostic every month, with the walkthrough.",
      // "Orbit Pro included, with the full ScaleSage Score" used to sit here and
      // was wrong: Starter already includes Orbit Pro and the full Score, so
      // listing it as a Pro line sold an upgrade that does not exist. Orbit does
      // not change between Starter and Pro. It changes at Max, to Premium.
      "AI builds included every month, per your plan quota.",
      "Quarterly reactivation campaigns against your dormant customer list.",
      "Monthly one-on-one Score Review, 60 minutes, live, on what moved and what is next.",
      "Marketing Support line: a direct channel for campaign, offer and copy questions.",
      "8 hour support response, 4 hours for urgent issues. 3 portal seats.",
    ],
    badge: "Most popular",
    featured: true,
    founding: {
      places: 5,
      monthly: "£1,198",
      setup: "£373.50",
      note: "First 5 founding clients, 20 percent off for life, 12 month minimum term.",
    },
  },
  {
    key: "max",
    name: "Max",
    price: "£4,997",
    setup: "£2,497 one-off setup",
    best: "Best for: multi-site operators and full operational transformation",
    sub: "For businesses ready to compound.",
    meaning:
      "The full operation, done for you. A named senior operator runs your account with daily oversight, your outreach runs at maximum safe volume across every channel, and the founder is personally in your quarterly strategy.",
    includes: [
      "Everything in Pro.",
      "Full Voice AI, done for you, 1,500 minutes a month.",
      "LinkedIn outreach included, 500 connections a month across multiple accounts.",
      "Cold email outreach, 6,000+ a month across safely managed sending inboxes.",
      "Multi-channel orchestration: email, LinkedIn and your pipeline running as one system.",
      "Weekly AI visibility work, and we do the work that moves it: content, citations, entity fixes.",
      "Catalyst diagnostic monthly, plus a quarterly deep dive.",
      "Orbit Premium included.",
      "AI builds included every month, per your plan quota.",
      "Twice-monthly one-on-ones: a mid-month pulse and a month-end review.",
      "Quarterly strategy with the founder, personally.",
      "Marketing and Content Support, with a monthly content planning session.",
      "Dedicated support channel. 4 hour response, 1 hour for urgent issues. Unlimited portal seats.",
      "Done for you: ScaleSage runs it.",
    ],
    waitlist: true,
    waitlistNote:
      "Max is accepting waitlist applications only, while we complete the certifications needed to support businesses at this scale. Run the Catalyst to join the list, and we will be in touch as soon as a place opens.",
  },
];

/* --- Bolt-ons: standalone price vs subscriber price ----------------------
 *
 * `includedAt` is the tiers where this is already part of the plan, so the
 * table can say plainly whether a row is an add-on you pay for or something
 * you already have. A price with no such marker used to read as "extra" even
 * when the reader's own tier included it.
 *
 * `tiers` turns a row into an expandable one. LinkedIn is sold at more than one
 * volume, and flattening those into a single price hid the actual ladder.
 */
export interface NestedTier {
  label: string;
  standalone: string;
  subscriber: string;
  note?: string;
}

export interface DualItem {
  item: string;
  standalone: string;
  subscriber: string;
  saving: string;
  note?: string;
  /** Tiers where this is already included, so it is not an add-on for them. */
  includedAt?: string[];
  /** When present the row expands to show the ladder underneath. */
  tiers?: NestedTier[];
}

export const BOLT_ONS: DualItem[] = [
  {
    item: "LinkedIn outreach",
    // A range, not a "from": the row expands to three real volumes and the
    // lowest figure alone made the ladder look cheaper than it is. The numbers
    // are the floor and ceiling of the tiers below, so the two cannot disagree.
    standalone: "£397 to £797",
    subscriber: "£197 to £497",
    saving: "£200 to £300",
    includedAt: ["Pro", "Max"],
    note: "Pick the volume that matches your pipeline.",
    tiers: [
      {
        label: "200 connections a month",
        standalone: "£397",
        subscriber: "£197",
        note: "One account. The entry volume.",
      },
      {
        label: "500 connections a month",
        standalone: "£797",
        subscriber: "£497",
        note: "Across multiple accounts. Included at Max.",
      },
      {
        label: "Multi-channel: email, LinkedIn and pipeline as one system",
        standalone: "£597",
        subscriber: "£297",
        note: "Included at Max.",
      },
    ],
  },
  { item: "Voice AI agent, 500 minutes", standalone: "£397", subscriber: "£127", saving: "£270", note: "Plus £197 setup.", includedAt: ["Pro", "Max"] },
  { item: "Missed-call SMS bot", standalone: "£67", subscriber: "£47", saving: "£20", note: "Unlimited within fair use.", includedAt: ["Starter", "Pro", "Max"] },
  { item: "Full website build", standalone: "£1,797", subscriber: "£997", saving: "£800" },
  { item: "Landing page", standalone: "£797", subscriber: "£397", saving: "£400" },
  { item: "Explainer video", standalone: "£1,497", subscriber: "£797", saving: "£700" },
  { item: "Pitch deck", standalone: "£897", subscriber: "£497", saving: "£400" },
  { item: "AI build, small", standalone: "£1,197", subscriber: "£597", saving: "£600", note: "One complete working automation" },
  { item: "AI build, medium", standalone: "£2,497", subscriber: "£1,297", saving: "£1,200", note: "A multi-step system" },
  { item: "AI build, large", standalone: "£4,997", subscriber: "£2,997", saving: "£2,000", note: "A business subsystem" },
  { item: "Database reactivation", standalone: "£997", subscriber: "£697", saving: "£300", note: "Plus a share of what we recover" },
  { item: "Frontier Visibility, weekly active", standalone: "£1,397", subscriber: "£997", saving: "£400", note: "Graded at every tier; this is the done-for-you level.", includedAt: ["Max"] },
];

/** Every bolt-on a partner can earn commission on, by name. The partner page
 *  reads this rather than restating the list, so the two cannot drift. */
export const COMMISSIONABLE_BOLT_ONS = BOLT_ONS.map((b) => b.item);

/* --- Orbit standalone ----------------------------------------------------
 * Repackaged Free / Pro / Premium; Solo is retired. The ladder is a model
 * tiering mechanic, not a feature wall: better tier, better brain, better
 * decisions. Waitlist framing only, and NO buy button, until the purchase path
 * ships in Phase 3 (Offer Book s2, engineering note). Nobody paying for the
 * service sits on the free product, which is why Starter bundles Orbit Pro.
 * ---------------------------------------------------------------------- */
export interface OrbitTier {
  name: string;
  price: string;
  line: string;
  includedWith?: string;
  detail: string;
}

export const ORBIT: OrbitTier[] = [
  {
    name: "Orbit Free",
    price: "£0",
    line: "Runs your day.",
    detail:
      "Daily decision engine, parking lot, queue, voice-note capture, mobile app and your mini Score. 1 seat, self-serve.",
  },
  {
    name: "Orbit Pro",
    price: "£49/mo",
    line: "Runs your business.",
    includedWith: "Starter and Pro",
    detail:
      "Everything in Free on stronger models, plus the full Score, the strategic planner, sector intelligence, email triage and the AI notetaker. 3 seats.",
  },
  {
    name: "Orbit Premium",
    price: "£149/mo",
    line: "Runs your team and your market.",
    includedWith: "Max",
    detail:
      "Everything in Pro on frontier models with deeper reasoning, plus Frontier Visibility live monitoring, advanced integrations and priority support. Unlimited seats.",
  },
];

export const ORBIT_ANNUAL_NOTE = "Annual option: two months free.";
export const ORBIT_WAITLIST_NOTE =
  "Orbit standalone is not on sale yet. Join the waitlist and you will be first in when it opens.";
export const VAT_NOTE = "All prices exclude VAT. Monthly rolling unless stated otherwise.";
