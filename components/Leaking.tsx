const LEAKS = [
  { n: "01", title: "Missed calls", dim: "Up to a third of inbound calls go unanswered. ", bright: "Recover them with an AI receptionist that books while you work." },
  { n: "02", title: "Slow lead response", dim: "Leads go cold in minutes. ", bright: "Instant AI follow-up keeps every enquiry warm until it converts." },
  { n: "03", title: "No follow-up", dim: "Most quotes are never chased. ", bright: "Automated sequences recover the ones you’d otherwise lose." },
  { n: "04", title: "Invisible in AI search", dim: "Buyers ask ChatGPT, not just Google. ", bright: "If you’re not in the answer, you’re not in the running." },
  { n: "05", title: "CRM chaos", dim: "Data scattered across inboxes and spreadsheets. ", bright: "One source of truth, kept clean by agents." },
  { n: "06", title: "Manual quoting & admin", dim: "Hours lost every week. ", bright: "Automate the repetitive work; keep your people on the billable." },
];

export default function Leaking() {
  return (
    <section id="leaking" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">What’s leaking?</div>
          <h2 className="h2">Revenue rarely disappears. It leaks.</h2>
          <p className="lead">Six places it slips out of most businesses — and the upside waiting on the other side of each.</p>
        </div>
        <div className="leak-grid">
          {LEAKS.map((l) => (
            <div key={l.n} data-reveal="" className="leak-cell">
              <div className="mono" style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 14 }}>LEAK {l.n}</div>
              <h3 className="font-display" style={{ fontWeight: 600, fontSize: 19, margin: "0 0 10px", letterSpacing: "-.01em" }}>{l.title}</h3>
              <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: 0 }}>
                {l.dim}
                <span style={{ color: "var(--ink)" }}>{l.bright}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
