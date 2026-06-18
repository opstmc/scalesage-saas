const LEAKS = [
  { title: "Missed calls", line: "Every unanswered call is a customer dialing the next business.", stat: "30–60% of inbound calls go unanswered · 75% leave no voicemail [D]" },
  { title: "Cold quotes", line: "Quotes sent and forgotten. No follow-up, no second chance.", stat: "The deal goes cold while you're on the next job [D]" },
  { title: "Forgotten reviews", line: "Every happy customer is a 5-star review you didn't ask for.", stat: "Most businesses ask for none [D]" },
  { title: "Lapsed customers", line: "Bought once, never came back — sitting in your database.", stat: "Worth more than every cold prospect combined [D]" },
  { title: "Invisible online", line: "Customers ask ChatGPT, Google and Perplexity — and you don't come up.", stat: "AI search is where the next recommendation happens [D]" },
  { title: "Admin drag", line: "Quoting, invoicing, chasing — hours AI does in minutes.", stat: "Time your team should be spending earning [D]" },
];

export default function Leaking() {
  return (
    <section id="leaking" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">What&rsquo;s leaking?</div>
          <h2 className="h2">Six places revenue slips out — quietly.</h2>
          <p className="lead">This is where most growing businesses see themselves. Every leak has a number; we find it, then we close it.</p>
        </div>
        <div className="leak-grid">
          {LEAKS.map((l) => (
            <div key={l.title} data-reveal="" className="glass glass-hover leak-card">
              <h3 className="h3 teal-underline" style={{ fontSize: 20 }}>{l.title}</h3>
              <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.55 }}>{l.line}</p>
              <p className="leak-stat">{l.stat}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
