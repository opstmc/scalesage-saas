"use client";

import { useEffect, useState } from "react";
import { useJourney } from "./JourneyProvider";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#industries", label: "Industries" },
  { href: "#why", label: "About" },
];

function Logo() {
  return (
    <a href="#top" className="nav-logo" aria-label="ScaleSage home">
      <span className="diamond" style={{ width: 13, height: 13, borderRadius: 3, background: "var(--accent-primary)", boxShadow: "0 0 14px color-mix(in srgb,var(--accent-primary) 80%,transparent)" }} />
      <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-.02em" }}>ScaleSage</span>
    </a>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { openJourney } = useJourney();

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`} aria-label="Primary">
        <div className="nav-row">
          <Logo />
          <div className="nav-links">
            <button type="button" className="nav-link is-primary" onClick={openJourney} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>
              Diagnostic
            </button>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="btn btn-primary btn-sm nav-cta-desktop" onClick={openJourney}>
              Start the Catalyst
            </button>
            <button
              type="button"
              className="nav-toggle"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ width: 18, height: 2, background: "currentColor", borderRadius: 2 }} />
                <span style={{ width: 18, height: 2, background: "currentColor", borderRadius: 2 }} />
                <span style={{ width: 18, height: 2, background: "currentColor", borderRadius: 2 }} />
              </span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <button type="button" onClick={() => { setMenuOpen(false); openJourney(); }} style={{ textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-hair)", color: "var(--accent-primary)", font: "inherit", fontWeight: 600, padding: "14px 8px", cursor: "pointer" }}>
              Diagnostic
            </button>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* mobile sticky CTA — always one tap away */}
      <div className="sticky-cta">
        <button type="button" className="btn btn-primary btn-md" onClick={openJourney} style={{ boxShadow: "var(--shadow-glow)" }}>
          Start the Catalyst
        </button>
      </div>
    </>
  );
}
