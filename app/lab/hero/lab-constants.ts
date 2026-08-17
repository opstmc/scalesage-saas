/** SPIKE — /lab/hero. Throwaway. Shared by the eager shell and the lazy canvas. */

/**
 * Where the signal comes to rest, as a fraction of the canvas box.
 *
 * MUST match `LOCUS_N` in capture-shader.ts. There, st = (vUv - 0.5) * (aspect, 1)
 * and locus = (0.20 * aspect, -0.06); the aspect cancels on x, so:
 *   vUv = (0.70, 0.44)  ->  CSS left 70%, top 56%.
 */
export const LOCUS = { leftPct: 70, topPct: 56 } as const;

/**
 * One complete capture-and-release passage. The signal's end position and
 * brightness match its start position, so the next pass is a continuation,
 * not a visible reset.
 */
export const LOOP_SECONDS = 14.5;

/** Loop position at which the signal is latched — when the hotspot label earns its place. */
export const CAUGHT_AT = 0.6;
/** Loop position at which the label is released again. */
export const RELEASED_AT = 0.84;

/**
 * The scene is an illustration of the whole operating system, not only call
 * handling. One outcome is shown per completed capture so the message matches
 * the systems visitors meet elsewhere on the site.
 */
export const HOTSPOT_LABELS = [
  "New lead captured",
  "Quote followed up",
  "Booking confirmed",
  "Review request sent",
  "Customer reactivated",
  "Visibility gap found",
] as const;

/** Locked brand tokens, duplicated as numbers because GLSL cannot read CSS vars. */
export const PALETTE = {
  bg: [0.039, 0.086, 0.157] as const, // #0A1628
  accent: [0.239, 0.851, 0.816] as const, // #3DD9D0
  glow: [0.369, 0.937, 0.902] as const, // #5EEFE6
};
