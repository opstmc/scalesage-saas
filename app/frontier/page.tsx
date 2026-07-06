import type { Metadata } from "next";
import JourneyButton from "@/components/JourneyButton";
import FinalCta from "@/components/FinalCta";

// COPY: JW to approve.
export const metadata: Metadata = {
  title: "Frontier Visibility",
  description:
    "Get found when buyers ask AI, not just Google. Frontier is the whole visibility layer: crawlability, structured data, authority, answer-first content, reviews, local proof, AI-search testing and reporting. Not AI SEO. Not a one-file trick.",
  alternates: { canonical: "/frontier" },
};

// The four layers of the visibility stack. Each maps to the parts named in the brief.
const LAYERS = [
  {
    n: "01",
    title: "Foundations & crawlability",
    items: [
      "Technical and on-page SEO foundations, the base every search still reads.",
      "Structured data (schema) so machines understand what each page is.",
      "AI crawler access via robots.txt and the llms.txt routing file.",
    ],
  },
  {
    n: "02",
    title: "Authority & local proof",
    items: [
      "Google Business optimisation, the record local AI leans on.",
      "Review capture systems that turn happy customers into public proof.",
      "Industry and comparison pages that earn citations from real questions.",
    ],
  },
  {
    n: "03",
    title: "Answer-first content",
    items: [
      "Pages written so an assistant can lift a clean, correct answer about you.",
      "Clear entities, definitions and FAQs, structured for how AI reads.",
      "The same content earns Google featured snippets and AI Overviews.",
    ],
  },
  {
    n: "04",
    title: "Testing & reporting",
    items: [
      "AI-search testing across ChatGPT, Perplexity, Claude, Gemini and Google AI.",
      "Citation tracking: where you get named, and where a rival gets named instead.",
      "Monthly reporting, so visibility is a number you can watch move.",
    ],
  },
];

const ENGINES = ["ChatGPT", "Perplexity", "Claude", "Gemini", "Google AI"];

