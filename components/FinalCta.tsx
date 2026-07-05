import JourneyButton from "./JourneyButton";

/**
 * The recurring closing call-to-action — a full-bleed glass panel that ends
 * every page. Self-contained section so any page can drop it in after its
 * content. Left-aligned, on-brand, opens the Catalyst diagnostic.
 */
export default function FinalCta() {
  return (
    <section className="section">
      <div className="inner">
        <div
          data-reveal=""
          className="glass"
          style={{
            borderRadius: "var(--r-hero)",
            padding: "clamp(40px,6vw,72px)",
            textAlign: "left",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <h2 className="h1" style={{ marginBottom: 16 }}>
            Find your <span className="accent-em">leak</span>.
          </h2>
          <p className="lead" style={{ maxWidth: "36em", margin: "0 0 32px" }}>
            60 seconds with the Catalyst diagnostic shows you what&rsquo;s costing you,
            what to fix first, and what the recovery looks like in numbers.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "flex-start", flexWrap: "wrap" }}>
            <JourneyButton className="btn btn-primary btn-lg">Start the Catalyst diagnostic</JourneyButton>
            <a href="#contact" className="btn btn-ghost btn-lg">Talk to us first</a>
          </div>
        </div>
      </div>
    </section>
  );
}
