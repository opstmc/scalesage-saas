const PROOFS = [
  { n: "01", title: "MEP Visibility Index", body: "Our quarterly study of which firms AI engines actually recommend — and how we move the needle." },
  { n: "02", title: "Live working demos", body: "The Catalyst Journey and Sage on this page are real, shipped systems — not mockups. You’re using them now." },
  { n: "03", title: "AEO on our own site", body: "We rank ourselves for our own buyer queries across AI engines. We sell visibility because we earned ours." },
];

export default function Proof() {
  return (
    <section id="proof" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Proof</div>
          <h2 className="h2">We’re founding-stage. So we prove it on ourselves.</h2>
          <p className="lead">No invented testimonials. We’re Customer Zero — every service runs on our own business first.</p>
        </div>
        <div className="grid-3-tight">
          {PROOFS.map((p) => (
            <div key={p.n} data-reveal="" className="card" style={{ padding: 30 }}>
              <div className="mono" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 16 }}>SELF-PROOF {p.n}</div>
              <h3 className="font-display" style={{ fontWeight: 600, fontSize: 19, margin: "0 0 10px", letterSpacing: "-.01em" }}>{p.title}</h3>
              <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
