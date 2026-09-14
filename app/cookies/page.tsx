import { pageMetadata } from "@/lib/seo";

export const generateMetadata = pageMetadata({
  path: "/cookies",
  title: "Cookie Policy",
  description:
    "How ScaleSage uses essential and analytics cookies, and how to control them.",
});

const TYPES = [
  {
    h: "Essential",
    body: "Required for the site to function, including security and session management. Consent is not required.",
  },
  {
    h: "Analytics",
    body: "Help us understand how visitors use the site, such as pages visited and time on site. They only run with consent and do not build advertising profiles.",
  },
];

const SECTIONS = [
  {
    h: "What are cookies?",
    body: [
      "Cookies are small text files placed on your device when you visit a website. They help websites remember preferences and understand how the site is used.",
    ],
  },
  {
    h: "What we do not use",
    body: [
      "We do not use advertising or retargeting cookies, third-party tracking cookies, or social media tracking pixels.",
    ],
  },
  {
    h: "How to control cookies",
    body: [
      "You can manage or disable cookies through your browser settings. Disabling essential cookies may affect how the site functions. You can update your consent preferences at any time by clicking Cookie Settings in the footer.",
    ],
  },
  {
    h: "Changes and contact",
    body: [
      "We may update this Cookie Policy as our use of cookies changes. Check this page periodically for updates.",
      "ScaleSage Ai Limited, 71-75 Shelton Street, Covent Garden, London WC2H 9JQ. Contact: privacy@scalesage.ai.",
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
              The cookies this site uses, and how to control them.
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
                <h3 className="h3 teal-underline" style={{ fontSize: 19, marginBottom: 12 }}>{t.h} cookies</h3>
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
