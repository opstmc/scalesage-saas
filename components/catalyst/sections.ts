import type { LeakKey, ScanEvidence } from "@/lib/catalyst";
import type { ChecksResult } from "@/lib/catalyst-api";

/* The scan in sections. Each section asks its questions, then shows what Sage
 * can already say about them: the visitor's own answers, what the research has
 * measured, and any finding it has quoted. Copy is JW-approval-pending. */

export type SectionId =
  | "business"
  | "job_value"
  | "enquiries"
  | "quotes"
  | "reviews"
  | "past_customers"
  | "online"
  | "priority";

export type EstimateKey = "missed_calls" | "cold_quotes" | "lapsed_customers";

export interface Section {
  id: SectionId;
  title: string;
  /** Question ids asked in this section, in order. */
  steps: string[];
  /** The leak this section rates, if any. */
  leak?: LeakKey;
  /** The research agent's leak id, for matching findings. */
  findingLeak?: string;
  /** The priced estimate this section shows, if any. */
  estimate?: EstimateKey;
}

export const SECTIONS: Section[] = [
  { id: "business", title: "Your business", steps: ["sectors", "team"] },
  { id: "job_value", title: "Job value", steps: ["job_value"] },
  { id: "enquiries", title: "Enquiries", steps: ["capture"], leak: "Missed calls", findingLeak: "missed_calls", estimate: "missed_calls" },
  { id: "quotes", title: "Quotes", steps: ["followup"], leak: "Cold quotes", findingLeak: "cold_quotes", estimate: "cold_quotes" },
  { id: "reviews", title: "Reviews", steps: ["reviews"], leak: "Forgotten reviews", findingLeak: "forgotten_reviews" },
  { id: "past_customers", title: "Past customers", steps: ["retention"], leak: "Lapsed customers", findingLeak: "lapsed_customers", estimate: "lapsed_customers" },
  { id: "online", title: "Online", steps: [], leak: "Invisible online", findingLeak: "invisible_online" },
  { id: "priority", title: "Your priority", steps: ["relief"] },
];

/** What Sage is doing, in plain words, keyed by the research agent's tool. */
export const ACTIVITY: Record<string, string> = {
  find_business: "Finding your listings",
  read_page: "Reading your website",
  google_reviews: "Reading your Google reviews",
  search_web: "Searching for your business",
  find_competitors: "Looking at local rivals",
  ask_ai_engines: "Asking AI engines about you",
  record_finding: "Noting what it found",
  writing_report: "Writing your report",
};

export function activityLine(activity: string | null | undefined): string {
  return (activity && ACTIVITY[activity]) || "Reading about your business";
}

/** The measured checks in the shape the scoring reads. */
export function evidenceFrom(checks: ChecksResult | null | undefined): ScanEvidence | undefined {
  if (!checks) return undefined;
  const g = checks.google_business;
  const w = checks.website;
  return {
    checks: {
      googleBusiness: g
        ? { exists: g.exists, rating: g.rating, reviewCount: g.review_count, ranksPageOne: g.ranks_page_one }
        : null,
      website: w ? { loads: w.loads, loadMs: w.load_ms, clickToCall: w.click_to_call ?? undefined } : null,
      aiPresence: checks.ai_presence ? { appears: checks.ai_presence.appears } : null,
    },
  };
}

export function pounds(pence: number): string {
  return `£${Math.round(pence / 100).toLocaleString("en-GB")}`;
}
