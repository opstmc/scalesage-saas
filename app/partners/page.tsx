import type { Metadata } from "next";
import styles from "./partners.module.css";

// DRAFT: public partner-recruitment page, built from the ScaleSage Partner Pack
// (May 2026). Copy is JW-approval-pending before it ships. The internal
// cost-comparison / bolt-on wholesale tables from the confidential pack are
// deliberately NOT reproduced here — this page leads with the earning story.

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Earn recurring commission on every client you introduce to ScaleSage — 20–25% in Year 1, a lifetime trail from Year 4 for Gold and Platinum partners, full support from day one. No technical expertise required.",
  alternates: { canonical: "/partners" },
};

const PARTNER_EMAIL = "admin@scalesage.ai";
const APPLY = `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent("Partner application")}`;
const PARTNER_LOGIN = process.env.NEXT_PUBLIC_PORTAL_URL
  ? `${process.env.NEXT_PUBLIC_PORTAL_URL}/portal/login`
  : "#contact";

const STEPS = [
  { t: "Sign the Partner Agreement", b: "One document — commission, payment terms, IP. Signed electronically in about ten minutes." },
  { t: "Receive your Partner Kit", b: "Welcome pack, email templates, demo videos, sales deck and your referral link — within 48 hours." },
  { t: "Introduce a prospect", b: "Open with the free £750 Catalyst Diagnostic. The diagnostic does the selling — no hard pitch needed." },
  { t: "We close & deliver", b: "We handle the sales process, onboarding, build and ongoing delivery. Stay as involved as you like." },
  { t: "Get paid every month", b: "50% within 5 days of the client's payment, 50% at Day 90. Monthly, via Wise — GBP, EUR or USD." },
];

const TIERS = [
  { name: "Silver", when: "From your first close", rate: "20%", sub: "of monthly subscription · Year 1", trail: [["Y2", "5%"], ["Y3", "3%"], ["Y4", "Stops"]], note: "For partners getting started. No threshold — you earn from your very first introduction." },
  { name: "Gold", when: "5+ closes in 12 months", rate: "25%", sub: "of monthly subscription · Year 1", trail: [["Y2", "8%"], ["Y3", "5%"], ["Y4", "4% ∞"]], note: "For serious partners building recurring income. A lifetime trail from Year 4 that never stops.", featured: true },
  { name: "Platinum", when: "15+ closes in 12 months", rate: "25% +10%", sub: "Year 1 + a 10% retention bonus", trail: [["Y2", "12%"], ["Y3", "8%"], ["Y4", "5% ∞"]], note: "For top partners building a portfolio. The retention bonus pays an extra 10% when a client hits 12 months." },
];

const GETS = [
  ["Partner welcome pack + demo walkthrough", "A PDF guide plus a recorded walkthrough covering positioning, who ScaleSage is for, and the first conversation."],
  ["Pre-written email templates", "Warm intro, cold-warm and follow-up — professionally written. Change the name and industry, nothing else."],
  ["Demo videos", "Catalyst walkthrough plus live system demos — AI receptionist, cold-email engine, reactivation in action."],
  ["One-page sales deck", "Who ScaleSage is for, what each tier includes, pricing and the Catalyst Diagnostic. Clean and updated quarterly."],
  ["Free Catalyst Diagnostic — £750 value", "A free 20-minute AI health check you can offer every prospect. The best door-opener in the market."],
  ["Direct WhatsApp to Partner Success", "Got a live prospect? Message Cy directly. Warm lead handoff, real humans, 4-business-hour response."],
  ["Co-selling support", "For Pro prospects, Cy joins your call. For Max, the founder joins personally. Close rates jump to 30–50%."],
  ["Co-branded materials", "A one-pager with your name and logo alongside ScaleSage — and optionally your own landing page."],
  ["Monthly partner scorecard", "Sent on the 1st: leads referred, diagnostics booked, calls held, clients closed and commission paid. Full visibility."],
  ["Quarterly office hours with the founder", "A 30-minute open Q&A — product roadmap previews, ICP insights and what's working. Gold+ get monthly access."],
];

const INDUSTRIES = [
  "Plumbers", "Electricians", "Gas engineers", "Builders & roofers", "Tree surgeons",
  "Auto repair & garages", "Property managers", "Estate agents", "Cleaning companies",
  "Pet services", "Beauty & hair salons", "Restaurants & hospitality",
  "Clinics, dental & aesthetics", "Gyms & fitness studios", "Accountants & solicitors",
  "Recruitment agencies", "E-commerce & DTC brands",
];

