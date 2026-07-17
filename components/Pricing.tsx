import JourneyButton from "./JourneyButton";

interface Tier {
  name: string;
  price: string;
  best: string;
  includes: string[];
  sub: string;
  badge?: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "£597",
    best: "Best for: one acute leak to fix",
    includes: ["One core service installed", "Monthly ROI report", "Founder-led onboarding"],
    sub: "For businesses ready to plug their biggest leak.",
  },
  {
    name: "Pro",
    price: "£1,497",
    best: "Best for: a multi-service operating system",
    includes: ["2–3 services installed", "Full Catalyst diagnostic", "Monthly ROI proof report", "Quarterly strategy review", "Priority support"],
    sub: "For businesses ready to operate at a different level.",
    badge: "Most popular",
    featured: true,
  },
  {
    name: "Max",
    price: "£4,997",
    best: "Best for: full operational transformation",
    includes: ["Full service stack", "Dedicated EA hours", "Custom AI builds", "Weekly proof reporting", "Executive strategy partnership"],
    sub: "For businesses ready to compound.",
  },
];

function Check() {
  return (
    <span style={{ color: "var(--accent-primary)", flex: "none", marginTop: 1, fontWeight: 700 }} aria-hidden="true">✓</span>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Pricing</div>
          <h2 className="h2">Three tiers. Every one accountable to a number.</h2>
          <p className="lead">Public, monthly, no surprises. Not sure which? The diagnostic decides, it shows what your leak is worth and what to fix first.</p>
        </div>

        <div className="grid-3" style={{ alignItems: "stretch" }}>
          {TIERS.map((t) => (
            <div key={t.name} data-reveal="" className={`glass glass-hover price-card${t.featured ? " featured" : ""}`}>
              {t.badge && (
                <span style={{ position: "absolute", top: -12, left: 28, background: "var(--accent-primary)", color: "var(--on-accent)", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 20, padding: "5px 12px" }}>{t.badge}</span>
              )}
              <div style={{ fontWeight: 600, fontSize: 22, color: "var(--text-headline)" }}>{t.name}</div>
              <div className="small" style={{ margin: "4px 0 18px", color: "var(--text-faint)" }}>{t.best}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
                <span className="price-amount">{t.price}</span>
                <span style={{ fontSize: 15, color: "var(--text-muted)" }}>/mo</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 24, flex: 1 }}>
                {t.includes.map((inc) => (
                  <div key={inc} style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                    <Check />
                    {inc}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.5 }}>{t.sub}</p>
              <JourneyButton className={`btn btn-${t.featured ? "primary" : "secondary"} btn-md`}>
                Run the Catalyst diagnostic
              </JourneyButton>
            </div>
          ))}
        </div>

        <div data-reveal="" className="glass" style={{ marginTop: 20, padding: "26px 30px" }}>
          {/* Ownership line (brief 8.6), verbatim */}
          <p style={{ margin: "0 0 12px", fontSize: 16, color: "var(--text-headline)", fontWeight: 500, lineHeight: 1.5 }}>
            Everything we build for you becomes yours on full payment.
          </p>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            All tiers include the Catalyst diagnostic, the compliance guarantee, and the 90-day ROI proof commitment. Bespoke builds and short-timeline custom work are quoted separately. Book a diagnostic to scope.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 18 }}>
            <span style={{ fontSize: 15, color: "var(--text-headline)", fontWeight: 500 }}>Not sure which tier?</span>
            <JourneyButton className="btn btn-ghost btn-md">Run the Catalyst diagnostic →</JourneyButton>
          </div>
        </div>
      </div>
    </section>
  );
}
