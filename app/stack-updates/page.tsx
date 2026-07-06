import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import { ENTRIES } from "./entries";

// COPY: JW to approve.
export const metadata: Metadata = {
  title: "Stack Updates",
  description:
    "A plain, dated record of what ScaleSage shipped and upgraded. The proof artifact behind the Improve promise. Real entries only, no roadmap theatre.",
  alternates: { canonical: "/stack-updates" },
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

export default function StackUpdatesPage() {
  return (
    <main id="top" className="subpage">
      <section id="stack-updates" className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Stack Updates</div>
          <h1 className="h1" style={{ marginBottom: 18 }}>
            What we shipped, and <span className="accent-em">when</span>.
          </h1>
          <p className="lead">
            A plain, dated record of what we built and upgraded. This is the proof artifact behind the
            Improve promise: if we say we keep making your systems better, this is where you check.
            Real entries only. No roadmap theatre, no vanity metrics.
          </p>
        </div>

        {/* Changelog. Newest first. JW appends real entries in ./entries.ts. */}
        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            maxWidth: 820,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {ENTRIES.map((e) => (
            <li
              key={`${e.date}-${e.tag}`}
              data-reveal=""
              className="glass"
              style={{
                padding: "26px 28px",
                borderLeft: e.launch ? "2px solid var(--accent-primary)" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <time
                  dateTime={e.date}
                  style={{ fontSize: 13, color: "var(--text-faint)", letterSpacing: ".01em" }}
                >
                  {e.dateLabel}
                </time>
                <span
                  style={{
                    fontSize: 11.5,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: e.launch ? "var(--on-accent)" : "var(--accent-primary)",
                    background: e.launch ? "var(--accent-primary)" : "transparent",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 16,
                    padding: "3px 11px",
                  }}
                >
                  {e.tag}
                </span>
              </div>

              <h2 className="h3" style={{ fontSize: 20, marginBottom: 10 }}>
                {e.title}
              </h2>
              <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
                {e.body}
              </p>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {e.items.map((it) => (
                  <li key={it} style={{ display: "flex", gap: 12, fontSize: 14.5, color: "var(--text-primary)", lineHeight: 1.55 }}>
                    <Diamond />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className="small" data-reveal="" style={{ maxWidth: 820, marginTop: 28, color: "var(--text-faint)", lineHeight: 1.6 }}>
          We log real, dated entries here as we ship, nothing invented to pad the list. Founding-stage
          client results publish from Q3 2026.
        </p>
      </section>

      <FinalCta />
    </main>
  );
}
