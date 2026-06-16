const EXPLORE = [
  { href: "#framework", label: "How it works" },
  { href: "#fixes", label: "What we fix" },
  { href: "#industries", label: "Industries" },
  { href: "#pricing", label: "Pricing" },
  { href: "#proof", label: "Proof" },
];

const LEGAL = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Cookies" },
  { href: "#", label: "Terms" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span className="diamond" style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
              <span className="font-display" style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-.02em" }}>ScaleSage</span>
            </div>
            <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: 0, maxWidth: "30em" }}>
              AI &amp; automation specialists. We diagnose, build systems you own, and prove the results — premium expertise, made accessible.
            </p>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 16 }}>Explore</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {EXPLORE.map((l) => (
                <a key={l.label} href={l.href} className="footer-link">{l.label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 16 }}>Legal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {LEGAL.map((l) => (
                <a key={l.label} href={l.href} className="footer-link">{l.label}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>© TMC. ScaleSage is a specialist team — not an agency.</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)" }}>Customer Zero · built &amp; proven on ourselves</span>
        </div>
      </div>
    </footer>
  );
}
