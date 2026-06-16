import JourneyButton from "./JourneyButton";

const TIERS = [
  { name: "Local Health Check", price: "£150" },
  { name: "ScaleSage Diagnostic", price: "£750" },
];

const POINTS = [
  "5–8 branching questions — tap, type, slide",
  "Smart tier match — Local, Business or Enterprise",
  "We don’t sell or train external AI on your data",
];

export default function CatalystEntry() {
  return (
    <section className="section">
      <div className="inner lg">
        <div data-reveal="" className="catalyst">
          <div style={{ padding: 48 }}>
            <div className="mono" style={{ fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>The Catalyst Diagnostic</div>
            <h2 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(28px,3.6vw,40px)", lineHeight: 1.08, letterSpacing: "-.025em", margin: "0 0 16px", textWrap: "balance" }}>
              Every other team runs a form. We run an experience.
            </h2>
            <p style={{ fontSize: 17.5, color: "var(--ink-soft)", margin: "0 0 28px", lineHeight: 1.55 }}>
              Click below and you don’t get a calendar — you meet Sage. A short conversation that already feels like working with us, and ends with a snapshot of what we see leaking in your business.
            </p>
            <JourneyButton className="btn btn-accent btn-md">Start the Catalyst Journey →</JourneyButton>
            <div style={{ marginTop: 30, display: "flex", gap: 28, flexWrap: "wrap" }}>
              {TIERS.map((t) => (
                <div key={t.name}>
                  <div className="font-display" style={{ fontWeight: 600, fontSize: 22 }}>{t.name}</div>
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 2 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>{t.price}</span> · credited if you sign in 60 days
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-faint)", margin: "20px 0 0" }}>You keep the report either way. No login, no payment to begin.</p>
          </div>
          <div className="catalyst-aside">
            <div className="mono" style={{ fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)" }}>It’s a data asset</div>
            <p style={{ fontSize: 16, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>
              Every journey emits structured intelligence — sector, scale, pain, AI maturity, decision stage — that pre-fills your diagnostic. Transparent by design, never hidden.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
              {POINTS.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: "var(--ink-soft)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flex: "none" }} />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
