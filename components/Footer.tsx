// Where partners log in to grab their referral link + see earnings. Set
// NEXT_PUBLIC_PORTAL_URL (e.g. https://dash.scalesage.ai) to point at the portal.
const PARTNER_PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL
  ? `${process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/+$/, "")}/portal/login`
  : "#contact";

const COLS = [
  {
    title: "Explore",
    links: [
      { href: "#how", label: "How it works" },
      { href: "#pricing", label: "Pricing" },
      { href: "#industries", label: "Industries" },
      { href: "#catalyst", label: "Catalyst diagnostic" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#why", label: "About" },
      { href: PARTNER_PORTAL, label: "Partners" },
      { href: "#contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span className="diamond" style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent-primary)" }} />
              <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-.02em", color: "var(--text-headline)" }}>ScaleSage</span>
            </div>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, maxWidth: "30em", lineHeight: 1.6 }}>
              The business doctor for growing SMEs. We diagnose the leak, build the systems that close it, and prove the result in numbers.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="eyebrow" style={{ color: "var(--text-faint)", marginBottom: 16 }}>{c.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {c.links.map((l) => (
                  <a key={l.label} href={l.href} className="footer-link">{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border-hair)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, color: "var(--text-faint)" }}>© 2026 ScaleSage. UK-registered · GDPR-compliant by design.</span>
          <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Founding client programme — open now.</span>
        </div>
      </div>
    </footer>
  );
}
