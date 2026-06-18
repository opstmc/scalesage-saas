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

  const set = (val: string) => {
    try {
      localStorage.setItem("ss-cookie", val);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70, display: "flex", justifyContent: "center", padding: 16 }}>
      <div className="glass" style={{ padding: "16px 18px", maxWidth: 700, display: "flex", alignItems: "center", gap: 18, boxShadow: "var(--shadow-depth)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-muted)", flex: 1, minWidth: 240 }}>
          We use privacy-first analytics, and only fire tracking after you consent. GDPR-compliant by design — you&rsquo;re in control.
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("declined")}>
            Decline
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => set("accepted")}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
