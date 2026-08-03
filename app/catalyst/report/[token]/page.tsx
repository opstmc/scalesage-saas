"use client";

/**
 * Public, print-friendly Catalyst report page.
 *
 * A prospect follows a secret token link from their email to read their
 * finished 24h Catalyst report. Graceful by design: the fetch client never
 * throws, and every array/field below is guarded so a null or partial report
 * can never crash the page.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getReport,
  payReport,
  type CatalystReport,
  type FullReport,
  type LeakDiscipline,
  type LeakTotal,
  type RankedLeak,
} from "@/lib/report";
import styles from "./report.module.css";

/* ---------- small style helpers (inline, CSS-var driven, like the catalyst screens) ---------- */

const PAGE: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  padding: "48px 20px 96px",
};

const COLUMN: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
};

const CARD: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-hair)",
  borderRadius: 16,
  padding: "20px 22px",
};

const SECTION_GAP: React.CSSProperties = { marginTop: 40 };

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

/* ---------- shell (calm centred states share this frame) ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={PAGE}>
      <div style={COLUMN}>{children}</div>
    </main>
  );
}

function CalmState({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Shell>
      <div style={{ ...CARD, textAlign: "center", padding: "48px 26px" }}>
        <span className="eyebrow" style={{ display: "block" }}>
          {eyebrow}
        </span>
        <h1 className="h2" style={{ margin: "0 0 12px" }}>
          {title}
        </h1>
        <p className="lead" style={{ maxWidth: 480, margin: "0 auto" }}>
          {body}
        </p>
      </div>
    </Shell>
  );
}

/* ---------- priced leaks ---------- */

/**
 * Pence to British money: 240000 becomes "£2,400". Returns null for anything
 * that is not a real, positive figure, so raw pence can never reach the page.
 */
function fmtPence(pence: number | undefined): string | null {
  if (typeof pence !== "number" || !Number.isFinite(pence) || pence <= 0) return null;
  const pounds = pence / 100;
  const whole = Math.abs(pounds - Math.round(pounds)) < 0.005;
  const digits = whole ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(pounds);
  } catch {
    return "£" + (whole ? Math.round(pounds).toLocaleString("en-GB") : pounds.toFixed(2));
  }
}

/** "their" = the client's own numbers. "bench" = modelled. "mixed" = some of each. */
type BasisKind = "their" | "bench" | "mixed";

const MATURITY_LABEL: Record<string, string> = {
  potential: "Not confirmed yet",
  validated: "Confirmed with you",
  recoverable: "Ready to recover",
};

function maturityLabel(v: string | undefined): string | null {
  if (!v) return null;
  return MATURITY_LABEL[v.trim().toLowerCase()] ?? v;
}

/**
 * The share of the total that came from the client, in plain English.
 * At zero it says so outright: a figure modelled end to end is a much weaker
 * claim than one built from their books, and burying that would be dishonest.
 */
function confidenceSentence(c: number): string {
  const pct = Math.round(Math.min(1, Math.max(0, c)) * 100);
  const rest = "The rest is estimated from averages for businesses like yours.";
  if (pct <= 0) {
    return (
      "None of this total comes from your own numbers. All of it is estimated from averages " +
      "for businesses like yours, so treat it as a starting point rather than a measurement."
    );
  }
  if (pct >= 100) return "All of this total is built from figures you gave us.";
  if (pct < 13) {
    return (
      "Only a small part of this total comes from figures you gave us. Almost all of it is " +
      "estimated from averages for businesses like yours."
    );
  }
  if (pct < 38) return "About a quarter of this total comes from figures you gave us. " + rest;
  if (pct < 63) return "About half of this total comes from figures you gave us. " + rest;
  if (pct < 88) return "About three quarters of this total comes from figures you gave us. " + rest;
  return (
    "Almost all of this total comes from figures you gave us. A small part is estimated from " +
    "averages for businesses like yours."
  );
}

/** The basis mix as a count, and only when it really is a count. */
function mixSentence(mix: LeakTotal["basis_mix"]): string | null {
  if (!mix) return null;
  const theirs = mix.their_number;
  const bench = mix.benchmark;
  if (!Number.isInteger(theirs) || !Number.isInteger(bench)) return null;
  if (theirs < 0 || bench < 0) return null;
  const total = theirs + bench;
  if (total < 1) return null;
  if (total === 1) {
    return bench === 0
      ? "The one figure below came from your own numbers."
      : "The one figure below is estimated from sector averages.";
  }
  if (bench === 0) return `All ${total} figures below came from your own numbers.`;
  if (theirs === 0) return `All ${total} figures below are estimated from sector averages.`;
  return `${theirs} of the ${total} figures below came from your own numbers, ${bench} from sector averages.`;
}

