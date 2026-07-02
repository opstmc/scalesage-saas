import JourneyButton from "./JourneyButton";

function ScanBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 92, fontSize: 12.5, color: "var(--text-muted)", flex: "none" }}>{label}</span>
      <span style={{ flex: 1, height: 6, borderRadius: 4, background: "rgba(244,246,249,.06)", overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: 4, background: "linear-gradient(90deg,var(--accent-deep),var(--accent-glow))" }} />
      </span>
    </div>
  );
}

function CatalystPreview() {
  return (
    <div className="glass" style={{ padding: 0, overflow: "hidden" }} aria-hidden="true">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border-hair)" }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="diamond" style={{ width: 9, height: 9, background: "var(--on-accent)", borderRadius: 2 }} />
        </span>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-headline)" }}>Sage</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--accent-primary)" }}>
          scanning
          <span style={{ display: "inline-flex", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", animation: "ssDot 1.2s infinite" }} />
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", animation: "ssDot 1.2s infinite .2s" }} />
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", animation: "ssDot 1.2s infinite .4s" }} />
          </span>
        </span>
      </div>

      <div style={{ padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: "color-mix(in srgb,var(--text-primary) 5%,transparent)", border: "1px solid var(--border-hair)", borderRadius: "4px 13px 13px 13px", padding: "11px 14px", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
          Tell me what you do and where it hurts — I&rsquo;ll show you the leak.
        </div>
        <div style={{ alignSelf: "flex-end", background: "var(--accent-primary)", color: "var(--on-accent)", borderRadius: "13px 13px 4px 13px", padding: "10px 14px", fontSize: 14, fontWeight: 500 }}>
          Plumbing · missed calls
        </div>
      </div>

      <div style={{ position: "relative", overflow: "hidden", margin: "8px 18px 18px", padding: 16, borderRadius: 12, background: "rgba(10,22,40,.5)", border: "1px solid var(--border-subtle)" }}>
        <span className="scanline" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span className="eyebrow" style={{ margin: 0, fontSize: 10.5 }}>Leak map</span>
          <span style={{ fontSize: 10.5, color: "var(--text-faint)" }}>Illustrative scan output</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <ScanBar label="Missed calls" pct={82} />
          <ScanBar label="Quote chase" pct={58} />
          <ScanBar label="AI visibility" pct={71} />
          <ScanBar label="Reviews" pct={44} />
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-hair)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Fix first: <span className="accent" style={{ fontWeight: 600 }}>Voice AI</span></span>
          <span style={{ fontSize: 12, color: "var(--accent-primary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "3px 10px" }}>Tier match · Pro</span>
        </div>
      </div>
    </div>
  );
}

export default function CatalystEntry() {
  return (
    <section id="catalyst" className="section">
      <div className="inner">
        <div className="grid-2" style={{ alignItems: "center", gap: 48 }}>
          <div data-reveal="">
            <div className="eyebrow">The Catalyst diagnostic</div>
            <h2 className="h1" style={{ marginBottom: 18 }}>
              This isn&rsquo;t a form. It&rsquo;s a <span className="accent-em">scan</span>.
            </h2>
            <p className="lead" style={{ marginBottom: 28 }}>
              Sage — our diagnostic intelligence — already knows your industry. Tell us your business, and within minutes you&rsquo;ll see exactly where you&rsquo;re leaking revenue, what to fix first, and what the recovery looks like in numbers.
            </p>
            <JourneyButton className="btn btn-primary btn-lg">Start the Catalyst diagnostic</JourneyButton>
            <p className="small" style={{ marginTop: 18, color: "var(--text-faint)" }}>
              No payment to begin · about 60 seconds · you keep the leak report either way.
            </p>
          </div>
          <div data-reveal="">
            <CatalystPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
