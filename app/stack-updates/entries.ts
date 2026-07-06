// Stack Updates: the public, dated changelog.
//
// HONESTY RULE (hard): real, dated entries only. No invented history, no
// roadmap theatre, no vanity metrics. JW owns entries from here on: to log a
// shipment, prepend a new object to ENTRIES (newest first) and keep it factual.
//
// COPY: JW to approve.

export type StackEntry = {
  /** ISO date for <time dateTime>. */
  date: string;
  /** Human-readable date shown to visitors. */
  dateLabel: string;
  /** Short pill label, e.g. "Launch", "Visibility". */
  tag: string;
  title: string;
  body: string;
  items: string[];
  /** Marks the founding launch entry. */
  launch?: boolean;
};

// Newest first.
export const ENTRIES: StackEntry[] = [
  {
    date: "2026-07-06",
    dateLabel: "6 July 2026",
    tag: "Visibility",
    title: "Frontier Visibility layer and open AI crawler access.",
    body: "The visibility work went public, and the doors opened for the assistants that answer your buyers.",
    items: [
      "Frontier Visibility page published at /frontier.",
      "This public Stack Updates changelog opened.",
      "AI crawler access enabled in robots.txt: GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot.",
      "llms.txt routing file added, as a signpost for crawlers, not a ranking claim.",
    ],
  },
  {
    date: "2026-07-03",
    dateLabel: "3 July 2026",
    tag: "Launch",
    launch: true,
    title: "ScaleSage goes live at scalesage.ai.",
    body: "The first public build of the site and the Catalyst diagnostic.",
    items: [
      "Multi-page site live: home, how it works, industries, pricing and about.",
      "The Catalyst diagnostic (Sage), our scan that finds where revenue is leaking.",
      "Public monthly pricing, GDPR-compliant by design.",
    ],
  },
];