function BasisTag({ kind, label }: { kind: BasisKind; label: string }) {
  const tone =
    kind === "their" ? styles.basisTheir : kind === "bench" ? styles.basisBench : styles.basisMixed;
  const dotTone =
    kind === "their" ? styles.dotTheir : kind === "bench" ? styles.dotBench : styles.dotMixed;
  return (
    <span className={`${styles.basis} ${tone}`}>
      <span aria-hidden="true" className={`${styles.dot} ${dotTone}`} />
      {label}
    </span>
  );
}

/**
 * One leak's monthly figure, its basis and its workings.
 *
 * Renders nothing at all when the report predates priced leaks, which keeps
 * every older report looking exactly as it always has.
 */
function LeakPrice({ leak }: { leak: RankedLeak }) {
  const money = fmtPence(leak.monthly_pence);
  const inputs = Array.isArray(leak.inputs_used) ? leak.inputs_used.filter(Boolean) : [];
  const workings = leak.workings?.trim() || "";
  if (!money && !workings && inputs.length === 0) return null;

  const theirs = leak.basis === "their_number";
  // Unstated basis is treated as the weaker claim on purpose. We would rather
  // under-claim a figure than dress a model up as the client's own books.
  const label = theirs ? "From your numbers" : leak.basis === "benchmark" ? "Sector estimate" : "Estimate";
  const maturity = maturityLabel(leak.maturity);

  return (
    <div
      className={`${styles.priceBlock} ${theirs ? styles.priceBlockTheir : styles.priceBlockBench}`}
    >
      {money && (
        <div className={styles.figureRow}>
          <span className={`${styles.figure} ${theirs ? styles.figureTheir : styles.figureBench}`}>
            {money}
            <span className={styles.per}>/month</span>
          </span>
          <BasisTag kind={theirs ? "their" : "bench"} label={label} />
          {maturity && <span className={styles.maturity}>{maturity}</span>}
        </div>
      )}
      {workings && (
        <p className={styles.workings}>
          <span className={styles.workingsLabel}>How we get there: </span>
          {workings}
        </p>
      )}
      {inputs.length > 0 && (
        <p className={styles.inputs}>{"What we used: " + inputs.join(", ")}</p>
      )}
    </div>
  );
}

const TOTAL_LABEL: Record<BasisKind, string> = {
  their: "From your numbers",
  bench: "Sector estimate",
  mixed: "Part your numbers, part estimate",
};

/**
 * The priced leaks added up, with how much of it came from the client, and the
 * two honesty notes. It sits at the top of the leaks section so the number and
 * its caveats are read together, never a scroll apart.
 */
