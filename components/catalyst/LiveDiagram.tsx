"use client";

/**
 * LiveDiagram — the centrepiece of the Catalyst scan.
 *
 * The visitor does not watch an abstract shape pretend to be alive. They watch
 * THEIR OWN operating-system / leak map assemble, one real piece per answer:
 *
 *   Q1  sector    → the CENTRE forms (their business at the core)
 *   Q2  volume    → load flows through the core (core scales with weekly enquiries)
 *   Q3  channels  ┐ the enquiries node connects + the "Missed calls" pathway draws
 *   Q4  capture   ┘
 *   Q5  convert   → the "Cold quotes" conversion pathway draws
 *   Q6  reviews   → the "Forgotten reviews" part attaches
 *   Q7  return    → the "Lapsed customers" part attaches
 *   Q8  findable  → the "Invisible online" part attaches
 *   Q9  memory    → the "Admin drag" load/admin part attaches
 *   Q10 relief    → marks the leak they want fixed FIRST
 *
 * By the final question it is a complete, connected diagram of their business
 * with every leak visible. Every moving thing maps to a real thing:
 *   - the progress ring fills because scan progress is real
 *   - a node PULSES ONCE when a leak was actually detected from that answer
 *     (severity >= 2 → Likely/Detected)
 *   - a pathway draws because their systems connect
 * Nothing moves just to move.
 *
 * PERFORMANCE: SVG driven by React state; all motion is transform / opacity /
 * stroke-dashoffset only (compositor-friendly), so it holds 60fps on a mid-range
 * Android. No canvas, no rAF loop, no particle system, no layout animation.
 * prefers-reduced-motion (prop or media query): assemble to final state instantly.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { STEPS, LEAKS, type ScanAnswers, type ScanNode, type LeakKey, type Chip } from "@/lib/catalyst";
import styles from "./LiveDiagram.module.css";

/* ---------- fixed geometry (viewBox units; layout solved ONCE here) ---------- */
const VIEW_W = 480;
const VIEW_H = 412;
const CX = 240;
const CY = 200;
const R = 118; // core → node distance
const NODE_R = 22;
const GLOW_R = 40;
const CORE_R = 30;
const RING_R = 40;
const OFF = NODE_R + 9; // label offset outside a node
const RING_C = 2 * Math.PI * RING_R; // progress-ring circumference

type Anchor = "start" | "middle" | "end";
interface Geo {
  leak: LeakKey;
  x: number;
  y: number;
  anchor: Anchor;
  nameX: number;
  nameY: number;
  chipX: number;
  chipY: number;
}

/** Precompute each leak's position + label anchors from its ring angle. */
function geo(leak: LeakKey, deg: number): Geo {
  const a = (deg * Math.PI) / 180;
  const dirX = Math.sin(a);
  const dirY = -Math.cos(a);
  const x = CX + R * dirX;
  const y = CY + R * dirY;
  const anchor: Anchor = dirX > 0.34 ? "start" : dirX < -0.34 ? "end" : "middle";
  let nameX: number, nameY: number, chipX: number, chipY: number;
  if (anchor === "middle") {
    nameX = x;
    chipX = x;
    if (dirY < 0) {
      // top node — label stacks upward, away from the core
      nameY = y - OFF;
      chipY = y - OFF - 13;
    } else {
      // bottom node — label stacks downward
      nameY = y + OFF + 9;
      chipY = y + OFF + 22;
    }
  } else {
    // side node — label sits just outside, vertically centred on the node
    const lx = x + dirX * OFF;
    nameX = lx;
    chipX = lx;
    nameY = y - 2;
    chipY = y + 12;
  }
  return { leak, x, y, anchor, nameX, nameY, chipX, chipY };
}

// LEAKS is the canonical six in display order; angles at 60° steps from the top.
const NODE_GEO: Geo[] = LEAKS.map((leak, i) => geo(leak, i * 60));

/* ---------- answer → part mapping (all derived from real state) ---------- */

/** The question(s) that make a leak's part ATTACH (become a real piece). */
const GOVERN: Record<LeakKey, string[]> = {
  "Missed calls": ["channels", "capture"],
  "Cold quotes": ["convert"],
  "Forgotten reviews": ["reviews"],
  "Lapsed customers": ["return"],
  "Invisible online": ["findable"],
  "Admin drag": ["memory"],
};

/** The leak a given question is currently working on (for the "just added" emphasis). */
const ACTIVE_LEAK: Record<string, LeakKey> = {
  channels: "Missed calls",
  capture: "Missed calls",
  convert: "Cold quotes",
  reviews: "Forgotten reviews",
  return: "Lapsed customers",
  findable: "Invisible online",
  memory: "Admin drag",
};

