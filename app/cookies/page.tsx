import type { Metadata } from "next";

// DRAFT: plain-English cookie summary. Requires JW + legal sign-off before
// anyone relies on this copy. Grounded only in stated facts; not legal advice.

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "The cookies this site uses and how to control them. Consent is required before any non-essential or analytics cookie fires.",
  alternates: { canonical: "/cookies" },
};

const TYPES = [
  {
    h: "Essential cookies",
    body:
      "Needed for the site to work. They keep pages functioning and remember basic session state. These are always on because the site cannot run without them.",
  },
  {
    h: "Consent cookies",
    body:
      "Remember the cookie choice you make, so we do not ask you again on every visit.",
  },
  {
    h: "Analytics cookies",
    body:
      "Help us understand how the site is used, in aggregate. They measure page activity, not individual people, and they only run once you have agreed.",
  },
];

const SECTIONS = [
  {
    h: "Consent comes first",
    body: [
      "Non-essential and analytics cookies do not fire until you consent. Nothing beyond essential cookies runs before you say yes.",
    ],
  },
  {
    h: "Changing your mind",
    body: [
      "You can change or withdraw your consent at any time. Clear this site's cookies in your browser and you will be asked again on your next visit.",
      "If you would like us to confirm or action anything, email support@scalesage.ai.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <main id="top" className="subpage">
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">Legal</div>
            <h1 className="h1">Cookies</h1>
            <p className="lead" style={{ marginTop: 18 }}>
              The cookies this site uses, and how to control them. Plain English, no dark patterns.
            </p>
          </div>
          <div
            className="glass"
            style={{ padding: 22, borderLeft: "2px solid var(--accent-primary)", maxWidth: "46em" }}
          >
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              This is a plain-English summary. The formal Cookie Policy is available on request while we finalise the
              published version. Email <span className="accent">support@scalesage.ai</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="" style={{ marginBottom: 32 }}>
            <h2 className="h2">Three kinds of cookies</h2>
          </div>
          <div className="grid-3">
            {TYPES.map((t) => (
              <div
                key={t.h}
                data-reveal=""
                className="glass"
                style={{ padding: 26, display: "flex", flexDirection: "column" }}
              >
                <h3 className="h3 teal-underline" style={{ fontSize: 19, marginBottom: 12 }}>{t.h}</h3>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{t.body}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: "46em", marginTop: 56 }}>
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
