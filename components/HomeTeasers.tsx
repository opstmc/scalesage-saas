import Link from "next/link";

/**
 * Home-page navigation teasers — one card per top-level page. Replaces the
 * long single-page scroll: the hero sets the story, these route visitors to
 * the section they care about.
 */
const TEASERS = [
  {
    href: "/how-it-works",
    kicker: "How it works",
    title: "Diagnose. Build. Prove.",
    body: "An actual process, not guesswork — we find where revenue leaks, install the systems that close it, and put a number on every one.",
    cta: "See the method",
  },
  {
    href: "/industries",
    kicker: "Industries",
    title: "18 SME sectors, mapped.",
    body: "Find yours and open its full leak map — the three biggest leaks, what’s really happening, and the one we’d fix first.",
    cta: "Find your sector",
  },
  {
    href: "/pricing",
    kicker: "Pricing",
    title: "Three tiers, all accountable.",
    body: "Starter £597, Pro £1,497, Max £4,997 — public and monthly. Not sure which? The diagnostic decides.",
    cta: "See pricing",
  },
  {
    href: "/about",
    kicker: "About",
    title: "Not a normal AI agency.",
    body: "We don’t sell tools or promise outcomes — we prove them. The difference, and the founding-client proof discipline behind it.",
    cta: "Why ScaleSage",
  },
];

export default function HomeTeasers() {
  return (
    <section className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Explore</div>
          <h2 className="h2">Everything, in the right order.</h2>
          <p className="lead">Start with the leak. Here&rsquo;s where each part of the story lives.</p>
        </div>
        <div className="grid-2">
          {TEASERS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              data-reveal=""
              className="glass glass-hover card-link"
              style={{ padding: 32, display: "flex", flexDirection: "column" }}
            >
              <div className="eyebrow" style={{ margin: 0, color: "var(--text-faint)" }}>{t.kicker}</div>
              <h3 className="h3 teal-underline" style={{ margin: "12px 0 0" }}>{t.title}</h3>
              <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: "12px 0 0", lineHeight: 1.6, flex: 1 }}>
                {t.body}
              </p>
              <span className="accent" style={{ marginTop: 18, fontWeight: 600, fontSize: 14.5 }}>{t.cta} &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
