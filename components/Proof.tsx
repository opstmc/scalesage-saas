const CASES = [
  { industry: "Trades", fixing: "Missed-call recovery + review engine", stage: "90-day proof cycle running" },
  { industry: "Property", fixing: "Lead response + sequenced follow-up", stage: "Baseline measured" },
  { industry: "Hospitality", fixing: "Reactivation + review systems", stage: "Installing" },
];

export default function Proof() {
  return (
    <section id="proof" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Proof</div>
          <h2 className="h2">Founding client programme — open now.</h2>
          <p className="lead">
            We&rsquo;re a founding-stage team taking on our first cohort. The first three case studies are running their 90-day proof cycles — published results from Q3 2026. The discipline is the same one we put on every client: baseline measured, intervention installed, results tracked, ROI proven.
          </p>
        </div>
        <div className="grid-3">
          {CASES.map((c, i) => (
            <div key={c.industry} data-reveal="" className="glass glass-hover" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="eyebrow" style={{ margin: 0, fontSize: 11 }}>Case 0{i + 1}</span>
                <span style={{ fontSize: 12, color: "var(--text-faint)", border: "1px solid var(--border-hair)", borderRadius: 16, padding: "3px 10px" }}>{c.industry}</span>
              </div>
              <h3 className="h3" style={{ fontSize: 19, marginBottom: 14 }}>{c.fixing}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--accent-primary)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-primary)", boxShadow: "0 0 8px var(--accent-primary)" }} />
                {c.stage}
              </div>
              <p className="small" style={{ marginTop: 16, color: "var(--text-faint)" }}>Real numbers replace this card when the cycle completes.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
