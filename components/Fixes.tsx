const GROUPS = [
  { title: "Capture every enquiry", body: "Voice AI, missed-call recovery, instant SMS response, after-hours coverage.", closes: "Closes: missed calls" },
  { title: "Convert every quote", body: "Sequenced follow-up, objection handling, win-back, WhatsApp escalation.", closes: "Closes: cold quotes" },
  { title: "Bring back every customer", body: "Database reactivation, retention systems, service reminders.", closes: "Closes: lapsed customers" },
  { title: "Be findable everywhere", body: "AEO/GEO visibility for ChatGPT, Claude, Perplexity and Google, review systems, Google Business optimisation.", closes: "Closes: invisible online" },
  { title: "Run without you", body: "Operations automation, scheduling, invoicing, reporting.", closes: "Closes: admin drag" },
];

export default function Fixes() {
  return (
    <section id="fixes" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">What ScaleSage fixes</div>
          <h2 className="h2">Five systems. Every one closes a leak.</h2>
          <p className="lead">Not a list of 19 tools — outcomes, framed by the leak they close. Whatever the diagnostic finds, this is what we install.</p>
        </div>
        <div className="grid-3">
          {GROUPS.map((g) => (
            <div key={g.title} data-reveal="" className="glass glass-hover" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
              <h3 className="h3 teal-underline" style={{ fontSize: 20, marginBottom: 10 }}>{g.title}</h3>
              <p style={{ fontSize: 14.5, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.55, flex: 1 }}>{g.body}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--accent-primary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "4px 11px" }}>{g.closes}</span>
                <a href="#" style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none", whiteSpace: "nowrap" }}>Learn more →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
