import DataStreamField from "./DataStreamField";
import JourneyButton from "./JourneyButton";

function SigCard({
  tag,
  headline,
  meta,
  className,
}: {
  tag: string;
  headline: React.ReactNode;
  meta: string;
  className?: string;
}) {
  return (
    <div className={`glass glass-hover sig-card ${className ?? ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-primary)", boxShadow: "0 0 10px var(--accent-primary)", flex: "none" }} />
        <span className="eyebrow" style={{ margin: 0, fontSize: 11 }}>{tag}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text-headline)", lineHeight: 1.25 }}>{headline}</div>
      <div className="small" style={{ marginTop: 8, color: "var(--text-faint)" }}>{meta}</div>
    </div>
  );
}

export default function Hero({ background }: { background?: React.ReactNode }) {
  return (
    <section className="hero">
      {background ?? <DataStreamField />}
      <div className="hero-vignette" />
      <div className="hero-fade" />
      <div className="hero-content">
        <div data-reveal="">
          <div className="eyebrow">Diagnose. Build. Prove.</div>
          <h1 className="display">
            Your business is <span className="accent-em">leaking</span>. We find it. Fix it. Prove it.
          </h1>
          <p className="lead" style={{ marginTop: 22, maxWidth: "34em", fontSize: 19 }}>
            Missed calls, cold quotes, forgotten reviews, invisible search results — every leak has a number, and we close it.
          </p>
          <div className="hero-cta">
            <JourneyButton className="btn btn-primary btn-lg">Run the Catalyst diagnostic</JourneyButton>
            <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
          </div>
          <div className="hero-trust">
            <div className="small" style={{ color: "var(--text-muted)", marginBottom: 14 }}>
              Founding client programme · UK &amp; EU · GDPR-compliant by design
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Trades", "Property", "Clinics", "Hospitality"].map((s) => (
                <span key={s} style={{ fontSize: 12.5, color: "var(--text-faint)", border: "1px solid var(--border-hair)", borderRadius: 8, padding: "6px 12px", letterSpacing: ".02em" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-signature" data-reveal="">
          <SigCard tag="Capture" headline={<>Missed call → <span className="accent">booked in 00:12</span></>} meta="Voice AI · 24/7 coverage" />
          <SigCard tag="Convert" headline={<>Quote follow-up · Day 1 · 3 · 7</>} meta="Sequenced until it converts" />
          <SigCard tag="Be found" headline={<>You&rsquo;re the answer on AI search</>} meta="ChatGPT · Perplexity · Google" />
        </div>
      </div>
    </section>
  );
}
