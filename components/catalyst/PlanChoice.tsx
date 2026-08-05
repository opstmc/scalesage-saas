"use client";

import { useId } from "react";
import {
  BOLT_ON_OPTIONS,
  EMPTY_SELECTION,
  PLANS,
  boltOnByItem,
  includedInPlan,
  planByKey,
  type BoltOnRecommendation,
  type PlanKey,
  type PlanSelection,
} from "./recommendation";
import styles from "./catalyst.module.css";

export { EMPTY_SELECTION, type PlanSelection } from "./recommendation";

/**
 * The plan and add-on chooser.
 *
 * Decision (04 August review): "Subscription/bolt-on selection stays with the
 * user. Catalyst can recommend and upsell, but the user makes the final plan and
 * bolt-on choice, never auto-selected by the agent."
 *
 * So the contract of this component is blunt:
 *
 *  - It renders a RECOMMENDATION (a badge, and the reason where the findings
 *    support one) and a SELECTION (what the visitor has actually picked). They
 *    are never the same thing and they never seed each other.
 *  - It ships with nothing selected. `EMPTY_SELECTION` is the only starting
 *    state, no radio is checked, no checkbox is ticked, and the caller's action
 *    button stays off until the visitor picks something themselves.
 *  - Picking against the recommendation costs nothing: same one tap, no warning,
 *    no "are you sure", no line that makes the cheaper plan sound like a
 *    character flaw. Pressure closes and shame framing are banned outright
 *    (scalesage-agents src/agents/_shared/canon.md), and a screen that sells is
 *    exactly where they creep in.
 *  - The only thing selecting a plan ever REMOVES is an add-on that plan already
 *    includes, so nobody is shown as buying what they already have.
 *
 * Native radios and checkboxes, deliberately: real keyboard and screen-reader
 * semantics beat hand-rolled ARIA on a screen that takes money.
 */

