const PAIRS = [
  { agency: "Sends you a contact form", us: "Runs the Catalyst Journey — a real walk-through" },
  { agency: "Books a sales call", us: "Shows a working demo before you commit" },
  { agency: "Sends a monthly report", us: "Frontier Intelligence — you own the systems" },
  { agency: "Single-model output, take it on trust", us: "Multi-model-verified, measurable results" },
];

export default function WhyNotAgency() {
  return (
    <section style={{ background: "var(--ink)", color: "#fff" }}>
      <div className="inner lg">
        <div data-reveal="" style={{ maxWidth: "48em", marginBottom: 44 }}>
          <div className="mono" style={{ fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: "color-mix(in srgb,var(--accent) 65%,#fff)", marginBottom: 16 }}>The difference</div>
          <h2 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(28px,3.6vw,44px)", lineHeight: 1.08, letterSpacing: "-.025em", margin: 0, textWrap: "balance" }}>
            Most agencies pitch features. We diagnose and deliver.
          </h2>
        </div>
        <div className="why-grid">
          {PAIRS.map((p, i) => [
            <div key={`a${i}`} data-reveal="" style={{ background: "var(--ink)", padding: "26px 30px" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 8 }}>A normal AI agency</div>
              <div style={{ fontSize: 16.5, color: "rgba(255,255,255,.72)" }}>{p.agency}</div>
            </div>,
            <div key={`s${i}`} data-reveal="" style={{ background: "#1c1d23", padding: "26px 30px" }}>
              <div style={{ fontSize: 13, color: "color-mix(in srgb,var(--accent) 65%,#fff)", marginBottom: 8 }}>ScaleSage</div>
              <div style={{ fontSize: 16.5, color: "#fff", fontWeight: 500 }}>{p.us}</div>
            </div>,
          ])}
        </div>
      </div>
    </section>
  );
}
