/**
 * The Improve strip (brief §4 / item 6) — the fourth beat under the locked
 * "Diagnose. Build. Prove." tagline. Once a system is proven, we stay: we run
 * it, monitor it, improve what underperforms, and upgrade the stack as AI moves.
 * Server component: static, revealed on scroll via [data-reveal].
 *
 * Heading picked: "Prove. Then improve." — JW to approve heading. Candidates
 * flagged below for JW to choose from.
 */

// Copy: JW to approve. Heading candidates for JW:
//   1. "Prove. Then improve."   <- chosen
//   2. "Then we stay."
//   3. "The loop doesn't end."
const STEPS = [
  { title: "Run", line: "We operate the systems day to day, so they never fall to you." },
  { title: "Monitor", line: "Every number is watched against its baseline, weekly." },
  { title: "Improve", line: "What underperforms gets tuned until it earns its place." },
  { title: "Upgrade", line: "As AI moves, the stack moves with it. No standing still." },
];

export default function ImproveStrip() {
  return (
    <section className="section">
      <div className="inner">
        <div
          data-reveal=""
          className="glass"
          style={{
            borderRadius: "var(--r-hero)",
            padding: "clamp(32px,5vw,56px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                boxShadow: "0 0 10px var(--accent-primary)",
                flex: "none",
              }}
              aria-hidden="true"
            />
            <span className="eyebrow" style={{ margin: 0 }}>
              The fourth beat
            </span>
          </div>

          {/* Copy: JW to approve. */}
          <h2 className="h1" style={{ marginBottom: 14 }}>
            Prove. Then <span className="accent-em">improve</span>.
          </h2>
          <p className="lead" style={{ maxWidth: "40em", margin: "0 0 40px" }}>
            The loop does not stop at proof. We run the systems, monitor the numbers,
            improve what underperforms, and upgrade the stack as AI moves. You get the
            gains without owning the maintenance.
          </p>

          <div className="grid-2" style={{ gap: 16 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "18px 20px",
                  borderRadius: "var(--r-card)",
                  border: "1px solid var(--border-hair)",
                  background: "color-mix(in srgb, var(--bg-elevated) 45%, transparent)",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--accent-primary)",
                    letterSpacing: "0.06em",
                    marginTop: 3,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 16.5,
                      color: "var(--text-headline)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.title}
                  </div>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: "var(--text-muted)",
                      margin: "5px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {s.line}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
