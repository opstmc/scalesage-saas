const STEPS = [
  { n: "01", title: "Diagnose", body: "Before any call, our agents have already studied your site, your reviews and your competitor stack — and built a working demo of the highest-leverage fixes." },
  { n: "02", title: "Build", body: "Custom AI systems and agents, built for your business and owned by you. No templates, no lock-in — the real thing, working." },
  { n: "03", title: "Prove", body: "Measurable KPIs and monthly dashboards. You see exactly what changed and what it earned. Numbers don’t lie." },
];

export default function Framework() {
  return (
    <section id="framework" className="inner">
      <div className="section-head" data-reveal="">
        <div className="eyebrow">How it works</div>
        <h2 className="h2">Diagnose. Build. Prove.</h2>
        <p className="lead">We don’t pitch. We diagnose like a doctor, build what the diagnosis demands, and prove it with numbers.</p>
      </div>
      <div className="grid-3">
        {STEPS.map((s) => (
          <div key={s.n} data-reveal="" className="card card-lift" style={{ padding: 32 }}>
            <div className="mono" style={{ fontSize: 13, color: "var(--accent)", marginBottom: 20 }}>{s.n}</div>
            <h3 className="font-display" style={{ fontWeight: 600, fontSize: 22, letterSpacing: "-.01em", margin: "0 0 12px" }}>{s.title}</h3>
            <p style={{ fontSize: 15.5, color: "var(--ink-soft)", margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
