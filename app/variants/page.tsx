import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ScaleSage — hero background variants",
  description:
    "Compare the hero background options for the ScaleSage homepage.",
  alternates: { canonical: "/variants" },
  robots: { index: false, follow: true },
};

type Variant = {
  href: string;
  name: string;
  note: string;
  poster?: string;
  thumb?: string; // CSS background for posterless (canvas) variants
};

const VARIANTS: Variant[] = [
  {
    href: "/",
    name: "Data-stream",
    note: "Locked signature · animated canvas",
    thumb:
      "radial-gradient(120% 90% at 78% 8%,rgba(61,217,208,.18),transparent 55%),linear-gradient(115deg,#0A1628,#0E1B2D 60%,#11233a)",
  },
  {
    href: "/fiber",
    name: "Fiber",
    note: "Fiber-optic strands · teal packets",
    poster: "/backgrounds/fiber-poster.jpg",
  },
  {
    href: "/mesh",
    name: "Mesh",
    note: "Wireframe terrain · navy plexus",
    poster: "/backgrounds/mesh-poster.jpg",
  },
  {
    href: "/swirl",
    name: "Swirl",
    note: "Electric-blue light · static image",
    poster: "/backgrounds/swirl.jpg",
  },
  {
    href: "/video",
    name: "Video (original)",
    note: "First looping-video pass",
    poster: "/hero/hero-poster.jpg",
  },
];

export default function VariantsIndex() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px 120px" }}>
        <Link
          href="/"
          className="nav-logo"
          aria-label="ScaleSage home"
          style={{ display: "inline-flex", marginBottom: 40 }}
        >
          <Image
            className="nav-mark"
            src="/brand/scalesage-mark.png"
            alt=""
            aria-hidden="true"
            width={30}
            height={30}
          />
          <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-.02em" }}>
            ScaleSage
          </span>
        </Link>

        <div className="eyebrow">Hero background variants</div>
        <h1 className="h1" style={{ maxWidth: "18em" }}>
          Five takes on the same hero. Pick the one that should ship.
        </h1>
        <p className="lead" style={{ marginTop: 16, maxWidth: "40em" }}>
          Every option below is the full homepage — only the hero background
          changes. The brand-locked data-stream is the default; the rest are
          built from the uploaded elements for comparison.
        </p>

        <div className="grid-3" style={{ marginTop: 48 }}>
          {VARIANTS.map((v) => (
            <Link key={v.href} href={v.href} className="glass glass-hover card-link" style={{ overflow: "hidden" }}>
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 9",
                  background: v.thumb ?? "var(--bg-elevated)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderBottom: "1px solid var(--border-hair)",
                }}
              >
                {v.poster && (
                  <Image
                    src={v.poster}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 680px) 100vw, 360px"
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 17, color: "var(--text-headline)" }}>{v.name}</span>
                  <span className="small" style={{ color: "var(--accent-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {v.href}
                  </span>
                </div>
                <div className="small" style={{ marginTop: 6, color: "var(--text-faint)" }}>{v.note}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
