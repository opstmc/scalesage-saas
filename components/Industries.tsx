const SECTORS = [
  "Deeptech / Space / Robotics",
  "Local trades",
  "Real estate",
  "Restaurants",
  "B2B SaaS",
  "Healthcare",
  "Government & Defense",
];

export default function Industries() {
  return (
    <section id="industries" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Industries</div>
          <h2 className="h2">Depth where it counts.</h2>
          <p className="lead">We go deep on commercial MEP first — then bring that rigour everywhere else.</p>
        </div>

        <div data-reveal="" className="mep">
          <div>
            <div className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "color-mix(in srgb,var(--accent) 60%,#fff)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 20, padding: "5px 12px", marginBottom: 22 }}>
              Showcase · MEP
            </div>
            <h3 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(24px,3vw,32px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: "0 0 14px" }}>
              Commercial MEP contractors &amp; data-center buildout
            </h3>
            <p style={{ fontSize: 16.5, color: "rgba(255,255,255,.72)", margin: "0 0 24px", lineHeight: 1.55 }}>
              The work is world-class; the leak is everything around it — response speed, quoting throughput, and being invisible when a GC asks an AI engine for a partner. We fix all three.
            </p>
            <a href="#" className="mep-link">Read the MEP mini case →</a>
          </div>
          <div className="mep-aside">
            <div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 30, letterSpacing: "-.02em" }}>#1</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)" }}>our AI-search rank for core MEP buyer queries</div>
            </div>
            <div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 30, letterSpacing: "-.02em" }}>3 engines</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)" }}>verified across GPT, Claude &amp; Gemini</div>
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", fontStyle: "italic" }}>Illustrative founding-stage figures.</div>
          </div>
        </div>

        <div className="grid-4">
          {SECTORS.map((s) => (
            <div key={s} data-reveal="" className="ind-cell">{s}</div>
          ))}
          <div data-reveal="" className="ind-cell" style={{ background: "color-mix(in srgb,var(--accent) 6%,var(--surface))", border: "1px dashed color-mix(in srgb,var(--accent) 34%,var(--hairline))", color: "var(--accent)" }}>
            Your sector? Ask Sage →
          </div>
        </div>
      </div>
    </section>
  );
}
