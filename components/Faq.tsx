import { GUARANTEE_NAME } from "@/lib/offer";

/* Exported so the FAQPage structured data on /pricing is generated from these
 * exact answers instead of a second hand-maintained copy. Two copies of the
 * same answer is two chances to be wrong, and search engines get shown the one
 * that drifts. */
export const FAQS = [
  {
    q: "How is this different from buying a £99 AI receptionist tool?",
    a: "A tool is a part. We diagnose which leak is costing you the most, install the system that closes it, monitor it, and prove it moved your numbers. You buy the outcome, not the part.",
  },
  {
    q: "We're a small business, is this overkill for us?",
    a: "Starter exists for exactly this: one acute leak, plugged, with a monthly ROI report. The Catalyst diagnostic shows what your biggest leak is worth before you commit to anything.",
  },
  {
    q: "What happens if it doesn't work?",
    a: `Every system has a number against it, with a baseline measured before anything goes live. The ${GUARANTEE_NAME} covers the build. We target performance, we measure it against your baseline, and we report both honestly.`,
  },
  {
    q: "How quickly can you have us live?",
    a: "The Catalyst gives you your mini result in minutes and your full report inside 24 hours. Most first systems are live within days, not months. Exact timelines are set in your scope.",
  },
  {
    q: "Do you require long contracts?",
    a: "On standard pricing, no long lock-in, and cancellation is self-serve, never “email us”. The one exception is the founding cohort: those places are discounted 20 percent for life and carry a 12 month minimum term, which is stated on the card before you buy. Either way, the systems are built into your business and what we install stays yours.",
  },
  {
    q: "Do you use countdown timers and “only two places left”?",
    a: "No. No countdown timers, no price that mysteriously rises at midnight, no manufactured urgency. We run the diagnostic, we put your numbers in front of you, we put a plan next to them with the price attached, and then it is your call. When the founding places genuinely run out we will say they are closed, because that will be a fact.",
  },
  {
    q: "Is our data safe?",
    a: "GDPR-compliant by design, UK and EU. We disclose exactly what the site loads, you own your data, and we never sell it or use it to train external AI.",
  },
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
