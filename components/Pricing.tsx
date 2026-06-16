import JourneyButton from "./JourneyButton";

function Row({ label, price, last }: { label: string; price: string; last?: boolean }) {
  return (
    <div className={`price-row${last ? "" : " div"}`}>
      <span style={{ fontSize: 15, color: "var(--ink-soft)" }}>{label}</span>
      <span className="font-display" style={{ fontWeight: 600, fontSize: 20 }}>
        {price}
        <span style={{ fontSize: 13, color: "var(--ink-faint)", fontWeight: 400 }}>/mo</span>
      </span>
    </div>
  );
}

function LockNote({ accent }: { accent?: boolean }) {
  const color = accent ? "var(--accent)" : "var(--ink-faint)";
  return (
    <div
      style={{
        marginTop: accent ? 22 : 22,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color,
        background: accent ? "color-mix(in srgb,var(--accent) 6%,transparent)" : "color-mix(in srgb,var(--ink) 3%,transparent)",
        border: accent ? "1px solid color-mix(in srgb,var(--accent) 28%,transparent)" : "1px solid var(--hairline)",
        borderRadius: 9,
        padding: "11px 13px",
      }}
    >
      <span style={{ display: "inline-block", width: 11, height: 9, border: `1.5px solid ${color}`, borderBottom: "none", borderRadius: "3px 3px 0 0", position: "relative", top: 2 }} />
      Scope &amp; inclusions unlock with your diagnostic
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="" style={{ marginBottom: 14 }}>
          <div className="eyebrow">Pricing</div>
          <h2 className="h2">Public tiers. Exact scope set by your diagnostic.</h2>
          <p className="lead">Confident transparency: here’s the structure. Your precise build — and your quote — is unlocked by the Catalyst Diagnostic.</p>
        </div>

        <div className="grid-3-tight" style={{ marginTop: 36 }}>
          {/* Local */}
          <div data-reveal="" className="price-card">
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>Local</div>
            <p style={{ fontSize: 14, color: "var(--ink-faint)", margin: "0 0 22px" }}>For local &amp; trades businesses.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="Starter" price="£297" />
              <Row label="Growth" price="£597" />
              <Row label="Scale" price="£997" last />
            </div>
            <LockNote />
          </div>

          {/* Business (featured) */}
          <div data-reveal="" className="price-card featured">
            <span style={{ position: "absolute", top: -11, left: 32, background: "var(--accent)", color: "#fff", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", borderRadius: 20, padding: "4px 11px" }}>Most common</span>
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>Business</div>
            <p style={{ fontSize: 14, color: "var(--ink-faint)", margin: "0 0 22px" }}>For growing SMBs scaling ops.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="Starter" price="£997" />
              <Row label="Growth" price="£1,997" />
              <Row label="Scale" price="£2,997" last />
            </div>
            <LockNote accent />
          </div>

          {/* Enterprise */}
          <div data-reveal="" className="price-card">
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>Enterprise</div>
            <p style={{ fontSize: 14, color: "var(--ink-faint)", margin: "0 0 22px" }}>For complex, multi-system orgs.</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
              <span className="font-display" style={{ fontWeight: 600, fontSize: 32, letterSpacing: "-.02em" }}>£9,997</span>
              <span style={{ fontSize: 14, color: "var(--ink-faint)" }}>/mo+</span>
            </div>
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 22px", lineHeight: 1.5 }}>Custom systems, governance and a dedicated specialist track. Scope set with you directly.</p>
            <div style={{ marginTop: 8 }}>
              <LockNote />
            </div>
          </div>
        </div>

        <div data-reveal="" style={{ marginTop: 18, background: "var(--ink)", color: "#fff", borderRadius: 16, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="font-display" style={{ fontWeight: 600, fontSize: 19, marginBottom: 6 }}>Catalyst Diagnostic — the way in</div>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.72)", margin: 0 }}>
              Local Health Check <span style={{ color: "#fff", fontWeight: 600 }}>£150</span> · ScaleSage Diagnostic <span style={{ color: "#fff", fontWeight: 600 }}>£750</span> — credited in full against your first retainer if you sign within 60 days. You keep the report either way.
            </p>
          </div>
          <JourneyButton className="btn btn-light btn-md">Unlock your quote →</JourneyButton>
        </div>
      </div>
    </section>
  );
}
