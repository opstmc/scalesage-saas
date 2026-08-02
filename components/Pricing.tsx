import JourneyButton from "./JourneyButton";
import { TIERS, GUARANTEE_NAME, VAT_NOTE, type Tier } from "@/lib/offer";

/* Every figure on this page comes from lib/offer.ts, which mirrors Offer Book
 * v1.7. Nothing is retyped into this component: if a price is wrong here, it is
 * wrong in one place and fixed in one place. */

function Check() {
  return (
    <span
      style={{ color: "var(--accent-primary)", flex: "none", marginTop: 1, fontWeight: 700 }}
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

function TierCard({ t }: { t: Tier }) {
  return (
    <div
      data-reveal=""
      className={`glass glass-hover price-card${t.featured ? " featured" : ""}`}
    >
      {t.badge && (
        <span
          style={{
            position: "absolute",
            top: -12,
            left: 28,
            background: "var(--accent-primary)",
            color: "var(--on-accent)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            borderRadius: 20,
            padding: "5px 12px",
          }}
        >
          {t.badge}
        </span>
      )}
      {t.waitlist && (
        <span
          style={{
            position: "absolute",
            top: -12,
            left: 28,
            background: "var(--bg-elevated)",
            color: "var(--text-headline)",
            border: "1px solid var(--border-subtle)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            borderRadius: 20,
            padding: "5px 12px",
          }}
        >
          Waitlist
        </span>
      )}

      <div style={{ fontWeight: 600, fontSize: 22, color: "var(--text-headline)" }}>{t.name}</div>
      <div className="small" style={{ margin: "4px 0 18px", color: "var(--text-faint)" }}>
        {t.best}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <span className="price-amount">{t.price}</span>
        <span style={{ fontSize: 15, color: "var(--text-muted)" }}>/mo</span>
      </div>
      {/* Setup fees are shown on every card. A fee a buyer meets at checkout but
          not on the pricing page is the kind of surprise this brand does not do. */}
      <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20 }}>
        plus {t.setup}
      </div>

      {t.waitlist && t.waitlistNote && (
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            lineHeight: 1.55,
            margin: "0 0 20px",
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-hair)",
          }}
        >
          {t.waitlistNote}
        </p>
      )}

      <p
        style={{
          fontSize: 14.5,
          color: "var(--text-primary)",
          lineHeight: 1.55,
          margin: "0 0 20px",
        }}
      >
        {t.meaning}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 24, flex: 1 }}>
        {t.includes.map((inc) => (
          <div
            key={inc}
            style={{
              display: "flex",
              gap: 10,
              fontSize: 14.5,
              color: "var(--text-primary)",
              lineHeight: 1.45,
            }}
          >
            <Check />
            {inc}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--text-primary)", lineHeight: 1.45 }}>
          <Check />
          The ScaleSage {GUARANTEE_NAME}.
        </div>
      </div>

      {/* Founding cohort: a true cap, stated with its real terms including the
          minimum term. No countdown, no "places going fast". When it is full we
          will say it is closed, because that will be a fact. */}
      {t.founding && (
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            lineHeight: 1.55,
            margin: "0 0 20px",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <strong style={{ color: "var(--text-headline)" }}>
            Founding: {t.founding.monthly}/mo, {t.founding.setup} setup.
          </strong>{" "}
          {t.founding.note}
        </div>
      )}

      <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.5 }}>
        {t.sub}
      </p>

      {t.upgradeNote && (
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            margin: "0 0 16px",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {t.upgradeNote}
        </p>
      )}

      <JourneyButton className={`btn btn-${t.featured ? "primary" : "secondary"} btn-md`}>
        {t.waitlist ? "Run the Catalyst to join the waitlist" : "Run the Catalyst diagnostic"}
      </JourneyButton>
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Pricing</div>
          <h1 className="h2">Three tiers. Every one accountable to a number.</h1>
          <p className="lead">
            Public, monthly, no surprises. Not sure which? The diagnostic decides, it shows what
            your leak is worth and what to fix first.
          </p>
        </div>

        <div className="grid-3" style={{ alignItems: "stretch" }}>
          {TIERS.map((t) => (
            <TierCard key={t.key} t={t} />
          ))}
        </div>

        <div data-reveal="" className="glass" style={{ marginTop: 20, padding: "26px 30px" }}>
          {/* Ownership line (brief 8.6), verbatim */}
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 16,
              color: "var(--text-headline)",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            Everything we build for you becomes yours on full payment.
          </p>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Every tier includes the Catalyst diagnostic, the {GUARANTEE_NAME}, and a monthly ROI
            report measured against the baseline we capture before anything goes live. AI builds
            are included at every tier per your plan quota; bespoke and short-timeline work is
            scoped and quoted separately. {VAT_NOTE}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <span style={{ fontSize: 15, color: "var(--text-headline)", fontWeight: 500 }}>
              Not sure which tier?
            </span>
            <JourneyButton className="btn btn-ghost btn-md">
              Run the Catalyst diagnostic →
            </JourneyButton>
          </div>
        </div>
      </div>
    </section>
  );
}
