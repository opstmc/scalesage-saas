"use client";

import { useEffect, useId, useRef } from "react";
import JourneyButton from "./JourneyButton";

/** The six locked leaks — every sector's leak maps to one of these. */
export type Leak =
  | "Missed calls"
  | "Cold quotes"
  | "Forgotten reviews"
  | "Lapsed customers"
  | "Invisible online"
  | "Admin drag";

/** The five locked systems — every install maps to one of these. */
export type FixSystem =
  | "Capture every enquiry"
  | "Convert every quote"
  | "Bring back every customer"
  | "Be findable everywhere"
  | "Run without you";

/**
 * The emotion-layer leak map for one sector (CATALYST v5, brief section 4).
 * Five parts, answer-first so the modal doubles as AEO ammunition.
 * NOTE: all copy is CANDIDATE, drafted for JW/Cy approval.
 */
export interface Industry {
  name: string;
  /** 1. What it feels like — a visceral, sector-specific one-liner. */
  feelsLike: string;
  /** 2. Where it leaks — which of the six locked leaks apply. */
  leaks: Leak[];
  /** 3. What Sage asks — a sharp diagnostic question in Sage's voice. */
  sageAsks: string;
  /** 4. What ScaleSage installs — which of the five locked systems. */
  installs: FixSystem[];
  /** 5. What the owner gets back — the relief / time / money returned. */
  ownerGets: string;
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
          {/* 1 — what it feels like */}
          <section>
            <div style={label}>What it feels like</div>
            <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
              {industry.feelsLike}
            </p>
          </section>

          {/* 2 — where it leaks (the six locked leaks) */}
          <section>
            <div style={label}>Where it leaks</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {industry.leaks.map((l) => (
                <span
                  key={l}
                  style={{
                    display: "inline-flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--border-subtle)",
                    background: "color-mix(in srgb,var(--accent-primary) 6%,transparent)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent-primary)",
                      flex: "none",
                      boxShadow: "0 0 8px color-mix(in srgb,var(--accent-primary) 70%,transparent)",
                    }}
                  />
                  {l}
                </span>
              ))}
            </div>
          </section>

          {/* 3 — what Sage asks (diagnostic question, Sage's voice) */}
          <section>
            <div style={label}>What Sage asks</div>
            <blockquote
              style={{
                margin: 0,
                paddingLeft: 16,
                borderLeft: "2px solid var(--accent-primary)",
                fontStyle: "italic",
                fontSize: 15.5,
                lineHeight: 1.55,
                color: "var(--text-primary)",
              }}
            >
              {industry.sageAsks}
            </blockquote>
          </section>

          {/* 4 — what ScaleSage installs (the five locked systems) */}
          <section>
            <div style={label}>What ScaleSage installs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {industry.installs.map((sys) => (
                <div key={sys} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span
                    className="diamond"
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 2,
                      background: "var(--accent-primary)",
                      flex: "none",
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--text-headline)" }}>
                    {sys}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5 — what the owner gets back */}
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
              What you get back
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
              {industry.ownerGets}
            </p>
          </div>
        </div>

        {/* footer CTA — reuses JourneyButton to open the Catalyst diagnostic.
            The wrapping span (display:contents) closes the modal on the same click. */}
        <div className="ind-modal-foot">
          <span onClick={onClose} style={{ display: "contents" }}>
            <JourneyButton className="btn btn-primary btn-lg ind-modal-cta">
              Map your full leak, run the scan →
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
