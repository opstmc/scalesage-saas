const POINTS = [
  { head: "We don't sell tools. We diagnose leaks.", body: "Most AI agencies hand you a chatbot and leave. We find what's actually costing you money — then fix it." },
  { head: "We don't promise outcomes. We prove them.", body: "Every claim on this site carries a confidence tag. Every client report carries baselines and numbers. No vibes." },
  { head: "We don't disappear after install.", body: "Monitoring is part of delivery. If a system stops moving the number, we know first — and we fix it before you ask." },
];

export default function WhyNotAgency() {
  return (
    <section id="why" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">The difference</div>
          <h2 className="h2">Why ScaleSage isn&rsquo;t a normal AI agency.</h2>
        </div>
        <div className="grid-3">
          {POINTS.map((p) => (
            <div key={p.head} data-reveal="" style={{ borderTop: "2px solid var(--accent-primary)", paddingTop: 24 }}>
              <h3 className="h3" style={{ fontSize: 22, marginBottom: 14 }}>{p.head}</h3>
              <p style={{ fontSize: 16, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
