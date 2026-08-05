import type { NextConfig } from "next";

/**
 * Keep preview deployments out of the index.
 *
 * Vercel serves this exact build on `*.vercel.app` as well as on the real
 * domain: the project alias plus a per-deployment and per-branch URL. Those are
 * byte-identical copies of the marketing site on a host nobody chose, and they
 * compete with `www.scalesage.ai` for the same queries.
 *
 * The condition matches the `Host` header against a pattern that requires the
 * literal, dot-separated suffix `.vercel.app`, so it can only ever fire for a
 * Vercel preview host. `www.scalesage.ai` and `scalesage.ai` do not end in
 * `.vercel.app` and cannot match; nor can a lookalike such as
 * `notvercel.app`, because the leading dot is mandatory. Blocking the live
 * domain by accident would be far worse than the duplicate, so the rule is
 * written as an allow-nothing-by-default match on the preview suffix only —
 * never as a "not the production host" negation, which would fail open on any
 * host we forgot about.
 *
 * `X-Robots-Tag` is used rather than a meta tag because the tag would have to
 * be baked into the statically prerendered HTML, which is shared by both hosts.
 * A response header can vary by host; the HTML cannot.
 *
 * Note the canonical on every preview page already points at
 * `www.scalesage.ai`, so the two signals agree: this copy is not the original,
 * and should not be indexed.
 */
const PREVIEW_HOST = "(?:.*\\.)?vercel\\.app";

/* The unsubscribe endpoint lives on the API, but the link in a cold email has to
 * be on the brand domain: a recipient who is already annoyed enough to opt out
 * should not be sent to a hostname they have never seen, and a link that looks
 * unrelated to the sender reads as phishing.
 *
 * So /u/* is proxied rather than reimplemented. The endpoint returns a complete
 * self-contained page and its form posts to a relative path, so both the GET and
 * the POST land back here and forward correctly. Reimplementing it on this side
 * would put a second copy of a legal mechanism in a second repo, and the two
 * would drift.
 *
 * A rewrite, not a redirect: RFC 8058 one-click sends a POST, and a 30x would
 * turn it into a GET on most clients, which the endpoint deliberately treats as
 * non-destructive. The unsubscribe would silently do nothing.
 */
const API_ORIGIN = (
  process.env.NEXT_PUBLIC_SAGE_API_BASE ?? "https://api.scalesage.ai"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/u/:prospectId", destination: `${API_ORIGIN}/u/:prospectId` }];
  },

  async headers() {
    return [
      {
        // Every path, including /robots.txt and /sitemap.xml.
        source: "/:path*",
        has: [{ type: "host", value: PREVIEW_HOST }],
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
