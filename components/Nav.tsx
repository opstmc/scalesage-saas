"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
      <Image
        className="nav-mark"
        src="/brand/scalesage-mark.png"
        alt=""
        aria-hidden="true"
        width={30}
        height={30}
        priority
      />
      <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-.02em" }}>ScaleSage</span>
    </a>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { openJourney } = useJourney();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // dismiss the dropdown on outside click or Escape; manage focus for keyboard users
  useEffect(() => {
    if (!menuOpen) return;
    // move focus into the menu so it's keyboard-reachable
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || toggleRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus(); // return focus to the trigger
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const startCatalyst = () => {
    setMenuOpen(false);
    openJourney();
  };

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`} aria-label="Primary">
        <div className="nav-row">
          <Logo />
          <div className="nav-actions">
            <button type="button" className="btn btn-primary btn-sm nav-cta-desktop" onClick={openJourney}>
              Start the Catalyst
            </button>
            <button
              ref={toggleRef}
              type="button"
              className={`nav-toggle${menuOpen ? " is-open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="nav-toggle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>

          {menuOpen && (
            <div className="nav-menu" id="nav-menu" ref={menuRef}>
              <button type="button" className="nav-menu-link is-primary" onClick={startCatalyst}>
                Diagnostic
              </button>
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} className="nav-menu-link" onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
              ))}
              <button type="button" className="btn btn-primary btn-md nav-menu-cta" onClick={startCatalyst}>
                Start the Catalyst
              </button>
            </div>
          )}
        </div>
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
