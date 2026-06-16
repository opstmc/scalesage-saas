"use client";

import { useEffect, useState } from "react";
import { useJourney } from "./JourneyProvider";

const LINKS = [
  { href: "#framework", label: "How it works" },
  { href: "#fixes", label: "What we fix" },
  { href: "#industries", label: "Industries" },
  { href: "#pricing", label: "Pricing" },
  { href: "#proof", label: "Proof" },
];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const { openJourney } = useJourney();

  // Drive the transparent→solid transition off a sentinel at the hero's bottom,
  // robust regardless of which element actually scrolls (matches the prototype).
  useEffect(() => {
    const sentinel = document.querySelector("[data-nav-sentinel]");
    if (!sentinel || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => setSolid(en.boundingClientRect.top <= 68));
      },
      { rootMargin: "-68px 0px 0px 0px", threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <nav className={`nav${solid ? " solid" : ""}`} aria-label="Primary">
      <div className="nav-row">
        <a href="#top" className="nav-logo">
          <span
            className="diamond"
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              background: "var(--accent)",
              boxShadow: "0 0 16px color-mix(in srgb,var(--accent) 80%,transparent)",
            }}
          />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-.02em" }}>
            ScaleSage
          </span>
        </a>
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </div>
        <button type="button" className="btn btn-accent btn-sm" onClick={openJourney}>
          Book Your Catalyst Diagnostic
        </button>
      </div>
    </nav>
  );
}
