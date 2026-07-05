import type { MetadataRoute } from "next";

const SITE = "https://scalesage.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/how-it-works", "/industries", "/pricing", "/about"];
  return paths.map((p) => ({
    url: `${SITE}${p}`,
    changeFrequency: "monthly",
    priority: p === "/" ? 1 : 0.8,
  }));
}
