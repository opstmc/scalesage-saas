import type { Metadata } from "next";

/**
 * The token report is a private document reached from one person's email. It
 * had no metadata of its own, so it inherited the root layout's
 * `robots: { index: true, follow: true }` — an open invitation to index a
 * secret-token URL and, with it, someone's diagnostic.
 *
 * The page itself is a client component and so cannot export `metadata`; this
 * layout is the only place the noindex can live. Deliberately NOT also blocked
 * in robots.txt: a disallowed URL is never fetched, so the noindex would never
 * be read. Allow the crawl, refuse the index.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
