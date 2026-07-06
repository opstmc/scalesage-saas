import type { MetadataRoute } from "next";

const SITE = "https://scalesage.ai";

// priority by role: home + the scan highest, primary pages next, legal lowest.
const ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/catalyst", priority: 0.9 },
  { path: "/how-it-works", priority: 0.8 },
  { path: "/industries", priority: 0.8 },
  { path: "/pricing", priority: 0.8 },
  { path: "/frontier", priority: 0.7 },
  { path: "/about", priority: 0.6 },
  { path: "/stack-updates", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/cookies", priority: 0.3 },
  { path: "/security", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${SITE}${r.path}`,
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
