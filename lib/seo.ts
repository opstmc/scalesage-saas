import type { Metadata, ResolvingMetadata } from "next";

/**
 * One source of truth for every absolute URL the site publishes.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Next.js merges metadata between segments *shallowly*: a page that does not
 * export its own `openGraph` inherits the root layout's `openGraph` object
 * wholesale — including its `url`. That is exactly how /how-it-works, /pricing,
 * /partners and /industries all came to advertise `og:url = the homepage`:
 * every one of them set `alternates.canonical` (a top-level key, merged fine)
 * but none set `openGraph`, so all four silently inherited the layout's
 * homepage `og:url`. Shared to social or read by a crawler, four pages claimed
 * to be the homepage.
 *
 * The fix is structural, not per-page: `pageMetadata()` below derives the
 * canonical AND the og:url from ONE `path` argument, so they cannot diverge,
 * and the root layout no longer declares an `openGraph.url` for anything to
 * inherit. A new page that forgets to use this helper ends up with NO og:url
 * (absent, and therefore harmless) rather than a confidently wrong one.
 *
 * HOST
 * ----
 * The apex `scalesage.ai` 308-redirects to `www.scalesage.ai` on Vercel, so
 * `www` is the host that is actually served with a 200. Canonicals must name a
 * URL that resolves directly, never one that permanently redirects, so `www` is
 * the canonical host here, in the sitemap, in robots.txt and in llms.txt.
 * Change this constant and every one of those follows.
 */
export const SITE_URL = "https://www.scalesage.ai";

/** Bare hostname of the canonical origin, e.g. for host comparisons. */
export const SITE_HOST = new URL(SITE_URL).host;

/** Default (homepage) title and description — shared by the root layout and `/`. */
export const DEFAULT_TITLE = "ScaleSage, Diagnose. Build. Prove.";

export const DEFAULT_DESCRIPTION =
  "Your business is leaking. We find it, fix it, and prove it. ScaleSage is the business doctor for growing SMEs, we diagnose the leak, install the systems that restore your execution bandwidth, and prove the result in numbers.";

/** The short social-card description used when a page does not override it. */
export const DEFAULT_SOCIAL_DESCRIPTION =
  "Your business is leaking. We find it, fix it, and prove it. The operating system for growing SMEs.";

/** Mirrors the root layout's `title.template`, for building og:title. */
export function withBrand(title: string): string {
  return `${title} · ScaleSage`;
}

/** Site-relative path -> absolute URL on the canonical host. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString().replace(/\/$/, "") || SITE_URL;
}

type PageMetaInput = {
  /** Site-relative path, e.g. "/pricing" or "/". Drives canonical AND og:url. */
  path: string;
  /**
   * Page title, run through the root layout's "%s · ScaleSage" template.
   * Omit on the homepage so it keeps the untemplated default title.
   */
  title?: string;
  /** Meta description. Also the og/twitter description unless overridden. */
  description: string;
  /** Optional shorter title for social cards. Defaults to `title · ScaleSage`. */
  socialTitle?: string;
  /** Optional shorter description for social cards. Defaults to `description`. */
  socialDescription?: string;
};

/**
 * Build a page's metadata with the canonical and og:url guaranteed to agree.
 *
 * Returns a `generateMetadata` function, not a plain object, for one reason:
 * the social card images come from the `app/opengraph-image.tsx` and
 * `app/twitter-image.tsx` file conventions, which attach to the ROOT segment's
 * metadata. Because segment merging replaces the whole `openGraph` object, any
 * page that declares its own `openGraph` silently drops the card image — which
 * is exactly what /catalyst was already doing before this helper existed: it
 * shared with no picture at all. Reading `parent` re-attaches the inherited
 * images (hashed cache-busting query and all) instead of hardcoding a second
 * copy of the image URL and its dimensions here, which would drift.
 *
 * Canonical and og:url are both emitted as paths relative to `metadataBase`
 * (set from `SITE_URL` in the root layout), so the host is declared in exactly
 * one place in the repo, and the two can never name different URLs.
 *
 * Usage: `export const generateMetadata = pageMetadata({ path: "/pricing", … })`
 */
export function pageMetadata({
  path,
  title,
  description,
  socialTitle,
  socialDescription,
}: PageMetaInput) {
  return async function generateMetadata(
    _props: unknown,
    parent: ResolvingMetadata,
  ): Promise<Metadata> {
    const ogTitle = socialTitle ?? (title ? withBrand(title) : DEFAULT_TITLE);
    const ogDescription = socialDescription ?? description;

    const inherited = await parent;
    const ogImages = inherited.openGraph?.images ?? undefined;
    const twitterImages = inherited.twitter?.images ?? undefined;

    return {
      ...(title ? { title } : {}),
      description,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        siteName: "ScaleSage",
        // Relative — resolved against `metadataBase`. Same `path` as the
        // canonical above, by construction.
        url: path,
        title: ogTitle,
        description: ogDescription,
        ...(ogImages ? { images: ogImages } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        ...(twitterImages ? { images: twitterImages } : {}),
      },
    };
  };
}
