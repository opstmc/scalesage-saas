import type { Metadata } from "next";
import Link from "next/link";
import CaptureField from "./capture-field";
import s from "./lab.module.css";

/**
 * SPIKE — /lab/hero.
 *
 * A feasibility test for the Five-State Engine, built to be measured and then
 * deleted. It is NOT the homepage hero and must not be linked from one. Kept
 * out of app/sitemap.ts (a hand-maintained list) and noindexed below.
 *
 * Everything above the fold on this page is server-rendered HTML with no
 * dependence whatsoever on the canvas: the headline, the sub, both CTAs and the
 * hotspot label are all in the initial document. Load it with ?canvas=off to
 * see exactly what a visitor gets when WebGL is unavailable or the chunk fails.
 */
export const metadata: Metadata = {
  title: "Lab · Capture",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: {},
};

export default function LabHeroPage() {
  return (
    <main>
      <section className={s.stage}>
        <CaptureField />

        <div className={s.content}>
          <div className={s.copy}>
            <div className="eyebrow">Capture</div>
            <h1 className="display">
              <span>Nothing reaches you</span>
              <br />
              <span>
                and <span className="accent-em">leaves</span> again.
              </span>
            </h1>
            <p className="lead" style={{ marginTop: 22, fontSize: 19 }}>
              Every enquiry that arrives is held the moment it lands, whatever hour it lands
              at, and whoever was busy at the time.
            </p>
            <div className="hero-cta" style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/catalyst" className="btn btn-primary btn-lg">
                Run the Catalyst scan
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost btn-lg">
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={s.note}>
        <div className={s.noteBox}>
          <strong style={{ color: "var(--text-primary)" }}>Spike, not a feature.</strong> One of
          five states, built to find out what a procedural hero costs before anyone commits to
          the other four. No video, no image sequence, no frame captured in advance — the field
          is noise-seeded and reseeds every loop, so no two passes are identical.
          <br />
          <br />
          Flags: <code>?canvas=off</code> renders the page with the canvas never loaded ·{" "}
          <code>?hud=1</code> shows frame times · <code>?rm=canvas</code> forces the frozen-frame
          path under reduced motion instead of the still.
        </div>
      </section>
    </main>
  );
}