const TERMS = [
  ["Commission payment", "50% within 5 days of the client's payment, 50% at the Day-90 retention milestone. Monthly, by the 10th, via Wise in GBP, EUR or USD."],
  ["First-close bonus", "Your very first standard client earns 100% of the first month's commission, paid immediately and not split. Once per partner."],
  ["Annual prepay bonus", "If a client signs annually (10% off), you receive the full Year-1 commission as a lump sum within 30 days — not spread over 12 months."],
  ["Eligible clients", "UK and Ireland registered businesses. You can operate from anywhere in the world — only the client's business location matters."],
  ["Tier permanence", "Once you reach Gold or Platinum, you keep that tier permanently, even if your close volume dips in a future 12-month window."],
  ["90-day retention rule", "Commission is split 50/50. If a client cancels before Day 90, the 50% already paid is clawed back. It protects quality on both sides."],
  ["Termination", "30 days' written notice by either side. Trail commissions on clients already closed keep paying — termination doesn't kill earned income."],
  ["Minimum payout", "£100 / €120 / $120. Anything below the threshold rolls forward to the following month's payment."],
  ["Tax & exclusivity", "Commission is paid gross; you handle your local tax. Non-exclusive — the only rule is no competing AI service to the same prospect at once."],
];

export default function PartnersPage() {
  return (
    <main id="top" className="subpage">
      {/* ---- hero ---- */}
      <header className={styles.hero}>
        <div className={styles.heroInner} data-reveal="">
          <div className="eyebrow">ScaleSage Partners</div>
          <h1 className={styles.heroTitle}>
            Earn from AI that <span className="accent-em">actually works.</span>
          </h1>
          <p className={styles.heroSub}>
            Recurring commission on every client you introduce. A lifetime trail into Year 4 and
            beyond. Full support from day one — you introduce, we build, deliver and retain. No
            technical expertise required.
          </p>
          <div className={styles.heroCtas}>
            <a href={APPLY} className="btn btn-primary btn-lg">Become a partner</a>
            <a href={PARTNER_LOGIN} className="btn btn-ghost btn-lg">Partner login</a>
          </div>
          <p className={styles.heroNote}>You introduce them to us. We build, deliver and retain them. You earn a recurring cut for as long as they stay.</p>
        </div>
      </header>

      {/* ---- how it works ---- */}
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">The process</div>
            <h2 className="h2">Five steps. Then you get paid.</h2>
            <p className="lead">You introduce. We close, build and deliver. You earn for as long as the client stays — without managing any of the work.</p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={s.t} data-reveal="" className={`glass ${styles.step}`}>
                <div className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</div>
                <div className={styles.stepTitle}>{s.t}</div>
                <div className={styles.stepBody}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- what you're selling ---- */}
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">What you&rsquo;re selling</div>
            <h2 className="h2">Three tiers. One clear fit.</h2>
            <p className="lead">Every prospect fits one of three tiers. Your commission is a percentage of their monthly subscription for as long as they stay.</p>
          </div>
          <div className="grid-3">
            <div data-reveal="" className="glass glass-hover price-card">
              <h3 className="h3">Starter</h3>
              <div className="price-amount">£597<span>/mo</span></div>
              <p className="small">Sole traders getting more leads without hiring. +£297 one-off setup.</p>
            </div>
            <div data-reveal="" className="glass glass-hover price-card featured">
              <h3 className="h3">Pro</h3>
              <div className="price-amount">£1,497<span>/mo</span></div>
              <p className="small">Established operators ready to scale. Voice AI, full pipeline, monthly strategy. +£747 setup.</p>
            </div>
            <div data-reveal="" className="glass glass-hover price-card">
              <h3 className="h3">Max</h3>
              <div className="price-amount">£4,997<span>/mo</span></div>
              <p className="small">Multi-site operators — done-for-you, a dedicated EA and founder-level strategy. +£2,497 setup.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- commission ---- */}
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">What you earn</div>
            <h2 className="h2">Commission that trails into Year 4 and beyond.</h2>
            <p className="lead">Earn 20–25% of every subscription in Year 1. Gold and Platinum partners earn a lifetime trail that never stops — ongoing income even if you stop actively selling.</p>
          </div>
          <div className="grid-3">
            {TIERS.map((t) => (
              <div key={t.name} data-reveal="" className={`glass glass-hover price-card${t.featured ? " featured" : ""}`}>
                <div className="eyebrow">{t.when}</div>
                <h3 className="h3">{t.name}</h3>
                <div className={styles.rate}>{t.rate}</div>
                <div className={styles.rateSub}>{t.sub}</div>
                <div className={styles.trail}>
                  {t.trail.map(([yr, pct]) => (
                    <div key={yr} className={styles.trailCell}>
                      <div className={styles.trailYr}>{yr}</div>
                      <div className={styles.trailPct}>{pct}</div>
                    </div>
                  ))}
                </div>
                <p className={styles.tierNote}>{t.note}</p>
              </div>
            ))}
          </div>

          {/* earnings example */}
          <div className={`glass ${styles.calc}`} data-reveal="">
            <div className="eyebrow">What one client earns you</div>
            <h3 className="h3" style={{ marginTop: 6 }}>A single Pro client over 3 years</h3>
            <p className="small" style={{ marginBottom: 8 }}>Pro · £1,497/month · Silver tier · monthly billing</p>
            <div className={styles.calcRow}><span className={styles.calcLabel}>Year 1 (20% × £1,497 × 12)</span><span className={styles.calcVal}>£3,593</span></div>
            <div className={styles.calcRow}><span className={styles.calcLabel}>Year 2 trail (5% × £1,497 × 12)</span><span className={styles.calcVal}>£898</span></div>
            <div className={styles.calcRow}><span className={styles.calcLabel}>Year 3 trail (3% × £1,497 × 12)</span><span className={styles.calcVal}>£539</span></div>
            <div className={styles.calcTotal}><span className={styles.calcTotalLabel}>Total from one client — 3 years</span><span className={styles.calcTotalVal}>£5,030</span></div>
            <p className={styles.calcFoot}>At Gold tier: about £8,264 from the same client over 5 years, including the lifetime trail. Annual-prepay closes pay the full Year-1 commission as a lump sum within 30 days.</p>
          </div>
        </div>
      </section>

      {/* ---- founding partner ---- */}
      <section className="section">
        <div className="inner">
          <div className={styles.founding} data-reveal="">
            <div className="eyebrow">★ Founding Partner — first 10 only</div>
            <div className={styles.foundingTitle}>Gold economics from close number one.</div>
            <p className="lead" style={{ margin: 0 }}>The first 10 partners earn 25% commission from their very first client — no threshold, no waiting. Once 10 Founding Partners are signed, this closes permanently.</p>
            <div className={styles.foundingList}>
              <div className={styles.foundingItem}><strong>100% first commission — instantly</strong>Your very first close pays 100% of the first month&rsquo;s commission within 5 business days. Not split.</div>
              <div className={styles.foundingItem}><strong>Lifetime priority access to the founder</strong>A direct line with a 2-hour response during UK business hours, for life while you&rsquo;re active.</div>
              <div className={styles.foundingItem}><strong>First-look product access</strong>New launches and roadmap previews before any general announcement, plus annual Founding Partner summits.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- what every partner gets ---- */}
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">What every partner gets</div>
            <h2 className="h2">Everything you need to sell confidently.</h2>
            <p className="lead">Every partner receives a full kit within 48 hours of signing. You don&rsquo;t figure this out yourself — we build it with you and support every step.</p>
          </div>
          <div className={styles.getGrid}>
            {GETS.map(([t, b], i) => (
              <div key={t} data-reveal="" className={`glass ${styles.getItem}`}>
                <div className={styles.getNo}>{i + 1}</div>
                <div>
                  <div className={styles.getTitle}>{t}</div>
                  <div className={styles.getBody}>{b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- who we serve ---- */}
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">Who we serve</div>
            <h2 className="h2">Industries you can sell into, day one.</h2>
            <p className="lead">ScaleSage works for any UK business losing revenue to missed calls, cold leads or admin — with systems built for each industry&rsquo;s exact problems.</p>
          </div>
          <div className={styles.chips}>
            {INDUSTRIES.map((n) => (
              <span key={n} className={styles.chip}>{n}</span>
            ))}
            <span className={`${styles.chip} ${styles.chipOpen}`}>Not on this list? Let&rsquo;s open the door</span>
          </div>
        </div>
      </section>

      {/* ---- key terms ---- */}
      <section className="section">
        <div className="inner">
          <div className="section-head" data-reveal="">
            <div className="eyebrow">Key terms</div>
            <h2 className="h2">The terms, plainly stated.</h2>
            <p className="lead">No small-print surprises. Everything here is in the Partner Agreement you sign.</p>
          </div>
          <div className={styles.terms}>
            {TERMS.map(([h, b]) => (
              <div key={h} data-reveal="" className={`glass ${styles.term}`}>
                <div className={styles.termHead}>{h}</div>
                <div className={styles.termBody}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- closing CTA ---- */}
      <section className="section">
        <div className={styles.closer} data-reveal="">
          <div className="eyebrow">Become a partner</div>
          <h2 className="h2">Introduce one business. Earn for as long as they stay.</h2>
          <p className="lead" style={{ marginLeft: "auto", marginRight: "auto" }}>
            No revenue guarantees. No hidden catches. Just recurring commission, full support, and a
            long-term partnership. Email us to get your Partner Agreement and kit.
          </p>
          <div className={styles.closerCtas}>
            <a href={APPLY} className="btn btn-primary btn-lg">Become a partner</a>
            <a href={PARTNER_LOGIN} className="btn btn-secondary btn-lg">Partner login</a>
          </div>
        </div>
      </section>
    </main>
  );
}
