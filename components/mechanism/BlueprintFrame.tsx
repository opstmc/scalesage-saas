import type { ReactNode } from "react";
import styles from "./BlueprintFrame.module.css";

/**
 * Blueprint aesthetic wrapper (Cy motion brief): a hairline panel over a faint
 * grid, with monospace micro-labels ("SEC.01" / "FIG.A") and a corner tick.
 * Pure CSS, no JS, no library. Brand-agnostic: it reads the site's tokens, so
 * it re-skins automatically once the brand pack lands.
 */
export default function BlueprintFrame({
  label,
  fig,
  title,
  caption,
  children,
}: {
  label: string;
  fig: string;
  title?: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.frame} glass`} data-reveal="">
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
      <span className={styles.fig} aria-hidden="true">
        {fig}
      </span>
      <div className={styles.body}>{children}</div>
      {title && <p className={styles.title}>{title}</p>}
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
