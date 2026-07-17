const FAQS = [
  { q: "How is this different from buying a £99 AI receptionist tool?", a: "A tool is a part. We diagnose which leak is costing you the most, install the system that closes it, monitor it, and prove it moved your numbers. You buy the outcome, not the part." },
  { q: "We're a small business, is this overkill for us?", a: "Starter exists for exactly this: one acute leak, plugged, with a monthly ROI report. The Catalyst diagnostic shows what your biggest leak is worth before you commit to anything." },
  { q: "What happens if it doesn't work?", a: "Every system has a number against it, with a baseline measured at install. We guarantee implementation. We target performance. We report both honestly." },
  { q: "How quickly can you have us live?", a: "The diagnostic turns around in minutes; most first systems are live within days, not months. Exact timelines are set in your scope." },
  { q: "Do you require long contracts?", a: "No long lock-in, and cancellation is self-serve, never “email us”. Systems are built into your business, so what we install stays yours." },
  { q: "Is our data safe?", a: "GDPR-compliant by design, UK and EU. We disclose exactly what the site loads, you own your data, and we never sell it or use it to train external AI." },
];

export default function Faq() {
  return (
    <section id="faq" className="section">
      <div className="inner">
        <div className="grid-2" style={{ gap: 48, alignItems: "start" }}>
          <div data-reveal="">
            <div className="eyebrow">FAQ</div>
            <h2 className="h2">Straight answers to the real questions.</h2>
          </div>
          <div data-reveal="">
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
        </div>
      </div>
    </section>
  );
}
