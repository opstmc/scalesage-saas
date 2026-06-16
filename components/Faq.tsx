import JourneyButton from "./JourneyButton";
import SageWidget from "./SageWidget";

const FAQS = [
  { q: "What exactly is the Catalyst Diagnostic?", a: "A paid, structured diagnosis of your business. Before any call, our agents study your site, reviews and competitor stack and build a working demo of the highest-leverage fixes. You leave with a clear report — whether or not you go further." },
  { q: "What do I actually get?", a: "A diagnosis of where revenue is leaking, a working demo of the top fixes, a prioritised plan, and a clear scope & quote. The report is yours to keep." },
  { q: "How does the credit work?", a: "The diagnostic fee (£150 or £750) is credited in full against your first retainer if you sign within 60 days. If you don’t, you still keep the report." },
  { q: "Do I own what you build?", a: "Yes. Every system and agent is owned by you — no templates, no lock-in. If we part ways, you keep what we built." },
  { q: "How fast do things move?", a: "The diagnostic turns around in days, not weeks — you often see a working demo before we’ve even met. Build timelines are set in your scope." },
  { q: "What’s different about you?", a: "We diagnose before we pitch, prove with working demos, build systems you own, and verify outputs across multiple models. We’re specialists — not a templated agency." },
  { q: "How do you handle data & security?", a: "Encrypted, GDPR-compliant, consent-first. We never sell your data or use it to train external AI. You stay in control throughout." },
];

export default function Faq() {
  return (
    <section id="faq" className="section">
      <div className="inner">
        <div className="faq-grid">
          <div data-reveal="">
            <div className="eyebrow">FAQ</div>
            <h2 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.1, letterSpacing: "-.025em", margin: "0 0 28px" }}>Straight answers.</h2>
            <div className="faq-list">
              {FAQS.map((f) => (
                <details key={f.q} className="faq-item">
                  <summary>
                    {f.q}
                    <span className="faq-plus">+</span>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <SageWidget />
        </div>

        <div data-reveal="" style={{ marginTop: 64, background: "var(--ink)", color: "#fff", borderRadius: 22, padding: "clamp(40px,6vw,72px)", textAlign: "center" }}>
          <h2 className="font-display" style={{ fontWeight: 600, fontSize: "clamp(30px,4.4vw,52px)", lineHeight: 1.05, letterSpacing: "-.03em", margin: "0 0 18px", textWrap: "balance" }}>
            Stop guessing where the revenue goes.
          </h2>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,.72)", maxWidth: "34em", margin: "0 auto 32px" }}>
            Book your Catalyst Diagnostic. We’ll show you what’s leaking — and exactly how we’d recover it.
          </p>
          <JourneyButton className="btn btn-light btn-lg">Book Your Catalyst Diagnostic</JourneyButton>
        </div>
      </div>
    </section>
  );
}
