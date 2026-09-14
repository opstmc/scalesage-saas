"use client";

import { useState, useSyncExternalStore } from "react";

const KEY = "scalesage_cookie_consent";
const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("scalesage-cookie-settings", onStoreChange);
  return () => window.removeEventListener("scalesage-cookie-settings", onStoreChange);
};

// Read consent without a setState-in-effect: SSR snapshot hides the banner,
// the client snapshot reveals it once if no choice has been stored yet.
function useConsentUnset() {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(KEY) == null;
      } catch {
        return false;
      }
    },
    () => false
  );
}

export default function CookieBanner() {
  const unset = useConsentUnset();
  const [dismissed, setDismissed] = useState(false);

  const set = (val: string) => {
    try {
      localStorage.setItem(KEY, val);
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (dismissed || !unset) return null;

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70, display: "flex", justifyContent: "center", padding: 16 }}>
      <div className="glass" style={{ padding: "16px 18px", maxWidth: 700, display: "flex", alignItems: "center", gap: 18, boxShadow: "var(--shadow-depth)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-muted)", flex: 1, minWidth: 240 }}>
          We use essential cookies to make this site work. With your consent, we also use analytics cookies to understand how visitors use our site. See our{" "}
          <a href="/cookies" className="footer-link">Cookie Policy</a>.
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("essential")}>
            Essential only
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => set("accepted")}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