// Answer-first FAQ. Doubles as AEO and drives the FAQPage schema below.
const FAQS = [
  {
    q: "Is Frontier just AI SEO?",
    a: "No. AI SEO implies a single trick. Frontier is the whole visibility layer: crawlability, structured data, authority, answer-first content, reviews, local proof, AI-search testing and reporting.",
  },
  {
    q: "Does an llms.txt file make me rank in AI?",
    a: "No. llms.txt is a routing file that helps crawlers find your key pages. It is not a ranking factor, and we never sell it as one.",
  },
  {
    q: "Which AI assistants do you test?",
    a: "ChatGPT, Perplexity, Claude, Gemini and Google AI (AI Overviews and AI Mode). We track where and how you get named across all of them.",
  },
  {
    q: "Do I still need normal Google SEO?",
    a: "Yes. SEO foundations and Google Business are part of the layer. AI search reads the same signals, so we build both, not one at the expense of the other.",
  },
  {
    q: "How is visibility reported?",
    a: "Monthly, inside Orbit Premium, your ScaleSage client dashboard. Frontier is its flagship feature: your citation tracking, AI-search test results and the work shipped, in plain numbers.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function Diamond() {
  return (
    <span
      className="diamond"
      aria-hidden="true"
      style={{ width: 7, height: 7, borderRadius: 1.5, background: "var(--accent-primary)", flex: "none", marginTop: 7 }}
    />
  );
}

export default function FrontierPage() {
  return (
    <main id="top" className="subpage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero. The verbatim positioning line is the lead. */}
      <section id="frontier" className="inner">
        <div className="section-head" data-reveal="" style={{ maxWidth: "52em" }}>
          <div className="eyebrow">Frontier Visibility</div>
          <h1 className="h1" style={{ marginBottom: 20 }}>
            Get found when buyers ask <span className="accent-em">AI</span>, not just Google.
          </h1>
          <p className="lead">
            We don&rsquo;t pretend one file makes you rank in AI. We build the whole visibility layer:
            crawlability, structured data, authority, answer-first content, reviews, local proof,
            AI-search testing, and reporting.
          </p>
        </div>
        <div data-reveal="" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <JourneyButton className="btn btn-primary btn-lg">Start the Catalyst diagnostic</JourneyButton>
          <a href="#layer" className="btn btn-ghost btn-lg">See the layer</a>
        </div>
      </section>

      {/* The honest bit: one file does not make you rank. */}
      <section className="section">
        <div className="inner">
          <div
            data-reveal=""
            className="glass"
            style={{ padding: "clamp(28px,4vw,44px)", borderLeft: "2px solid var(--accent-primary)", maxWidth: "52em" }}
          >
            <div className="eyebrow">The honest bit</div>
            <h2 className="h2">One file does not make you rank.</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              You will be sold an llms.txt file as an AI ranking hack. It is not one. llms.txt is a
              routing file, a signpost that helps crawlers find your key pages, and that is all we
              claim for it. Real AI visibility is a layer: crawlability, authority, answer-first
              content and proof, built and then measured. We do the layer.
            </p>
          </div>
        </div>
      </section>

      {/* The visibility layer: the ten parts, grouped into four. */}
      <section id="layer" className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">The visibility layer</div>
            <h2 className="h2">Ten parts. One system.</h2>
            <p className="lead">
              Every part below earns visibility in a different place, and they compound. Miss one and
              the assistants quote someone else. This is the full stack, not a single file.
            </p>
          </div>
          <div className="grid-2">
            {LAYERS.map((l) => (
              <div key={l.n} data-reveal="" className="glass glass-hover" style={{ padding: 30 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 className="h3 teal-underline" style={{ fontSize: 21 }}>{l.title}</h3>
                  <span className="eyebrow" style={{ margin: 0, color: "var(--text-faint)" }}>{l.n}</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {l.items.map((it) => (
                    <li key={it} style={{ display: "flex", gap: 12, fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
                      <Diamond />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-search testing panel. */}
      <section className="section">
        <div className="inner">
          <div className="grid-2" style={{ alignItems: "center", gap: 48 }}>
            <div data-reveal="">
              <div className="eyebrow">AI-search testing</div>
              <h2 className="h2">We ask the assistants about you.</h2>
              <p className="lead" style={{ marginTop: 12 }}>
                Ranking in AI is not a guess. Every cycle, we run the buying questions your customers
                actually ask through each major assistant, then log whether you get named, what they
                say, and who they name instead. That is citation tracking, and it is how we prove the
                layer is working.
              </p>
            </div>
            <div data-reveal="" className="glass" style={{ padding: 26 }}>
              <div className="eyebrow" style={{ fontSize: 10.5 }}>Tested every cycle</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                {ENGINES.map((name) => (
                  <span
                    key={name}
                    style={{
                      fontSize: 13.5,
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 20,
                      padding: "8px 14px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", boxShadow: "0 0 8px var(--accent-primary)" }} />
                    {name}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-hair)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Tracked: <span className="accent" style={{ fontWeight: 600 }}>named or not named</span>
                </span>
                <span style={{ fontSize: 12, color: "var(--accent-primary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "3px 10px" }}>
                  Reported monthly
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where it lives: Orbit Premium (referenced only, not built here). */}
      <section className="section">
        <div className="inner">
          <div data-reveal="" style={{ maxWidth: "52em" }}>
            <div className="eyebrow">Where it lives</div>
            <h2 className="h2">Frontier is the flagship feature inside Orbit Premium.</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              Orbit Premium is the ScaleSage client dashboard. Frontier runs there: your visibility
              layer, your AI-search tests and your citation tracking in one place, updated every
              month. You watch the number, not the jargon.
            </p>
          </div>
        </div>
      </section>

      {/* Answer-first FAQ (also the FAQPage schema above). */}
      <section id="faq" className="section">
        <div className="inner">
          <div className="grid-2" style={{ gap: 48, alignItems: "start" }}>
            <div data-reveal="">
              <div className="eyebrow">FAQ</div>
              <h2 className="h2">The questions worth asking.</h2>
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

      <FinalCta />
    </main>
  );
}
