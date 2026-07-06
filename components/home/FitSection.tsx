/**
 * "Great fit / Not right fit" (brief §3 / item 5). Two glass panels that make
 * ScaleSage look selective, which reads as premium. This is about who we take
 * on, separate from Sage declining a scan inside the diagnostic itself.
 * Server component: static, revealed on scroll via [data-reveal].
 */

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="var(--accent-primary)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none", marginTop: 2 }}
    >
      <path d="M3.5 9.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="var(--text-faint)"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none", marginTop: 2 }}
    >
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
    </svg>
  );
}

// Copy: JW to approve.
const GREAT_FIT = [
  "A real business with a real offer",
  "Leaking on capture, follow-up, reviews, retention or visibility",
  "Willing to give access to the systems we need",
  "Responds to the leads and customers we recover",
  "Wants a system that runs, not a magic button",
];

const NOT_FIT = [
  "Wants guaranteed revenue or invented results",
  "Will not give access to the tools we need",
  "Cannot respond to the leads we recover",
  "Wants spam, fake reviews or vanity metrics",
];

function Panel({
  kicker,
  title,
  items,
  positive,
}: {
  kicker: string;
  title: string;
  items: string[];
  positive: boolean;
}) {
  return (
    <div
      data-reveal=""
      className="glass"
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        borderColor: positive ? "var(--border-subtle)" : "var(--border-hair)",
      }}
    >
      <div
        className="eyebrow"
        style={{
          margin: 0,
          color: positive ? "var(--accent-primary)" : "var(--text-faint)",
        }}
      >
        {kicker}
      </div>
      <h3 className="h3" style={{ margin: "12px 0 24px" }}>
        {title}
      </h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              display: "flex",
              gap: 12,
              fontSize: 15.5,
              lineHeight: 1.5,
              color: positive ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {positive ? <CheckIcon /> : <CrossIcon />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FitSection() {
  return (
    <section className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Fit</div>
          <h2 className="h2">We only take work we can prove.</h2>
          <p className="lead">
            The discipline that makes the numbers real starts with who we say yes to.
            Here is where we do our best work, and where we are not the right call.
          </p>
        </div>
        <div className="grid-2">
          <Panel
            kicker="Great fit"
            title="We can move the number for you."
            items={GREAT_FIT}
            positive
          />
          <Panel
            kicker="Not right fit"
            title="We will point you elsewhere."
            items={NOT_FIT}
            positive={false}
          />
        </div>
      </div>
    </section>
  );
}
