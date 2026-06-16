const SERVICES = [
  { n: "01", title: "Custom AI Agents", body: "Agents that answer, qualify and book — built for your business, owned by you.", hook: "Hook · never miss another lead" },
  { n: "02", title: "Automation builds", body: "n8n, Make or custom — the repetitive work runs itself, end to end.", hook: "Hook · hours back, every week" },
  { n: "03", title: "Revenue Recovery OS", body: "Capture, follow-up and reactivation as one system — plugging every leak at once.", hook: "Hook · recovered revenue, measured" },
  { n: "04", title: "Search & AI Visibility", body: "AEO, GEO, LLMO and SEO — so you’re the answer across Google and AI engines.", hook: "Hook · be the recommended name" },
  { n: "05", title: "Frontier Intelligence", body: "Market intelligence and working demos — we show you the fix before you commit.", hook: "Hook · proof, not promises" },
  { n: "06", title: "Trades Talent Engine", body: "Attract, screen and book skilled labour with agents tuned for the trades.", hook: "Hook · roles filled faster" },
  { n: "07", title: "AI Ops & Governance", body: "Multi-model verification, guardrails and oversight — AI you can trust in production.", hook: "Hook · reliable, auditable, owned" },
];

export default function Fixes() {
  return (
    <section id="fixes" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">What ScaleSage fixes</div>
          <h2 className="h2">The service surface.</h2>
          <p className="lead">Seven systems, each built for an outcome — and each carrying a number you can hold us to.</p>
        </div>
        <div className="grid-3-tight">
          {SERVICES.map((s) => (
            <a key={s.n} href="#" data-reveal="" className="card card-link" style={{ padding: 28 }}>
              <div className="mono" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 18 }}>{s.n}</div>
              <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18.5, margin: "0 0 8px", letterSpacing: "-.01em" }}>{s.title}</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>{s.body}</p>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{s.hook}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
