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
} from "@/lib/report";

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
  if (leaks.length === 0) return null;
  return (
    <section style={SECTION_GAP}>
      {/* JW-approval-pending */}
      <SectionHeading>Where you&rsquo;re leaking</SectionHeading>
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
              <div style={{ flex: 1 }}>
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

function CompleteReport({ data, token }: { data: CatalystReport; token: string }) {
  const report = data.report;
  const generated = fmtDate(data.generated_at ?? report?.meta?.generated_at ?? null);
  const title = data.business_name?.trim() || "Your business";

  return (
    <Shell>
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
        {report?.meta?.synthesis && (
          <p className="lead" style={{ marginTop: 18 }}>
            {report.meta.synthesis}
          </p>
        )}
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
