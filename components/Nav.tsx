"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Primary nav order (brief §6): Home, How it works, Industries, Pricing, About.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
  { href: "/about", label: "About" },
];

// The scan now lives at its own route — every "Run the Catalyst" CTA links here.
const CATALYST_HREF = "/catalyst";

function Logo() {
  return (
    <Link href="/" className="nav-logo" aria-label="ScaleSage home">
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
    </Link>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the panel is open: trap focus, lock scroll, close on Esc / outside click.
  // The panel stays mounted at all times so open AND close both animate (close reverses).
  useEffect(() => {
    if (!menuOpen) return;
    const menu = menuRef.current;
    if (!menu) return;

    const focusables = () =>
      Array.from(menu.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'))
        // offsetParent is null for display:none items (e.g. the mobile-only pill on desktop)
        .filter((el) => el.offsetParent !== null);

    // move focus into the panel so it's keyboard-reachable
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus(); // return focus to the trigger
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !menu.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !menu.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menu.contains(t) || toggleRef.current?.contains(t)) return;
      setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);

    // scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`} aria-label="Primary">
        <div className="nav-row">
          <Logo />
          <div className="nav-actions">
            <Link href={CATALYST_HREF} className="btn btn-primary btn-sm nav-cta-desktop">
              Run the Catalyst
            </Link>
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

          {/* Panel is always mounted; visibility is driven by .is-open so it reveals and hides symmetrically. */}
          <div
            className={`nav-menu${menuOpen ? " is-open" : ""}`}
            id="nav-menu"
            ref={menuRef}
            aria-hidden={!menuOpen}
          >
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-menu-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  tabIndex={menuOpen ? undefined : -1}
                  onClick={closeMenu}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="nav-menu-sep" role="separator" aria-hidden="true" />
            <Link
              href={CATALYST_HREF}
              className="btn btn-primary btn-md nav-menu-cta"
              tabIndex={menuOpen ? undefined : -1}
              onClick={closeMenu}
            >
              Run the Catalyst
            </Link>
          </div>
        </div>
      </nav>

      {/* mobile sticky CTA — always one tap away */}
      <div className="sticky-cta">
        <Link
          href={CATALYST_HREF}
          className="btn btn-primary btn-md"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          Run the Catalyst
        </Link>
      </div>
    </>
  );
}
