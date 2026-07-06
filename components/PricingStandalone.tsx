import Link from "next/link";
import styles from "./PricingStandalone.module.css";

/* ============================================================
   FIGURES: quoted from Partner Pack v5 via the build brief.
   Copied, never retyped. Do NOT add prices not in the pack.
   FLAG FOR JW: whole table pending final reconciliation
   against Partner Pack v5 (setup fees / founding terms not
   supplied for this build, so none shown, none invented).
   ============================================================ */
interface DualItem {
  item: string;
  standalone: string;
  subscriber: string;
  saving: string;
}

const DUAL: DualItem[] = [
  { item: "LinkedIn outreach", standalone: "£397", subscriber: "£197", saving: "£200" },
  { item: "Voice AI agent", standalone: "£197", subscriber: "£97", saving: "£100" },
  { item: "Website build", standalone: "£1,797", subscriber: "£997", saving: "£800" },
  { item: "Landing page", standalone: "£697", subscriber: "£397", saving: "£300" },
  { item: "Explainer video", standalone: "£1,497", subscriber: "£797", saving: "£700" },
  { item: "Pitch deck", standalone: "£897", subscriber: "£497", saving: "£400" },
  { item: "Missed-call SMS bot", standalone: "£67/mo", subscriber: "£47/mo", saving: "£20/mo" },
];

interface OrbitTier {
  name: string;
  price: string;
  freeWith: string;
  note?: string;
  flagship?: string;
}

const ORBIT: OrbitTier[] = [
  { name: "Orbit Solo", price: "£97/mo standalone", freeWith: "Starter" },
  { name: "Orbit Pro", price: "£297/mo standalone", freeWith: "Pro" },
  {
    name: "Orbit Premium",
    price: "£597/mo standalone",
    freeWith: "Max",
    flagship: "Frontier live monitoring",
  },
];

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
              Standalone build and bolt-on prices compared with subscriber prices. Figures pending
              final reconciliation against Partner Pack v5.
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
                  <td className={styles.item}>{r.item}</td>
                  <td className={`${styles.num} ${styles.standalonePrice}`}>{r.standalone}</td>
                  <td className={`${styles.num} ${styles.subPrice}`}>{r.subscriber}</td>
                  <td className={`${styles.num} ${styles.saving}`}>{r.saving}</td>
                </tr>
              ))}
              {/* Frontier Visibility: subscription-only, included in every tier */}
              <tr className={styles.subOnlyRow}>
                <td className={styles.item}>Frontier Visibility</td>
                <td colSpan={3} className={styles.subOnlyNote}>
                  <span className={styles.flag}>Subscription-only.</span> Included in every tier,
                  not sold as a one-off. Live AI-search and reputation visibility is a reason to
                  subscribe, not a box to buy once.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* PENDING FLAG: surfaced visibly + flagged for JW */}
        <p className={styles.pending}>
          Figures pending final reconciliation against Partner Pack v5.
        </p>

        {/* --- Orbit access tiers (reference) --- */}
        <div className="section-head" data-reveal="" style={{ marginTop: 56, marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Orbit access, for reference</div>
          <p className="lead">
            Orbit is the access layer. Each tier is priced standalone, and comes free with the
            matching subscription. Frontier live monitoring is the Orbit Premium flagship.
          </p>
        </div>
        <div className={styles.orbitGrid}>
          {ORBIT.map((o) => (
            <div key={o.name} data-reveal="" className={`glass glass-hover ${styles.orbitCard}`}>
              <div className={styles.orbitName}>{o.name}</div>
              <div className={styles.orbitPrice}>{o.price}</div>
              <div className={styles.orbitFree}>
                Free with <span className="accent">{o.freeWith}</span>
              </div>
              {o.flagship && <span className={styles.orbitFlagship}>{o.flagship}</span>}
            </div>
          ))}
        </div>

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
