"use client";

import type { ReactNode } from "react";

/**
 * App Router `template.tsx` remounts on every navigation (unlike `layout.tsx`,
 * which persists). We use that remount to replay a subtle fade-through so route
 * changes flow rather than hard-cut. The nav/header live in the persistent
 * layout, so they stay put while the page content transitions.
 *
 * The motion itself is a pure CSS keyframe (`.route-fade`, see globals.css):
 * a fresh DOM node each navigation auto-replays it — SSR-safe, no JS animation,
 * no hydration mismatch. `prefers-reduced-motion` disables it in globals.css.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-fade">{children}</div>;
}
