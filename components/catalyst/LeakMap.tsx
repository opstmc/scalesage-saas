"use client";

import { useMemo, useState } from "react";
import { scoreLeaks, chipFor, type ScanAnswers } from "@/lib/catalyst";
import {
  resolveChip,
  leakLabel,
  LEAK_ORDER,
  CHIP_DOT,
  CHIP_LABEL,
  type ChipTone,
} from "./meta";
import styles from "./catalyst.module.css";

const CHIP_CLASS: Record<ChipTone, string> = {
  clear: styles.chipClear,
  scan: styles.chipScan,
  likely: styles.chipLikely,
  detected: styles.chipDetected,
};

interface NodeView {
  key: string;
  name: string;
  tone: ChipTone;
  label: string;
}

/** Score the current answers and resolve each node's live chip. */
function useNodes(answers: ScanAnswers): NodeView[] {
  return useMemo(() => {
    let scores: Record<string, unknown> = {};
    try {
      scores = (scoreLeaks(answers) ?? {}) as Record<string, unknown>;
    } catch {
      scores = {};
    }
    const keys = Object.keys(scores);
    // preferred order first, then any unknown keys as they came
    const ordered = [
      ...LEAK_ORDER.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !LEAK_ORDER.includes(k)),
    ];
    return ordered.map((key) => {
      // chipFor is the contract's label resolver; fall back to the raw score.
      let chipRaw: unknown = scores[key];
      try {
        const viaChipFor = chipFor(scores[key] as never);
        if (viaChipFor != null) chipRaw = viaChipFor;
      } catch {
        /* fall back to raw score below */
      }
      const { tone, label } = resolveChip(chipRaw);
      return { key, name: leakLabel(key), tone, label };
    });
  }, [answers]);
}

function Node({ node }: { node: NodeView }) {
  const active = node.tone !== "clear";
  return (
    <div className={`${styles.node} ${active ? styles.nodeActive : ""}`}>
      <span className={styles.nodeName}>
        <span className={styles.nodeDot} style={{ background: CHIP_DOT[node.tone] }} aria-hidden="true" />
        {node.name}
      </span>
      <span className={`${styles.chip} ${CHIP_CLASS[node.tone]}`}>{node.label}</span>
    </div>
  );
}

/** Shared node list used by rail, strip and result variants. */
function NodeList({ nodes }: { nodes: NodeView[] }) {
  return (
    <div className={styles.mapNodes}>
      {nodes.map((n) => (
        <Node key={n.key} node={n} />
      ))}
    </div>
  );
}

export type LeakMapVariant = "rail" | "strip" | "result";

export default function LeakMap({
  answers,
  variant = "rail",
  title = "Live leak map",
}: {
  answers: ScanAnswers;
  variant?: LeakMapVariant;
  title?: string;
}) {
  const nodes = useNodes(answers);
  const detected = nodes.filter((n) => n.tone === "detected" || n.tone === "likely").length;

  if (variant === "result") {
    return <NodeList nodes={nodes} />;
  }

  if (variant === "strip") {
    return <StripMap nodes={nodes} detected={detected} />;
  }

  // rail (desktop sidebar)
  return (
    <div className={`glass ${styles.map}`}>
      <div className={styles.mapHead}>
        <span className={styles.mapTitle}>{title}</span>
        <span className={styles.mapTitle} style={{ color: "var(--accent-primary)" }}>
          {detected} live
        </span>
      </div>
      <NodeList nodes={nodes} />
      <p className="small" style={{ color: "var(--text-faint)", margin: "12px 2px 0", fontSize: 11.5, lineHeight: 1.5 }}>
        Directional — chips sharpen as Sage reads each answer.
      </p>
    </div>
  );
}

function StripMap({ nodes, detected }: { nodes: NodeView[]; detected: number }) {
  const [open, setOpen] = useState(false);
  const top = nodes.find((n) => n.tone === "detected") ?? nodes.find((n) => n.tone === "likely");
  return (
    <div className={styles.strip}>
      <button
        type="button"
        className={styles.stripBar}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.stripBarText}>
          <span className={styles.mapTitle}>Leak map</span>
          {top ? `${top.name} · ${top.label}` : `${detected} signals so far`}
        </span>
        <span className={`${styles.stripCaret} ${open ? styles.stripCaretOpen : ""}`}>
          {open ? "Hide" : "Show"} ▾
        </span>
      </button>
      {open && (
        <div className={styles.stripPanel}>
          <NodeList nodes={nodes} />
          <p className="small" style={{ color: "var(--text-faint)", margin: "12px 2px 0", fontSize: 12 }}>
            Chips update as Sage reads each answer. Directional until the full scan.
          </p>
        </div>
      )}
    </div>
  );
}

/** Small legend describing the four chip states (used on the result map). */
export function ChipLegend() {
  const order: ChipTone[] = ["detected", "likely", "scan", "clear"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
      {order.map((t) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-faint)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: CHIP_DOT[t] }} />
          {CHIP_LABEL[t]}
        </span>
      ))}
    </div>
  );
}
