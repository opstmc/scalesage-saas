"use client";

import { useEffect, useId, useRef } from "react";
import JourneyButton from "./JourneyButton";

/** The five fix systems — every install maps to one of these. */
export type FixSystem =
  | "Capture every enquiry"
  | "Convert every quote"
  | "Bring back every customer"
  | "Be findable everywhere"
  | "Run without you";

export interface Install {
  system: FixSystem;
  /** What that system closes for this specific sector. */
  closes: string;
}

export interface Industry {
  name: string;
  leaks: [string, string, string];
  /** The pattern behind the leaks — "what's really happening". */
  pattern: string;
  /** What we install, mapped leak-by-leak to the five fix systems. */
  installs: Install[];
  /** Which leak to close first, and why. */
  fixFirst: string;
}

const label: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  fontWeight: 600,
  color: "var(--text-faint)",
  marginBottom: 12,
};

export default function IndustryModal({
  industry,
  onClose,
}: {
  industry: Industry;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  // Lock body scroll, move focus in, trap Tab, close on Escape.
  // Mirrors the body-scroll pattern in JourneyProvider.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="ind-modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="ind-modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="ind-modal-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Leak map
            </div>
            <h3 id={headingId} className="h3" style={{ fontSize: 25, letterSpacing: "-.02em" }}>
              {industry.name}
            </h3>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={`Close the ${industry.name} leak map`}
            style={{ flex: "none" }}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div className="ind-modal-body">
          {/* the three leaks */}
          <section>
            <div style={label}>The three leaks we see</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {industry.leaks.map((l) => (
                <span
                  key={l}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 15,
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent-primary)",
                      flex: "none",
                      marginTop: 7,
                      boxShadow: "0 0 8px color-mix(in srgb,var(--accent-primary) 70%,transparent)",
                    }}
                  />
                  {l}
                </span>
              ))}
            </div>
          </section>

          {/* what's really happening */}
          <section>
            <div style={label}>What&rsquo;s really happening</div>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
              {industry.pattern}
            </p>
          </section>

          {/* what we install */}
          <section>
            <div style={label}>What we install</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {industry.installs.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    className="diamond"
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 2,
                      background: "var(--accent-primary)",
                      flex: "none",
                      marginTop: 5,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--text-headline)" }}>
                      {ins.system}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 3 }}>
                      {ins.closes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* fix first */}
          <div
            style={{
              background:
                "linear-gradient(180deg,color-mix(in srgb,var(--accent-primary) 8%,var(--bg-elevated)),var(--bg-elevated))",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "var(--accent-primary)",
                marginBottom: 8,
              }}
            >
              Fix this first
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
              {industry.fixFirst}
            </p>
          </div>
        </div>

        {/* footer CTA — reuses JourneyButton to open the Catalyst diagnostic.
            The wrapping span (display:contents) closes the modal on the same click. */}
        <div className="ind-modal-foot">
          <span onClick={onClose} style={{ display: "contents" }}>
            <JourneyButton className="btn btn-primary btn-lg ind-modal-cta">
              Map your full leak — run the scan →
            </JourneyButton>
          </span>
          <p className="ind-modal-foot-note">
            60-second scan · no login, no payment · you get the leak map first
          </p>
        </div>
      </div>
    </div>
  );
}
