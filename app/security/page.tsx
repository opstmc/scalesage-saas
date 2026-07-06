import type { Metadata } from "next";

// DRAFT: plain-English security summary. Requires JW + legal sign-off before
// anyone relies on this copy. Honest and general; no invented certifications.

export const metadata: Metadata = {
  title: "Security",
  description:
    "How ScaleSage keeps your data and systems safe. GDPR-compliant by design, a Safety Pack per engagement, DPA on request, data held in the EU and UK.",
  alternates: { canonical: "/security" },
};

const SECTIONS = [
  {
    h: "GDPR posture",
    body: [
      "ScaleSage is a UK-registered company serving clients across the UK and the EU, and we are GDPR-compliant by design. Security follows the same principle as privacy: built in, not bolted on.",
    ],
  },
  {
    h: "The Safety Pack",
    body: [
      "Every engagement is covered by a Safety Pack: our documented, plain-English summary of how we protect access to your data and the systems we build for you. It is available on request.",
    ],
  },
  {
    h: "Data Processing Agreement",
    body: [
      "For clients, a Data Processing Agreement (DPA) sets out exactly how we handle data on your behalf. The DPA is available on request.",
    ],
  },
  {
    h: "You own your data",
    body: [
      "Your data stays yours, and so does the work. On full payment, everything we build for you becomes yours. We never sell your data or use it to train external AI models.",
    ],
  },
  {
    h: "Where your data lives",
    body: [
      "Data is held in the EU and the UK. Personal data lives in our database, not in analytics tools.",
    ],
  },
  {
    h: "Certifications",
    body: [
      "We only claim what we hold. Cyber Essentials is currently under review. We will state its status honestly rather than imply a certification we do not yet have.",
    ],
  },
  {
    h: "Reporting a concern",
    body: [
      "If you spot a security issue or have a question, contact support@scalesage.ai and we will respond.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <main id="top" className="subpage">
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">Legal</div>
            <h1 className="h1">Security</h1>
            <p className="lead" style={{ marginTop: 18 }}>
              How we keep your data and the systems we build safe. Honest and general, with the detail available on
              request.
            </p>
          </div>
          <div
            className="glass"
            style={{ padding: 22, borderLeft: "2px solid var(--accent-primary)", maxWidth: "46em" }}
          >
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              This is a plain-English summary. The formal security documentation, including the Safety Pack and DPA, is
              available on request while we finalise the published version. Email{" "}
              <span className="accent">support@scalesage.ai</span>.
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
          </div>
        </div>
      </section>
    </main>
  );
}