export default function PlanChoice({
  recommendedPlan,
  reason,
  recommendedBoltOns = [],
  value,
  onChange,
  heading = "Choose your plan",
}: {
  /** What Sage suggests. Highlighted only; never written into `value`. */
  recommendedPlan: PlanKey | null;
  /** Why, in the visitor's own findings. Omitted when nothing supports one. */
  reason?: string | null;
  recommendedBoltOns?: BoltOnRecommendation[];
  value: PlanSelection;
  onChange: (next: PlanSelection) => void;
  heading?: string;
}) {
  const uid = useId();
  const recSet = new Map(recommendedBoltOns.map((r) => [r.item, r.reason]));

  const choosePlan = (key: PlanKey) => {
    // Drop any add-on that plan already includes. This is the one and only edit
    // a plan choice makes to the add-on list, and it can only ever remove.
    const kept = value.boltOns.filter((item) => {
      const bolt = boltOnByItem(item);
      return bolt ? !includedInPlan(bolt, key) : true;
    });
    onChange({ plan: key, boltOns: kept });
  };

  const toggleBoltOn = (item: string) => {
    const has = value.boltOns.includes(item);
    onChange({
      ...value,
      boltOns: has ? value.boltOns.filter((b) => b !== item) : [...value.boltOns, item],
    });
  };

  const chosen = planByKey(value.plan);
  const recommended = planByKey(recommendedPlan);
  const suggested = BOLT_ON_OPTIONS.filter((b) => recSet.has(b.item));
  const rest = BOLT_ON_OPTIONS.filter((b) => !recSet.has(b.item));

  return (
    <div className={`glass ${styles.block}`}>
      <div className={styles.blockHead}>
        <span className={styles.blockLabel}>{heading}</span>
      </div>
      <p className={styles.chooseIntro}>
        {recommended
          ? `Sage suggests ${recommended.name}. That is a suggestion, not a selection: nothing here is picked, ticked or added until you do it, and every plan stays open.`
          : "Nothing here is picked, ticked or added until you do it."}
      </p>

      <fieldset className={styles.planSet}>
        <legend className={styles.visuallyHidden}>Choose your plan</legend>
        <div className={styles.planGrid}>
          {PLANS.map((p) => {
            const isRec = recommendedPlan === p.key;
            const selected = value.plan === p.key;
            return (
              <label
                key={p.key}
                className={`${styles.planCard} ${selected ? styles.planCardSel : ""} ${
                  isRec ? styles.planCardRec : ""
                }`}
              >
                <input
                  type="radio"
                  name={`${uid}-plan`}
                  className={styles.visuallyHidden}
                  value={p.key}
                  checked={selected}
                  onChange={() => choosePlan(p.key)}
                />
                <span className={styles.planTop}>
                  <span className={styles.planName}>{p.name}</span>
                  <span className={`${styles.tick} ${selected ? styles.tickSel : ""}`} aria-hidden="true" />
                </span>

                <span className={styles.planBadges}>
                  {isRec && <span className={styles.recBadge}>Sage suggests this</span>}
                  {p.waitlist && <span className={styles.waitBadge}>Waitlist only</span>}
                </span>

                <span className={styles.planPriceRow}>
                  <span className={styles.planPrice}>{p.price}</span>
                  <span className={styles.planPer}>/mo</span>
                </span>
                <span className={styles.planSetup}>plus {p.setup}</span>
                <span className={styles.planBest}>{p.bestFor}</span>

                {isRec && reason && (
                  <span className={styles.recReason}>
                    <span className={styles.recReasonLabel}>Why Sage suggests it: </span>
                    {reason}
                  </span>
                )}

                {p.waitlist && p.waitlistNote && <span className={styles.planNote}>{p.waitlistNote}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ---- add-ons: optional in both directions ---- */}
      <div className={styles.boltWrap}>
        <div className={styles.blockLabel} style={{ marginBottom: 6 }}>
          Add-ons
        </div>
        <p className={styles.chooseIntro} style={{ marginBottom: 12 }}>
          {suggested.length > 0
            ? "These are the add-ons your findings point at. None of them is added unless you add it, and a plan on its own is a complete answer."
            : "Optional extras. None of them is added unless you add it."}
        </p>

        {suggested.length > 0 && (
          <div className={styles.boltList}>
            {suggested.map((b) => (
              <BoltOnRow
                key={b.item}
                item={b.item}
                standalone={b.standalone}
                subscriber={b.subscriber}
                note={b.note}
                includedAt={b.includedAt}
                reason={recSet.get(b.item) ?? null}
                recommended
                plan={value.plan}
                checked={value.boltOns.includes(b.item)}
                onToggle={() => toggleBoltOn(b.item)}
              />
            ))}
          </div>
        )}

        <details className={styles.boltMore}>
          <summary className={styles.boltSummary}>
            {suggested.length > 0 ? "See every other add-on" : "See every add-on"}
          </summary>
          <div className={styles.boltList} style={{ marginTop: 12 }}>
            {rest.map((b) => (
              <BoltOnRow
                key={b.item}
                item={b.item}
                standalone={b.standalone}
                subscriber={b.subscriber}
                note={b.note}
                includedAt={b.includedAt}
                reason={null}
                recommended={false}
                plan={value.plan}
                checked={value.boltOns.includes(b.item)}
                onToggle={() => toggleBoltOn(b.item)}
              />
            ))}
          </div>
        </details>
      </div>

      {/* ---- what they have actually chosen, stated flat ---- */}
      <div className={styles.choiceSummary}>
        <span className={styles.choiceText}>
          {chosen ? (
            <>
              <b>Your choice:</b> {chosen.name}
              {value.boltOns.length > 0 ? `, plus ${listSentence(value.boltOns)}` : ""}.
            </>
          ) : (
            <>Nothing chosen yet. Pick a plan when you are ready.</>
          )}
        </span>
        {(value.plan || value.boltOns.length > 0) && (
          <button
            type="button"
            className={styles.clearChoice}
            onClick={() => onChange({ ...EMPTY_SELECTION })}
          >
            Clear my choice
          </button>
        )}
      </div>
    </div>
  );
}

/** "a, b and c" — no Oxford comma, British house style. */
function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function BoltOnRow({
  item,
  standalone,
  subscriber,
  note,
  includedAt,
  reason,
  recommended,
  plan,
  checked,
  onToggle,
}: {
  item: string;
  standalone: string;
  subscriber: string;
  note: string | null;
  includedAt: string[];
  reason: string | null;
  recommended: boolean;
  plan: PlanKey | null;
  checked: boolean;
  onToggle: () => void;
}) {
  const bolt = boltOnByItem(item);
  const included = bolt ? includedInPlan(bolt, plan) : false;
  const planName = planByKey(plan)?.name ?? "";

  if (included) {
    // Already theirs at the plan they picked. Shown, so the list does not appear
    // to lose rows, but not sellable and not tickable.
    return (
      <div className={`${styles.boltRow} ${styles.boltRowIncluded}`}>
        <span className={styles.boltName}>{item}</span>
        <span className={styles.boltIncluded}>Already in {planName}</span>
      </div>
    );
  }

  return (
    <label className={`${styles.boltRow} ${checked ? styles.boltRowSel : ""}`}>
      <input type="checkbox" className={styles.boltBox} checked={checked} onChange={onToggle} />
      <span className={styles.boltBody}>
        <span className={styles.boltHead}>
          <span className={styles.boltName}>{item}</span>
          {recommended && <span className={styles.recBadgeSmall}>Sage suggests this</span>}
        </span>
        {/* No period is appended to either figure. Some add-ons are monthly and
            some are one-off builds, and lib/offer.ts does not say which, so the
            page states the numbers it has and invents nothing around them. */}
        <span className={styles.boltPrice}>
          {subscriber} on a plan · {standalone} on its own
        </span>
        {reason && <span className={styles.boltReason}>{reason}</span>}
        {note && <span className={styles.boltNote}>{note}</span>}
        {includedAt.length > 0 && (
          <span className={styles.boltNote}>Already included in {listSentence(includedAt)}.</span>
        )}
      </span>
    </label>
  );
}
