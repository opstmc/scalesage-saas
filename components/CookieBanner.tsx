"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem("ss-cookie") == null);
    } catch {
      /* ignore */
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem("ss-cookie", "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };
  const decline = () => {
    try {
      localStorage.setItem("ss-cookie", "declined");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, display: "flex", justifyContent: "center", padding: 16 }}>
      <div
        style={{
          background: "var(--ink)",
          color: "#fff",
          borderRadius: 14,
          padding: "16px 18px",
          maxWidth: 680,
          display: "flex",
          alignItems: "center",
          gap: 18,
          boxShadow: "0 20px 50px -20px rgba(0,0,0,.5)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,.82)", flex: 1, minWidth: 240 }}>
          We use privacy-first analytics only. No data is collected or sold until you give consent — you&rsquo;re in control.
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={decline}
            style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, fontWeight: 500, color: "rgba(255,255,255,.8)", background: "transparent", border: "1px solid rgba(255,255,255,.24)", borderRadius: 8, padding: "9px 14px", cursor: "pointer" }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            style={{ fontFamily: "Inter,sans-serif", fontSize: 13.5, fontWeight: 500, color: "var(--ink)", background: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
