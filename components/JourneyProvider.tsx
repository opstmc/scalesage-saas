"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import CatalystJourney from "./CatalystJourney";
import CookieBanner from "./CookieBanner";

interface JourneyCtx {
  open: boolean;
  openJourney: () => void;
  closeJourney: () => void;
}

const Ctx = createContext<JourneyCtx | null>(null);

export function useJourney(): JourneyCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useJourney must be used within <JourneyProvider>");
  return c;
}

export default function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openJourney = useCallback(() => setOpen(true), []);
  const closeJourney = useCallback(() => setOpen(false), []);

  // lock body scroll while the full-screen journey is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, openJourney, closeJourney }}>
      {children}
      {/* Mounting `open && ...` remounts the journey fresh each time it opens. */}
      {open && <CatalystJourney />}
      <CookieBanner />
    </Ctx.Provider>
  );
}
