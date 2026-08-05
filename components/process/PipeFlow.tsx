import styles from "./PipeFlow.module.css";

/**
 * PipeFlow — Diagnose / Build / Prove drawn as a pipe.
 *
 * The product's whole metaphor is leaks: money, leads, reviews, visibility and
 * hours slipping out of a business. So the process visual is a pipe. Demand
 * flows in at the inlet, escapes through open leaks, the phases close them in
 * order, and the flow carries on to the outlet. It is a diagram of the method,
 * nothing more: no figures, no percentages, no before/after volumes. Anything
 * quantitative in here would be a claim we would have to source.
 *
 * Deliberately a server component. Reduced motion, the responsive flip from a
 * horizontal run to a vertical one, and the static fallback are all handled in
 * PipeFlow.module.css, so this ships zero client JavaScript and the correct
 * composition is there on the first paint (no hydration flash, no layout
 * shift). See the module's header comment for the motion rules.
 */

const STAGES = [
  {
    n: "01",
    title: "Diagnose",
    line: "Find where the flow is escaping, and name every gap.",
  },
  {
    n: "02",
    title: "Build",
    line: "Install the systems that close each one.",
    seal: true,
  },
  {
    n: "03",
    title: "Prove",
    line: "Measure what comes through, against the baseline taken at install.",
  },
];

// Leak points along the run, as a percentage of the pipe. All four sit ahead of
// the Build marker in both layouts, because that is where the seal goes in.
const LEAKS = ["6%", "14%", "22%", "29%"];

export default function PipeFlow({ className }: { className?: string }) {
  return (
    <figure className={className ? `${styles.figure} ${className}` : styles.figure}>
      <div className={styles.track}>
        <ol className={styles.stages}>
          {STAGES.map((s) => (
            <li key={s.n} className={styles.stage}>
              <span className={styles.stageText}>
                <span className={styles.stageNum}>{s.n}</span>
                <span className={styles.stageTitle}>{s.title}</span>
                <span className={styles.stageLine}>{s.line}</span>
              </span>
              <span
                className={s.seal ? `${styles.node} ${styles.nodeSeal}` : styles.node}
                aria-hidden="true"
              >
                <span className={styles.nodeCore} />
              </span>
            </li>
          ))}
        </ol>

        {/* Artwork only. Everything it depicts is stated in the list above and
            the caption below, so it is hidden from assistive tech. */}
        <div className={styles.pipe} aria-hidden="true">
          <span className={styles.rail}>
            <span className={styles.stream} />
            <span className={styles.flow} />
            <span className={styles.seal} />
          </span>
          <span className={styles.cap} />
          <span className={styles.arrow} />
          <span className={styles.drips}>
            {LEAKS.map((x, i) => (
              <span
                key={x}
                className={styles.leak}
                style={{ "--x": x, "--i": i } as React.CSSProperties}
              >
                <span className={styles.notch} />
                <span className={styles.drip} />
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className={styles.ends}>
        <p className={styles.end}>
          <span className={styles.endLabel}>In</span>
          Calls, enquiries, quotes and past customers arrive — and slip out through
          whatever gaps are open.
        </p>
        <p className={styles.end}>
          <span className={`${styles.endLabel} ${styles.endLabelOn}`}>Through</span>
          Past the seal, the same flow stays in the pipe: enquiries answered, quotes
          followed up, customers asked, hours handed back.
        </p>
      </div>

      <figcaption className={styles.caption}>
        How to read it: demand enters at the inlet, leaks escape through the gaps
        that sit ahead of the build, each phase closes them in order, and the flow
        carries on to the outlet. A diagram of the process, not a projection of
        results.
      </figcaption>
    </figure>
  );
}
