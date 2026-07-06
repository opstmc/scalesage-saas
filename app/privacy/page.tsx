import type { Metadata } from "next";

// DRAFT: plain-English privacy summary. Requires JW + legal sign-off before
// anyone relies on this copy. Grounded only in stated facts; not legal advice.

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How ScaleSage handles your data. Plain English: GDPR-compliant by design, you own your data, nothing is sold or used to train external AI.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    h: "GDPR-compliant by design",
    body: [
      "ScaleSage is a UK-registered company serving clients across the UK and the EU. Privacy is built into how the site and our systems work, not bolted on afterwards. We follow UK and EU GDPR principles by design.",
    ],
  },
  {
    h: "What this site loads",
    body: [
      "We disclose exactly what the site loads. This site loads only what is needed to show you these pages and to let you get in touch.",
      "If you send us an enquiry, we collect what you choose to share, such as your name, contact details, and your message, so we can reply to you.",
    ],
  },
  {
    h: "You own your data",
    body: [
      "Your data is yours. You can ask what we hold, ask for a copy, or ask us to delete it. Email support@scalesage.ai and we will action your request.",
    ],
  },
  {
    h: "We never sell your data, and never train external AI on it",
    body: [
      "Nothing is sold. Your data is never sold, rented, or handed to anyone else for their marketing. It is never used to train external AI models.",
    ],
  },
  {
    h: "Where your data lives",
    body: [
      "Personal data lives in our database, not in analytics tools. We do not send personal data to analytics. Where analytics are used, they measure page activity in aggregate, not people.",
    ],
  },
  {
    h: "Data Processing Agreement",
    body: [
      "For clients, a Data Processing Agreement (DPA) sets out exactly how we handle data on your behalf. The DPA is available on request.",
    ],
  },
  {
    h: "How to reach us",
    body: [
      "Questions about privacy, or a request about your own data, go to support@scalesage.ai.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main id="top" className="subpage">
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">Legal</div>
            <h1 className="h1">Privacy</h1>
            <p className="lead" style={{ marginTop: 18 }}>
              How ScaleSage handles your data, in plain English. No fog, no small print you need a lawyer to read.
            </p>
          </div>
          <div
            className="glass"
            style={{ padding: 22, borderLeft: "2px solid var(--accent-primary)", maxWidth: "46em" }}
          >
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              This is a plain-English summary. The formal Privacy Policy is available on request while we finalise the
              published version. Email <span className="accent">support@scalesage.ai</span>.
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
