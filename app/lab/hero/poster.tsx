/**
 * SPIKE — /lab/hero. Throwaway.
 *
 * The no-WebGL / pre-canvas still. Deliberately NOT a raster poster: the
 * substrate is iso-contours of a noise field, and SVG feTurbulence draws
 * exactly that for ~1 KB of markup instead of ~200 KB of JPEG. It is inlined
 * into the server-rendered HTML, so it costs one request less than the current
 * particles-poster.jpg as well.
 *
 * It is server-rendered and `rich` by default, so the fallback needs no
 * JavaScript to exist. `rich={false}` drops it to flat navy, which is what the
 * shell does once the canvas is live and the still is just a wasted layer.
 */
import s from "./lab.module.css";

export default function Poster({ rich = true }: { rich?: boolean }) {
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
                baseFrequency="0.0042 0.0034"
                numOctaves="4"
                seed="7"
                result="n"
              />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="280" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <radialGradient id="labVig" cx="62%" cy="46%" r="72%">
              <stop offset="0%" stopColor="#0A1628" stopOpacity="0" />
              <stop offset="100%" stopColor="#0A1628" stopOpacity="0.92" />
            </radialGradient>
            <linearGradient id="labLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0A1628" stopOpacity="1" />
              <stop offset="52%" stopColor="#0A1628" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="labWell" cx="70%" cy="56%" r="24%">
              <stop offset="0%" stopColor="#5EEFE6" stopOpacity="0.20" />
              <stop offset="28%" stopColor="#3DD9D0" stopOpacity="0.075" />
              <stop offset="100%" stopColor="#3DD9D0" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="labRibbon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3DD9D0" stopOpacity="0" />
              <stop offset="47%" stopColor="#3DD9D0" stopOpacity="0.10" />
              <stop offset="68%" stopColor="#5EEFE6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3DD9D0" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="1600" height="900" fill="#0A1628" />

          {/* Iso-contours: evenly spaced hairlines pushed around by the same
              kind of fractal noise the shader integrates. */}
          <g filter="url(#labWarp)" stroke="#3DD9D0" fill="none" strokeWidth="1.15" opacity="0.24">
            {Array.from({ length: 19 }, (_, i) => (
              <path key={i} d={`M -320 ${20 + i * 52} H 1920`} />
            ))}
          </g>

          <path
            d="M 495 758 C 750 660 865 420 1119 504 C 1280 557 1430 420 1750 286"
            stroke="url(#labRibbon)"
            strokeWidth="42"
            fill="none"
            opacity="0.72"
            filter="url(#labWarp)"
          />

          {/* The signal, at rest in the locus, with the tail it came in on. */}
          <path
            d="M 1252 392 C 1214 430 1160 476 1120 504"
            stroke="#5EEFE6"
            strokeWidth="1.6"
            fill="none"
            opacity="0.22"
            strokeLinecap="round"
          />
          <circle cx="1120" cy="504" r="42" fill="#3DD9D0" opacity="0.055" />
          <circle cx="1120" cy="504" r="162" fill="url(#labWell)" />
          <circle cx="1120" cy="504" r="66" fill="none" stroke="#3DD9D0" strokeWidth="1" opacity="0.19" strokeDasharray="116 54 36 128" transform="rotate(-24 1120 504)" />
          <circle cx="1120" cy="504" r="94" fill="none" stroke="#3DD9D0" strokeWidth="1" opacity="0.09" strokeDasharray="46 82 120 48" transform="rotate(18 1120 504)" />
          <circle cx="1120" cy="504" r="21" fill="none" stroke="#3DD9D0" strokeWidth="1" opacity="0.34" />
          <circle cx="1120" cy="504" r="4.2" fill="#5EEFE6" />
          <g fill="#5EEFE6" opacity="0.55">
            <circle cx="1012" cy="469" r="1.7" />
            <circle cx="1167" cy="422" r="1.3" />
            <circle cx="1246" cy="556" r="1.8" />
            <circle cx="1063" cy="613" r="1.1" />
          </g>

          <rect width="1600" height="900" fill="url(#labVig)" />
          <rect width="1600" height="900" fill="url(#labLeft)" />
        </svg>
      ) : null}
    </div>
  );
}
