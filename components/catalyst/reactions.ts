/* ---------------------------------------------------------------------------
 * Sage's per-answer reactions — the conversational layer over the 13-Q scan.
 *
 * The scan structure + scoring live in catalyst.config.json / lib/catalyst.ts and
 * are NOT touched here. This file is ONLY the copy Sage says back after each
 * answer, so it reads like talking to an intelligence, not filling a form.
 *
 * ALL COPY HERE IS FIRST-DRAFT / JW-APPROVAL-PENDING — edit freely; changing a
 * line here never affects the questions or the leak scoring.
 *
 * reactionFor(stepId, selection) returns the line Sage says, or null (skip the
 * beat). single-select → per-option line; multi-select → the line for the
 * strongest selected signal, else the question's fallback; lookup/valve handled
 * by their own keys.
 * ------------------------------------------------------------------------- */

interface Reactions {
  byOption?: Record<string, string>;
  fallback?: string; // multi-select, "Something else", or an unmapped option
}

const REACTIONS: Record<string, Reactions> = {
  // Q1 lookup — see reactionForLookup() below (found vs manual).

  // Q2 sectors (multi)
  sectors: {
    fallback: "Every trade leaks in its own pattern. I already know yours.",
  },

  // Q3 years (single)
  years: {
    byOption: {
      "under-1": "New. Good — we build the system before the bad habits set in.",
      "1-3": "Past the hardest part. Now it is about not leaking what you win.",
      "3-10": "Years of customers behind you — most of them sitting idle right now.",
      "10-plus": "A decade-plus of goodwill. That is a bigger dormant base than you think.",
    },
    fallback: "Noted. The longer you have traded, the more is sitting there to reclaim.",
  },

  // Q4 team (single)
  team: {
    byOption: {
      "just-me": "So it all runs through you. That is the constraint we design around.",
      "2-5": "Small and tight. Every hour the phone steals is one you cannot spare.",
      "6-15": "Enough hands that things fall between them without a system.",
      "16-50": "At this size the leaks hide in the handovers.",
      "50-plus": "Big enough that a 1% leak is real money every month.",
    },
  },

  // Q5 sources (multi)
  sources: {
    byOption: {
      "not-sure": "If you cannot name where work comes from, you cannot protect it.",
    },
    fallback: "Good to know where it comes from. Now let us see what leaks on the way in.",
  },

  // Q6 capacity (multi)
  capacity: {
    byOption: {
      "couldnt-reach": "A phone no one can reach is a booked job walking next door.",
      "through-me": "If it all runs through you, you are the bottleneck and the risk.",
      "pile-up": "Piled-up enquiries rarely wait. They go cold, then they go elsewhere.",
    },
    fallback: "That tells me exactly where the strain sits. Noted.",
  },

  // Q7 capture (single)
  capture: {
    byOption: {
      "answers-quick": "Good — that is the exception, not the rule, in your trade.",
      "rings-out": "A ringing-out phone is a booked job walking to a competitor.",
      voicemail: "Most people will not leave one. They just call the next name.",
      "reply-later": "Later is often too late — they have already been quoted elsewhere.",
      "waits-morning": "By morning the urgent ones have gone somewhere else.",
      depends: "'Depends who is around' is another way of saying it slips through.",
    },
  },

  // Q8 followup (single)
  followup: {
    byOption: {
      "chase-me": "You chase — but that is your time doing a system's job.",
      "chase-staff": "Good someone chases. A system would never forget to.",
      "try-once": "One try leaves most of the yeses on the table.",
      forget: "That is the quiet one. Forgotten quotes are pure lost revenue.",
      nothing: "Silence loses more quotes than a no ever does.",
    },
  },

  // Q9 reviews (single)
  reviews: {
    byOption: {
      "auto-every": "Good — that is how proof compounds while you sleep.",
      "when-remember": "Remembering is the leak. The reviews you earned never got asked for.",
      "close-only": "You are leaving five-star proof on the table with everyone else.",
      "dont-ask": "Every happy job you did not ask is a review a competitor now has.",
      "no-start": "Fixable in a week — and the cheapest trust you will ever buy.",
    },
  },

  // Q10 retention (single)
  retention: {
    byOption: {
      "auto-schedule": "Good. Your back catalogue is working for you.",
      "by-hand": "By hand means some — and 'some' leaves money in the list.",
      "saved-idle": "A saved list you do not contact is a warm market going cold.",
      "just-hope": "Hope is not a retention plan. They are waiting to be asked.",
      "not-thought": "Most have not — which is exactly why it is the easiest win.",
    },
  },

  // Q11 visibility (multi)
  visibility: {
    byOption: {
      invisible: "Buyers are already asking AI who to call. Right now you are not the answer.",
      "not-sure": "Not sure means not found. Let us make you findable.",
      "never-ai": "Worth checking — that is where the next recommendation now happens.",
    },
    fallback: "That is where the next customer decides. Noted.",
  },

  // Q12 ai (single)
  ai: {
    byOption: {
      none: "Then there is a lot a system could lift off you, quietly, in the background.",
      "a-bit": "A start. The gap is where the hand-work still hides.",
      "few-tools": "Tools without a system just move the admin around.",
      "quite-a-lot": "Good. Then you will feel the missing pieces fast.",
      "not-sure-counts": "Fair. I will map what you have and what is still manual.",
    },
  },

  // Q13 relief (single)
  relief: {
    byOption: {
      "stop-missing": "Then we start at the front door — no enquiry gets past you.",
      "win-quotes": "Then we close the gap between sent and won first.",
      "get-reviews": "Then we turn every happy job into proof, automatically.",
      "bring-back": "Then we wake up the customers you already earned.",
      "kill-admin": "Then we take the hand-work off you first.",
      "show-up": "Then we make you the answer when people search.",
      "sage-decide": "Trust noted. I will start where the leak is biggest.",
    },
  },
};

// Severity order for choosing which selected multi-option Sage reacts to first.
const MULTI_PRIORITY = [
  "couldnt-reach", "through-me", "pile-up", // capacity
  "invisible", "not-sure", "never-ai", // visibility
  "not-sure", // sources
];

const OTHER = "__other__";

/** The line Sage says back for a given answer, or null to skip the beat. */
export function reactionFor(stepId: string, selection: string | string[]): string | null {
  const entry = REACTIONS[stepId];
  if (!entry) return null;

  if (Array.isArray(selection)) {
    const picked = selection.filter((v) => v !== OTHER);
    if (entry.byOption) {
      // React to the strongest signal the person selected.
      const ranked = [...picked].sort(
        (a, b) => (MULTI_PRIORITY.indexOf(a) + 1 || 99) - (MULTI_PRIORITY.indexOf(b) + 1 || 99),
      );
      for (const v of ranked) {
        if (entry.byOption[v]) return entry.byOption[v];
      }
    }
    return entry.fallback ?? null;
  }

  if (selection === OTHER) return entry.fallback ?? null;
  return entry.byOption?.[selection] ?? entry.fallback ?? null;
}

/** Q1 reaction: whether Sage confirmed the business from a live lookup or took it manually. */
export function reactionForLookup(manual: boolean): string {
  return manual
    ? "Noted. I will work from that name."
    : "Got you. I am already pulling what is public on you.";
}
