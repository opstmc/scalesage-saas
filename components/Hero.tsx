import HeroField from "./HeroField";
import JourneyButton from "./JourneyButton";

export default function Hero() {
  return (
    <section id="hero-band" className="hero">
      <HeroField />
      <div className="hero-vignette" />
      <div className="hero-fade" />
      <div data-nav-sentinel="" style={{ position: "absolute", bottom: 8, left: 0, width: 1, height: 1, pointerEvents: "none" }} />
      <div className="hero-content">
        <div data-reveal="" style={{ maxWidth: "15.5em" }}>
          <div className="hero-eyebrow">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-lite)", boxShadow: "0 0 12px var(--accent-lite)" }} />
            AI &amp; Automation Specialists
          </div>
          <h1 id="hero-headline" className="hero-h1">
            Find the revenue you’re leaking. Then own the systems that recover it.
          </h1>
        </div>
        <p id="hero-subhead" data-reveal="" className="hero-sub">
          We’re a specialist team that diagnoses your business, builds custom AI systems you own, and proves the results in numbers — so you capture more revenue and get found across the search frontier.
        </p>
        <div data-reveal="" className="hero-cta">
          <JourneyButton className="btn btn-accent btn-lg">Book Your Catalyst Diagnostic</JourneyButton>
          <a href="#leaking" className="btn btn-ghost">See what we fix</a>
        </div>
        <div data-reveal="" className="hero-cred">
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-lite)", boxShadow: "0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent)" }} />
          <span className="mono" style={{ fontSize: 12.5, letterSpacing: ".04em", color: "rgba(255,255,255,.55)" }}>
            Customer Zero — we run every system on ourselves before we sell it to you.
          </span>
        </div>
      </div>
    </section>
  );
}
