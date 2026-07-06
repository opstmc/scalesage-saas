import Link from "next/link";
import DataStreamField from "./DataStreamField";
import HeroSignals from "./HeroSignals";

export default function Hero({ background }: { background?: React.ReactNode }) {
  return (
    <section className="hero">
      {background ?? <DataStreamField />}
      <div className="hero-vignette" />
      <div className="hero-fade" />
      <div className="hero-content">
        <div data-reveal="">
          <div className="eyebrow">Diagnose. Build. Prove.</div>
          <h1 className="display hero-headline">
            <span>Your business</span>
            <span>is <span className="accent-em">leaking</span>.</span>
            <span>Your time is trapped</span>
            <span>inside the work.</span>
          </h1>
          <p className="lead" style={{ marginTop: 22, maxWidth: "34em", fontSize: 19 }}>
            ScaleSage finds where money, leads, reviews, visibility, and hours are slipping out, then builds the systems that close the leaks and give the operating load back.
          </p>
          <div className="hero-cta">
            <Link href="/catalyst" className="btn btn-primary btn-lg">Run the Catalyst scan</Link>
            <Link href="/how-it-works" className="btn btn-ghost btn-lg">See how it works</Link>
          </div>
          <div className="hero-trust">
            <div className="small" style={{ color: "var(--text-muted)", marginBottom: 14 }}>
              60 seconds · no payment to begin · directional leak map first · full roadmap within 24 hours
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Trades", "Property", "Clinics", "Hospitality"].map((s) => (
                <span key={s} style={{ fontSize: 12.5, color: "var(--text-faint)", border: "1px solid var(--border-hair)", borderRadius: 8, padding: "6px 12px", letterSpacing: ".02em" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-signature" data-reveal="">
          <HeroSignals />
        </div>
      </div>
    </section>
  );
}
