function DiagnoseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="4" y1="11" x2="18" y2="11" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" strokeWidth="2" />
    </svg>
  );
}
function BuildIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="15" y="3" width="8" height="8" rx="1.5" />
      <rect x="9" y="15" width="8" height="8" rx="1.5" />
      <line x1="11" y1="7" x2="15" y2="7" />
      <line x1="13" y1="11" x2="13" y2="15" />
    </svg>
  );
}
function ProveIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="15" width="5" height="8" rx="1" />
      <rect x="10.5" y="9" width="5" height="14" rx="1" />
      <rect x="18" y="4" width="5" height="19" rx="1" />
    </svg>
  );
}

const CARDS = [
  { n: "01", title: "Diagnose", Icon: DiagnoseIcon, body: "We don't sell tools. We diagnose the leak. The Catalyst diagnostic scans your missed calls, your follow-up speed, your visibility on Google and AI search, your retention curve and your operations drag — and shows you exactly where revenue is leaving the building." },
  { n: "02", title: "Build", Icon: BuildIcon, body: "We install the operating system that fixes what we found. Voice AI for missed calls. Sequenced follow-up for cold quotes. Review systems. Reactivation campaigns. AEO visibility. Whatever the leak demands — built into your business, not bolted on." },
  { n: "03", title: "Prove", Icon: ProveIcon, body: "Every system has a number against it. Baseline measured at install. Improvement tracked weekly. ROI proof report every 90 days. We guarantee implementation. We target performance. We report both honestly." },
];

export default function Framework() {
  return (
    <section id="how" className="inner">
      <div className="section-head" data-reveal="">
        <div className="eyebrow">The method</div>
        <h2 className="h2">Diagnose. Build. Prove.</h2>
        <p className="lead">An actual process, not guesswork. Three phases, every one accountable to a number.</p>
      </div>
      <div className="grid-3">
        {CARDS.map(({ n, title, Icon, body }) => (
          <div key={n} data-reveal="" className="glass glass-hover" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <span style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb,var(--accent-primary) 10%,transparent)", border: "1px solid var(--border-subtle)" }}>
                <Icon />
              </span>
              <span className="eyebrow" style={{ margin: 0, color: "var(--text-faint)" }}>{n}</span>
            </div>
            <h3 className="h3 teal-underline" style={{ marginBottom: 12 }}>{title}</h3>
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
