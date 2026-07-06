/**
 * Four proof cards (brief §4) — the three leak registers (money, time,
 * visibility) plus the fix-first discipline. Server component: static content,
 * revealed on scroll via the global [data-reveal] observer.
 */

// Copy: JW to approve.
const CARDS = [
  {
    label: "Money leak",
    title: "Revenue is leaving quietly.",
    body: "Missed calls, cold quotes, unclaimed reviews, lapsed customers. Every gap in capture and follow-up is money walking out while you are busy delivering.",
  },
  {
    label: "Time leak",
    title: "You are the system.",
    body: "Quoting, chasing, scheduling, reminding. The business runs on your hours, so growth stalls the moment your attention runs out.",
  },
  {
    label: "Visibility leak",
    title: "Invisible where buyers now look.",
    body: "Customers ask ChatGPT, Google and Perplexity who to use. If you are not the answer, the lead never even reaches you.",
  },
  {
    label: "Fix first",
    title: "We close the biggest leak first.",
    body: "No twenty tool rollout. We fix the leak that costs you most, prove the recovery in numbers, then move to the next one.",
  },
];

export default function ProofCards() {
  return (
    <section className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Why it matters</div>
          <h2 className="h2">Where the money and the hours go.</h2>
          <p className="lead">
            Most growing businesses leak in the same four places. We put a number on
            each, then fix the one that costs you most.
          </p>
        </div>
        <div className="grid-2">
          {CARDS.map((c) => (
            <div
              key={c.label}
              data-reveal=""
              className="glass glass-hover"
              style={{ padding: 32, display: "flex", flexDirection: "column" }}
            >
              <div
                className="eyebrow"
                style={{ margin: 0, color: "var(--text-faint)" }}
              >
                {c.label}
              </div>
              <h3
                className="h3 teal-underline"
                style={{ margin: "12px 0 0" }}
              >
                {c.title}
              </h3>
              <p
                style={{
                  fontSize: 15.5,
                  color: "var(--text-muted)",
                  margin: "12px 0 0",
                  lineHeight: 1.6,
                }}
              >
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