function LeakSummary({
  total,
  discipline,
}: {
  total: LeakTotal | undefined;
  discipline: LeakDiscipline | undefined;
}) {
  const money = total ? fmtPence(total.monthly_pence) : null;
  const conf = total?.confidence_their_numbers;
  const mix = mixSentence(total?.basis_mix);
  const stand = maturityLabel(discipline?.maturity);
  const disclaimer = discipline?.disclaimer?.trim() || "";
  const marginNote = discipline?.margin_note?.trim() || "";
  const hasNotes = Boolean(stand || disclaimer || marginNote);
  if (!money && !mix && !hasNotes) return null;

  const kind: BasisKind =
    conf === undefined ? "mixed" : conf >= 0.999 ? "their" : conf <= 0.001 ? "bench" : "mixed";
  const figureTone =
    kind === "their" ? styles.figureTheir : kind === "bench" ? styles.figureBench : styles.figureNeutral;

  return (
    <div className={styles.totalCard}>
      {money && (
        <>
          <span className={styles.totalLabel}>What this adds up to</span>
          <div className={styles.figureRow}>
            <span className={`${styles.figure} ${styles.totalFigure} ${figureTone}`}>
              {money}
              <span className={styles.totalPer}>/month</span>
            </span>
            {conf !== undefined && <BasisTag kind={kind} label={TOTAL_LABEL[kind]} />}
          </div>
        </>
      )}
      {conf !== undefined && <p className={styles.confidence}>{confidenceSentence(conf)}</p>}
      {mix && <p className={styles.mix}>{mix}</p>}
      {hasNotes && (
        <div className={styles.notes}>
          {stand && (
            <p className={styles.note}>
              <span className={styles.noteStrong}>Where these figures stand: </span>
              {stand}
            </p>
          )}
          {disclaimer && <p className={styles.note}>{disclaimer}</p>}
          {marginNote && <p className={styles.note}>{marginNote}</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- report sections ---------- */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="h3" style={{ marginBottom: 16, color: "var(--text-headline)" }}>
      {children}
    </h2>
  );
}

function Leaks({ report }: { report: FullReport }) {
  const leaks = Array.isArray(report.leaks_ranked) ? report.leaks_ranked : [];
  const hasSummary = Boolean(report.leak_total || report.leak_discipline);
  if (leaks.length === 0 && !hasSummary) return null;
  return (
    <section style={SECTION_GAP}>
      {/* JW-approval-pending */}
      <SectionHeading>Where you&rsquo;re leaking</SectionHeading>
      <LeakSummary total={report.leak_total} discipline={report.leak_discipline} />
      <div style={{ display: "grid", gap: 12 }}>
        {leaks.map((leak, i) => (
          <div key={i} style={CARD}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--accent-primary)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {leak.title && (
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text-headline)",
                    }}
                  >
                    {leak.title}
                  </h3>
                )}
                {leak.detail && (
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-primary)" }}>
                    {leak.detail}
                  </p>
                )}
                {leak.source && (
                  <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--text-muted)" }}>
                    Source: {leak.source}
                  </p>
                )}
                <LeakPrice leak={leak} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BuildPlan({ report }: { report: FullReport }) {
  const steps = Array.isArray(report.build_plan) ? report.build_plan : [];
  if (steps.length === 0) return null;
  return (
    <section style={SECTION_GAP}>
      {/* JW-approval-pending */}
      <SectionHeading>What we would build</SectionHeading>
      <div style={{ display: "grid", gap: 12 }}>
        {steps.map((step, i) => {
          const heading = step.title || step.system || "";
          if (!heading && !step.detail) return null;
          return (
            <div key={i} style={CARD}>
              {heading && (
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--text-headline)",
                  }}
                >
                  {heading}
                </h3>
              )}
              {step.detail && (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-primary)" }}>
                  {step.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Checked({ report }: { report: FullReport }) {
  const facts = Array.isArray(report.checked) ? report.checked : [];
  if (facts.length === 0) return null;
  return (
    <section style={SECTION_GAP}>
      {/* JW-approval-pending */}
      <SectionHeading>What we checked</SectionHeading>
      <div style={CARD}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {facts.map((f, i) => {
            if (!f.area && !f.fact) return null;
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 14.5,
                  lineHeight: 1.5,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    marginTop: 8,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                  }}
                />
                <span>
                  {f.area && (
                    <span style={{ fontWeight: 600, color: "var(--text-headline)" }}>{f.area}: </span>
                  )}
                  <span style={{ color: "var(--text-primary)" }}>{f.fact}</span>
                  {f.source && (
                    <span style={{ color: "var(--text-muted)" }}> ({f.source})</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function RecommendationBlock({ report }: { report: FullReport }) {
  const rec = report.recommendation ?? {};
  if (!rec.tier && !rec.why && !rec.next_step) return null;
  return (
    <section style={SECTION_GAP}>
      {/* JW-approval-pending */}
      <SectionHeading>Our recommendation</SectionHeading>
      <div
        style={{
          ...CARD,
          borderColor: "color-mix(in srgb, var(--accent-primary) 40%, transparent)",
        }}
      >
        {rec.tier && (
          <div
            style={{
              display: "inline-block",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".04em",
              color: "var(--accent-primary)",
              marginBottom: 12,
            }}
          >
            Recommended plan: {rec.tier}
          </div>
        )}
        {rec.why && (
          <p style={{ margin: "0 0 12px", fontSize: 15.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
            {rec.why}
          </p>
        )}
        {rec.next_step && (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)" }}>
            <span style={{ fontWeight: 600, color: "var(--text-headline)" }}>Next step: </span>
            {rec.next_step}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- the two doors (mirror UnlockForm's visual) ---------- */

function Doors({
  token,
  tier,
  bookingUrl,
}: {
  token: string;
  tier: string | null;
  bookingUrl: string | null;
}) {
  const [payState, setPayState] = useState<"idle" | "opening" | "deferred">("idle");

  const startBuild = async () => {
    setPayState("opening");
    const res = await payReport(token, tier ?? undefined);
    if (res.checkout_url) {
      window.location.href = res.checkout_url;
      return;
    }
    // Stripe may be stubbed and return null. That is expected. Handle calmly.
    setPayState("deferred");
  };

  return (
    <section style={{ ...SECTION_GAP, display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
      <div
        style={{
          ...CARD,
          display: "grid",
          gap: 12,
          borderColor: "color-mix(in srgb, var(--accent-primary) 45%, transparent)",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-headline)" }}>
          Start the build
        </span>
        {/* JW-approval-pending */}
        <span style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
          Put us to work on your primary leak. We will schedule your kickoff as soon as you are in.
        </span>
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={startBuild}
          disabled={payState === "opening"}
          style={{ justifySelf: "start" }}
        >
          {payState === "opening" ? "Opening checkout…" : "Start the build"}
        </button>
        {payState === "deferred" && (
          // No fake payment. Stripe may not be wired yet. JW-approval-pending.
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-muted)" }}>
            We&rsquo;ll send your secure payment link shortly.
          </p>
        )}
      </div>

      <div style={{ ...CARD, display: "grid", gap: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-headline)" }}>
          Talk it through first
        </span>
        {/* JW-approval-pending */}
        <span style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
          Rather walk the report through with a human first? Start here and we&rsquo;ll take it from there.
        </span>
        <a
          href={bookingUrl || "/catalyst"}
          {...(bookingUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="btn btn-secondary btn-md"
          style={{ justifySelf: "start", textDecoration: "none" }}
        >
          Book a call
        </a>
      </div>
    </section>
  );
}

/* ---------- complete report ---------- */

// The Stripe checkout redirects back here with ?payment=success|cancel. Without
// this the payer just lands back on their report with no acknowledgement, which
// reads as "did my payment even work?". Read the param client-side (avoids the
// useSearchParams/Suspense dance) and show a plain confirmation.
function PaymentBanner({ kind }: { kind: "success" | "cancel" | null }) {
  if (!kind) return null;
  const success = kind === "success";
  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        border: `1px solid ${
          success
            ? "color-mix(in srgb, var(--accent-primary) 45%, transparent)"
            : "var(--border-hair)"
        }`,
        background: success
          ? "color-mix(in srgb, var(--accent-primary) 8%, transparent)"
          : "var(--bg-elevated)",
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 24,
      }}
    >
      <span aria-hidden style={{ fontSize: 18, lineHeight: "24px" }}>
        {success ? "✓" : "↩"}
      </span>
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>
          {success ? "Payment received — we’re on it." : "Payment cancelled — no charge was made."}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
          {success
            ? "Thanks — your build is booked. We’ll be in touch shortly to schedule your kickoff."
            : "No problem. You can start the build whenever you’re ready, using the button below."}
        </p>
      </div>
    </div>
  );
}

function CompleteReport({ data, token }: { data: CatalystReport; token: string }) {
  const report = data.report;
  const generated = fmtDate(data.generated_at ?? report?.meta?.generated_at ?? null);
  const title = data.business_name?.trim() || "Your business";

  const [payment, setPayment] = useState<"success" | "cancel" | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("payment");
    setPayment(p === "success" ? "success" : p === "cancel" ? "cancel" : null);
  }, []);

  return (
    <Shell>
      <PaymentBanner kind={payment} />
      <header>
        <span className="eyebrow" style={{ display: "block" }}>
          YOUR CATALYST REPORT
        </span>
        <h1 className="h1" style={{ margin: "0 0 10px" }}>
          {title}
        </h1>
        {generated && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            Generated {generated}
          </p>
        )}
        {/* report.meta is engineering telemetry only — synthesis provenance,
            engine/config versions, per-section health. Nothing in it is written
            for a customer, so nothing from it is rendered here. */}
      </header>

      {report ? (
        <>
          <Leaks report={report} />
          <BuildPlan report={report} />
          <Checked report={report} />
          <RecommendationBlock report={report} />
          <Doors
            token={token}
            tier={data.tier ?? report.recommendation?.tier ?? null}
            bookingUrl={data.booking_url}
          />
        </>
      ) : (
        <p className="lead" style={{ marginTop: 32 }}>
          Your report is ready. Some details are still coming through. Please refresh in a moment.
        </p>
      )}
    </Shell>
  );
}

/* ---------- page ---------- */

export default function CatalystReportPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token ?? "";

  const [state, setState] = useState<"loading" | "ready">("loading");
  const [data, setData] = useState<CatalystReport | null>(null);

  useEffect(() => {
    let active = true;
    setState("loading");
    getReport(token).then((res) => {
      if (!active) return;
      setData(res);
      setState("ready");
    });
    return () => {
      active = false;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <CalmState
        eyebrow="YOUR CATALYST REPORT"
        title="Loading your report…"
        body="One moment while we bring up your Catalyst report."
      />
    );
  }

  const status = data?.status ?? "not_found";

  if (status === "pending") {
    return (
      <CalmState
        eyebrow="YOUR CATALYST REPORT"
        title="Your report is being prepared"
        // JW-approval-pending
        body="Your full report is being prepared. We'll email you the moment it's ready."
      />
    );
  }

  if (status === "not_found" || !data) {
    return (
      <CalmState
        eyebrow="CATALYST REPORT"
        title="This link isn't valid"
        // JW-approval-pending
        body="This report link isn't valid or has expired. If you think this is a mistake, reply to your Catalyst email and we'll sort it out."
      />
    );
  }

  return <CompleteReport data={data} token={token} />;
}
