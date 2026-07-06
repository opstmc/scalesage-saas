import type { Metadata } from "next";

// DRAFT: plain-English terms summary. Requires JW + legal sign-off before
// anyone relies on this copy. Grounded only in stated facts; not legal advice.

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The ScaleSage founding-client terms, shown openly: 20% lifetime discount, 50% off setup, 12-month founding minimum, months 4 to 12 buyout, cancel with 30 days' notice.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    h: "Founding-client terms, shown openly",
    body: [
      "We show the founding-client terms in the open. Founding clients receive a 20% lifetime discount and 50% off setup, in return for a 12-month founding minimum.",
    ],
  },
  {
    h: "Buyout",
    body: [
      "From month 4 to month 12, you can buy out the remainder of the founding minimum. We will set out the buyout figure on request.",
    ],
  },
  {
    h: "Cancelling",
    body: [
      "You can cancel with 30 days' written notice. Send it to support@scalesage.ai and we will confirm receipt.",
    ],
  },
];

const QUOTES = [
  {
    label: "Our guarantee",
    text: "We guarantee implementation. We target performance. We report both honestly.",
  },
  {
    label: "Ownership · ToS 6.1",
    text: "Everything we build for you becomes yours on full payment.",
  },
];

export default function TermsPage() {
  return (
    <main id="top" className="subpage">
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">Legal</div>
            <h1 className="h1">Terms</h1>
            <p className="lead" style={{ marginTop: 18 }}>
              What you get, what it costs, and how to leave. The founding-client terms, in plain English.
            </p>
          </div>
          <div
            className="glass"
            style={{ padding: 22, borderLeft: "2px solid var(--accent-primary)", maxWidth: "46em" }}
          >
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              This is a plain-English summary. The formal Terms are available on request while we finalise the published
              version. Email <span className="accent">support@scalesage.ai</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="inner">
          <div style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: "46em" }}>
            {SECTIONS.map((s) => (
              <div key={s.h} data-reveal="">
                <h2 className="h3" style={{ fontSize: 21, marginBottom: 12 }}>{s.h}</h2>
                {s.body.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 16,
                      color: "var(--text-muted)",
                      margin: i ? "12px 0 0" : 0,
                      lineHeight: 1.65,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            ))}

            {QUOTES.map((q) => (
              <div
                key={q.label}
                data-reveal=""
                className="glass"
                style={{ padding: 26, borderLeft: "2px solid var(--accent-primary)" }}
              >
                <div className="eyebrow" style={{ marginBottom: 12 }}>{q.label}</div>
                <p
                  style={{
                    fontSize: 20,
                    color: "var(--text-headline)",
                    margin: 0,
                    lineHeight: 1.4,
                    letterSpacing: "-.01em",
                  }}
                >
                  {q.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
