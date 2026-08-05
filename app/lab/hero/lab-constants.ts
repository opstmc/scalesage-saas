/** SPIKE — /lab/hero. Throwaway. Shared by the eager shell and the lazy canvas. */

/**
 * Where the signal comes to rest, as a fraction of the canvas box.
 *
 * MUST match `LOCUS_N` in capture-shader.ts. There, st = (vUv - 0.5) * (aspect, 1)
 * and locus = (0.20 * aspect, -0.06); the aspect cancels on x, so:
 *   vUv = (0.70, 0.44)  ->  CSS left 70%, top 56%.
 */
export const LOCUS = { leftPct: 70, topPct: 56 } as const;

/** Seconds per Capture loop. */
export const LOOP_SECONDS = 9.2;

/** Loop position at which the signal is latched — when the hotspot label earns its place. */
export const CAUGHT_AT = 0.6;
/** Loop position at which the label is released again. */
export const RELEASED_AT = 0.945;

/** The one legible claim on screen. Plain English, no figure. */
export const HOTSPOT_LABEL = "Missed call caught";

/** Locked brand tokens, duplicated as numbers because GLSL cannot read CSS vars. */
export const PALETTE = {
  bg: [0.039, 0.086, 0.157] as const, // #0A1628
  accent: [0.239, 0.851, 0.816] as const, // #3DD9D0
  glow: [0.369, 0.937, 0.902] as const, // #5EEFE6
};
