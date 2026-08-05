/**
 * SPIKE — /lab/hero. Throwaway.
 *
 * The no-WebGL / pre-canvas still. Deliberately NOT a raster poster: the
 * substrate is iso-contours of a noise field, and SVG feTurbulence draws
 * exactly that for ~1 KB of markup instead of ~200 KB of JPEG. It is inlined
 * into the server-rendered HTML, so it costs one request less than the current
 * particles-poster.jpg as well.
 *
 * `rich` gates the filtered version. The cheap variant is the placeholder shown
 * for the few hundred ms before the canvas arrives, where paying for a
 * full-viewport feDisplacementMap rasterisation would be a bad trade.
 */
import s from "./lab.module.css";

export default function Poster({ rich = false }: { rich?: boolean }) {
  return (
    <div className={s.poster} aria-hidden="true">
      {rich ? (
        <svg
          className={s.posterSvg}
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="labWarp" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.0022 0.0016"
                numOctaves="3"
                seed="7"
                result="n"
              />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="150" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <radialGradient id="labVig" cx="62%" cy="46%" r="72%">
              <stop offset="0%" stopColor="#0A1628" stopOpacity="0" />
              <stop offset="100%" stopColor="#0A1628" stopOpacity="0.92" />
            </radialGradient>
            <linearGradient id="labLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0A1628" stopOpacity="1" />
              <stop offset="52%" stopColor="#0A1628" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="1600" height="900" fill="#0A1628" />

          {/* Iso-contours: evenly spaced hairlines pushed around by the same
              kind of fractal noise the shader integrates. */}
          <g filter="url(#labWarp)" stroke="#3DD9D0" fill="none" strokeWidth="1.15" opacity="0.24">
            {Array.from({ length: 15 }, (_, i) => (
              <path key={i} d={`M -240 ${40 + i * 62} H 1840`} />
            ))}
          </g>

          {/* The signal, at rest in the locus, with the tail it came in on. */}
          <path
            d="M 1298 330 C 1236 396 1168 462 1120 504"
            stroke="#5EEFE6"
            strokeWidth="1.6"
            fill="none"
            opacity="0.22"
            strokeLinecap="round"
          />
          <circle cx="1120" cy="504" r="42" fill="#3DD9D0" opacity="0.055" />
          <circle cx="1120" cy="504" r="21" fill="none" stroke="#3DD9D0" strokeWidth="1" opacity="0.34" />
          <circle cx="1120" cy="504" r="4.2" fill="#5EEFE6" />

          <rect width="1600" height="900" fill="url(#labVig)" />
          <rect width="1600" height="900" fill="url(#labLeft)" />
        </svg>
      ) : null}
    </div>
  );
}
