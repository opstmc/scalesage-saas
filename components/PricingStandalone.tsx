import Link from "next/link";
import styles from "./PricingStandalone.module.css";
import {
  BOLT_ONS as DUAL,
  ORBIT,
  ORBIT_ANNUAL_NOTE,
  ORBIT_WAITLIST_NOTE,
  VAT_NOTE,
} from "@/lib/offer";

/* Figures come from lib/offer.ts, which mirrors Offer Book v1.7 s11. Copied
 * from canon, never retyped here, and never invented. */

export default function PricingStandalone() {
  return (
    <section id="standalone" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Standalone builds and bolt-ons</div>
          <h2 className="h2">Buy any piece on its own. Or subscribe and pay less on all of them.</h2>
          {/* JW-CANDIDATE COPY: framing line above the table */}
          <p className={styles.framing}>
            Everything below can be bought on its own. <strong>Subscribers pay less on every
            single one.</strong> That&apos;s the point of the subscription.
          </p>
        </div>

        {/* --- Dual-price table --- */}
        <div data-reveal="" className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Standalone build and bolt-on prices compared with subscriber prices.
            </caption>
            <thead>
              <tr>
                <th scope="col">Build or bolt-on</th>
                <th scope="col" className={styles.num}>Standalone</th>
                <th scope="col" className={styles.num}>Subscriber</th>
                <th scope="col" className={styles.num}>You save</th>
              </tr>
            </thead>
            <tbody>
              {DUAL.map((r) => (
                <tr key={r.item}>
                  <td className={styles.item}>
                    {r.item}
                    {r.note && (
                      <span style={{ display: "block", fontSize: 12.5, opacity: 0.7, marginTop: 3 }}>
                        {r.note}
                      </span>
                    )}
                  </td>
                  <td className={`${styles.num} ${styles.standalonePrice}`}>{r.standalone}</td>
                  <td className={`${styles.num} ${styles.subPrice}`}>{r.subscriber}</td>
                  <td className={`${styles.num} ${styles.saving}`}>{r.saving}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.pending}>{VAT_NOTE}</p>

        {/* --- Orbit standalone: Free / Pro / Premium, waitlist only ---
            No buy button anywhere in this block. The purchase path ships in a
            later phase, and the rule is that anything not fully ready to
            deliver goes live as a waitlist, never a hidden page and never an
            overpromise. --- */}
        <div className="section-head" data-reveal="" style={{ marginTop: 56, marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Orbit, on its own</div>
          <h2 className="h2">Better tier, better brain, better decisions.</h2>
          <p className="lead">
            Orbit is where your business makes sense in one place. Free runs on fast, efficient
            models. Pro steps up to stronger ones. Premium runs on frontier models with deeper
            reasoning, and adds live market intelligence. Every paying ScaleSage client gets Orbit
            Pro or Premium included, so nobody paying for the service sits on the free product.
          </p>
        </div>
        <div className={styles.orbitGrid}>
          {ORBIT.map((o) => (
            <div key={o.name} data-reveal="" className={`glass glass-hover ${styles.orbitCard}`}>
              <div className={styles.orbitName}>{o.name}</div>
              <div className={styles.orbitPrice}>{o.price}</div>
              <div className={styles.orbitFree}>
                <strong>{o.line}</strong>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, margin: "10px 0 0" }}>
                {o.detail}
              </p>
              {o.includedWith && (
                <span className={styles.orbitFlagship}>Included with {o.includedWith}</span>
              )}
            </div>
          ))}
        </div>
        <p className={styles.pending}>
          {ORBIT_WAITLIST_NOTE} {ORBIT_ANNUAL_NOTE}
        </p>

        {/* --- Bespoke line (bottom of the standalone section) --- */}
        <div data-reveal="" className={`glass ${styles.bespoke}`}>
          <p>
            <strong>Larger or unusual builds are a conversation.</strong> Tell Sage what you need in
            the scan, or book the walkthrough.
          </p>
          <Link href="/catalyst" className="btn btn-secondary btn-md">
            Run the Catalyst scan →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AfterYouPayTimeline (brief 5). Calm, stepped, reduced-motion
   safe. The 90-day clock starts ONLY when systems are live and
   confirmed in writing.
   ============================================================ */
interface Step {
  tag: string;
  title: string;
  text: string;
  highlight?: boolean;
}

const STEPS: Step[] = [
  {
    tag: "Day 0",
    title: "Payment and access request",
    text: "You subscribe. We send one clear request for the access we need to start building.",
  },
  {
    tag: "Day 1 to 3",
    title: "Access collected",
    text: "You hand over the logins and connections. We confirm in writing exactly what we have received.",
  },
  {
    tag: "Week 1",
    title: "Core systems configured",
    text: "We build and wire the systems your diagnostic prioritised into your business, not bolted on beside it.",
  },
  {
    tag: "Week 2",
    title: "First systems tested",
    text: "We run them live, check they behave against real traffic, and fix anything that does not.",
  },
  {
    tag: "Active Campaign, Day 1",
    title: "The 90-day clock starts",
    text: "It starts only when your systems are live and confirmed in writing. Not the day you paid. Not before.",
    highlight: true,
  },
  {
    tag: "Day 90",
    title: "Proof review",
    text: "We measure against the baseline taken at install and show you, honestly, what moved.",
  },
];

export function AfterYouPayTimeline() {
  return (
    <section id="after-you-pay" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">After you pay</div>
          <h2 className="h2">Your first 14 days, and the clock that actually counts.</h2>
          <p className="lead">
            No mystery, no meter running before anything works. Here is exactly what happens from
            the moment you subscribe.
          </p>
        </div>

        <div className={styles.timeline} data-reveal="">
          {STEPS.map((s) => (
            <div key={s.tag} className={`${styles.step}${s.highlight ? " " + styles.highlight : ""}`}>
              <div className={styles.rail}>
                <span className={styles.tag}>{s.tag}</span>
                <span className={styles.node} aria-hidden="true" />
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.guarantee} data-reveal="">
          <p className={styles.gt}>Up to 3 months free continuation</p>
          <p>
            If the outcomes we committed to are not delivered by the Day 90 review, we keep working
            at no extra cost for up to three more months. The clock stays honest, and so do we.
          </p>
        </div>
      </div>
    </section>
  );
}