const SCAN_STEP_IDS = STEPS.map((s) => s.id);
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- reduced motion (prop wins; media query is the safety net) ---------- */
function useReducedMotion(explicit?: boolean): boolean {
  const [mq, setMq] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setMq(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return Boolean(explicit) || mq;
}

export default function LiveDiagram({
  answers,
  activeStepId,
  nodes,
  reducedMotion,
}: {
  answers: ScanAnswers;
  activeStepId: string;
  nodes: ScanNode[];
  reducedMotion?: boolean;
}): ReactElement {
  const reduced = useReducedMotion(reducedMotion);
  const a = answers ?? ({} as ScanAnswers);

  /* -- real state readouts ------------------------------------------------- */
  const answered = (id: string): boolean => {
    const v = a[id];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === "string" && v.trim().length > 0;
  };

  // scored nodes → lookup by leak (buildResult returns all six, but stay tolerant)
  const nodeByLeak = useMemo(() => {
    const m = new Map<LeakKey, ScanNode>();
    for (const n of nodes ?? []) if (n && n.leak) m.set(n.leak, n);
    return m;
  }, [nodes]);

  // progress ring: fraction of the ten questions actually answered
  const answeredCount = SCAN_STEP_IDS.filter(answered).length;
  const progress = answeredCount / SCAN_STEP_IDS.length;

  // centre label: business name if the flow has it, else the sector, else generic
  const business = typeof a.business === "string" ? a.business.trim() : "";
  const sectorStep = STEPS.find((s) => s.id === "sector");
  const sectorLabel = sectorStep?.options.find((o) => o.value === a.sector)?.label ?? "";
  const centrePresent = answered("sector") || !!business || NODE_GEO.some((g) => GOVERN[g.leak].some(answered));
  const centreLabel = truncate(business || sectorLabel || (centrePresent ? "Your business" : ""), 22);

  // load through the core scales with weekly enquiry volume (Q2)
  const volMid = STEPS.find((s) => s.id === "volume")?.options.find((o) => o.value === a.volume)?.weeklyMid ?? 0;
  const coreScale = 1 + Math.min(volMid / 40, 1) * 0.16;

  // "fix first" leak from the Q10 relief choice
  const reliefStep = STEPS.find((s) => s.id === "relief");
  const priorityLeak = reliefStep?.options.find((o) => o.value === a.relief)?.relief;

  // the leak the current question is on (centre-focused steps have none)
  const activeLeak: LeakKey | undefined = activeStepId === "relief" ? priorityLeak : ACTIVE_LEAK[activeStepId];

  /* -- per-node view (severity, presence, lit, emphasis) ------------------- */
  const view = NODE_GEO.map((g) => {
    const scored = nodeByLeak.get(g.leak);
    const severity = scored?.severity ?? 0;
    const chip: Chip = scored?.chip ?? "Clear";
    const present = GOVERN[g.leak].some(answered);
    const lit = present && severity >= 2; // Likely / Detected, a real finding
    return {
      ...g,
      severity,
      chip,
      present,
      lit,
      active: activeLeak === g.leak,
      priority: priorityLeak === g.leak,
    };
  });

  /* -- one-shot detection pulse: fire once when a leak crosses into lit ----- */
  const [pulse, setPulse] = useState<Set<LeakKey>>(() => new Set());
  const prevLit = useRef<Record<string, boolean>>({});
  const seeded = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  // signature of the lit/present state so the effect only runs on real changes
  const litSig = view.map((v) => (v.lit ? "1" : "0")).join("");
  const viewRef = useRef(view);
  // keep the ref current without writing it during render (react-hooks/refs);
  // this effect is declared before the pulse effect, so it updates first on each commit.
  useEffect(() => {
    viewRef.current = view;
  });

  useEffect(() => {
    // Seed on first paint (and always under reduced motion / resume) so we never
    // replay a burst of pulses for state that was already there.
    if (!seeded.current || reduced) {
      seeded.current = true;
      for (const v of viewRef.current) prevLit.current[v.leak] = v.lit;
      return;
    }
    const newly = viewRef.current.filter((v) => v.lit && !prevLit.current[v.leak]).map((v) => v.leak);
    for (const v of viewRef.current) prevLit.current[v.leak] = v.lit;
    if (newly.length === 0) return;
    setPulse((p) => {
      const n = new Set(p);
      newly.forEach((l) => n.add(l));
      return n;
    });
    const t = window.setTimeout(() => {
      setPulse((p) => {
        const n = new Set(p);
        newly.forEach((l) => n.delete(l));
        return n;
      });
    }, 820);
    timers.current.push(t);
  }, [litSig, reduced]);

  /* -- summary for accessibility ------------------------------------------- */
  const presentCount = view.filter((v) => v.present).length;
  const detectedCount = view.filter((v) => v.lit).length;
  const ariaLabel = centrePresent
    ? `Live diagram of ${centreLabel || "your business"}: ${presentCount} of 6 systems mapped, ${detectedCount} leak${
        detectedCount === 1 ? "" : "s"
      } showing so far.`
    : "Your business diagram, assembling as you answer.";

  return (
    <div className={cx(styles.wrap, reduced && styles.reduced)}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>
        <defs>
          <radialGradient id="ssField" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: "var(--accent-primary)" }} stopOpacity={0.5} />
            <stop offset="100%" style={{ stopColor: "var(--accent-primary)" }} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ssNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: "var(--accent-glow)" }} stopOpacity={0.9} />
            <stop offset="55%" style={{ stopColor: "var(--accent-primary)" }} stopOpacity={0.35} />
            <stop offset="100%" style={{ stopColor: "var(--accent-primary)" }} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ssCoreFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: "var(--accent-primary)" }} stopOpacity={0.3} />
            <stop offset="100%" style={{ stopColor: "var(--bg-elevated)" }} stopOpacity={1} />
          </radialGradient>
        </defs>

        {/* centre heat, a touch brighter as more leaks light (real) */}
        <circle
          className={styles.field}
          cx={CX}
          cy={CY}
          r={168}
          fill="url(#ssField)"
          style={{ opacity: 0.04 + Math.min(detectedCount, 6) * 0.02 }}
        />

        {/* edges: each system's pathway to the core, drawn in when its part attaches */}
        <g>
          {view.map((v) => (
            <line
              key={`e-${v.leak}`}
              className={styles.edge}
              x1={CX}
              y1={CY}
              x2={v.x}
              y2={v.y}
              style={{
                strokeDasharray: R,
                strokeDashoffset: v.present ? 0 : R,
                opacity: !v.present ? 0 : v.lit ? 0.7 : 0.34,
              }}
            />
          ))}
        </g>

        {/* centre core: their business, with the scan-progress ring around it */}
        <g style={{ opacity: centrePresent ? 1 : 0.4 }}>
          <circle className={styles.ringTrack} cx={CX} cy={CY} r={RING_R} />
          <circle
            className={styles.ring}
            cx={CX}
            cy={CY}
            r={RING_R}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C * (1 - progress) }}
          />
          <g className={styles.core} style={{ "--s": centrePresent ? coreScale : 0.8 } as CSSProperties}>
            <circle className={styles.coreDisc} cx={CX} cy={CY} r={CORE_R} />
            <circle className={styles.coreInner} cx={CX} cy={CY} r={CORE_R - 6} />
          </g>
          <text
            className={styles.coreKicker}
            x={CX}
            y={CY + RING_R + 20}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ opacity: centrePresent ? 0.9 : 0 }}
          >
            YOUR BUSINESS
          </text>
          <text
            className={styles.coreLabel}
            x={CX}
            y={CY + RING_R + 33}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ opacity: centreLabel ? 1 : 0 }}
          >
            {centreLabel}
          </text>
        </g>

        {/* the six leak parts */}
        <g>
          {view.map((v) => {
            const nodeScale = v.present ? (v.active ? 1.05 : 1) : 0.6;
            const nodeOpacity = v.present ? 1 : centrePresent ? 0.34 : 0.22;
            const glowOpacity = !v.present
              ? 0
              : v.severity >= 3
                ? 0.72
                : v.severity >= 2
                  ? 0.42
                  : v.severity >= 1
                    ? 0.16
                    : 0.06;
            return (
              <g key={v.leak}>
                {/* one-shot detection pulse (sibling so it scales independently) */}
                <circle
                  className={cx(styles.pulseRing, pulse.has(v.leak) && styles.pulsing)}
                  cx={v.x}
                  cy={v.y}
                  r={NODE_R}
                />
                <g className={styles.node} style={{ "--s": nodeScale, opacity: nodeOpacity } as CSSProperties}>
                  <circle
                    className={styles.glow}
                    cx={v.x}
                    cy={v.y}
                    r={GLOW_R}
                    fill="url(#ssNodeGlow)"
                    style={{ opacity: glowOpacity }}
                  />
                  <circle className={styles.priorityRing} cx={v.x} cy={v.y} r={NODE_R + 8} style={{ opacity: v.priority ? 1 : 0 }} />
                  <circle className={styles.emph} cx={v.x} cy={v.y} r={NODE_R + 5} style={{ opacity: v.active && v.present ? 1 : 0 }} />
                  <circle
                    className={v.present ? cx(styles.disc, v.lit && styles.discLit) : styles.discGhost}
                    cx={v.x}
                    cy={v.y}
                    r={NODE_R}
                  />
                </g>
                {/* labels sit outside the scaling group so text stays crisp/steady */}
                <text
                  className={cx(styles.nodeName, v.lit && styles.nodeNameLit)}
                  x={v.nameX}
                  y={v.nameY}
                  textAnchor={v.anchor}
                  dominantBaseline="middle"
                  style={{ opacity: v.present ? 1 : 0 }}
                >
                  {v.leak}
                </text>
                <text
                  className={styles.nodeChip}
                  x={v.chipX}
                  y={v.chipY}
                  textAnchor={v.anchor}
                  dominantBaseline="middle"
                  style={{ opacity: v.present && v.lit ? 0.95 : 0 }}
                >
                  {v.chip}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Trim an over-long centre label so it never overflows the diagram. */
function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}
