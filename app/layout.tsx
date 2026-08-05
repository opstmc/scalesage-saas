import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_URL,
} from "@/lib/seo";

// Self-hosted at build by next/font — no runtime request to Google (faster
// first paint + no visitor-IP leak before consent, keeping the GDPR promise).
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#0A1628",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s · ScaleSage",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "ScaleSage",
  keywords: [
    "business doctor",
    "AI systems for SMEs",
    "missed call recovery",
    "quote follow-up",
    "review automation",
    "AEO GEO visibility",
    "Catalyst diagnostic",
    "revenue leak",
  ],
  authors: [{ name: "ScaleSage" }],
  alternates: { canonical: "/" },
  // NOTE: deliberately NO `openGraph.url` here.
  //
  // Next.js merges metadata between segments shallowly, so any page that does
  // not export its own `openGraph` inherits THIS object entire. When this
  // carried `url: SITE_URL`, /how-it-works, /pricing, /partners and /industries
  // each inherited it and announced `og:url = homepage` while their canonical
  // said otherwise. Every page now builds its own via `pageMetadata()` in
  // `lib/seo.ts`, which derives canonical and og:url from one `path`. Do not
  // reintroduce a `url` on this object: it is the fault that page-level fixes
  // keep re-inheriting.
  openGraph: {
    type: "website",
    siteName: "ScaleSage",
    title: DEFAULT_TITLE,
    description: DEFAULT_SOCIAL_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_SOCIAL_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ScaleSage",
      legalName: "ScaleSage Ai Limited",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/scalesage-mark.png`,
      description:
        "The business doctor for growing SMEs. We diagnose the leak, build the systems that close it, and prove the result in numbers.",
      slogan: "Diagnose. Build. Prove.",
      foundingDate: "2026",
      areaServed: ["GB", "EU"],
      identifier: {
        "@type": "PropertyValue",
        propertyID: "Companies House registration number",
        value: "17232390",
      },
      // Verified Companies House record. Cy: append verified social profile URLs
      // (LinkedIn, X, Instagram, TikTok) to sameAs as each verification lands.
      sameAs: [
        "https://find-and-update.company-information.service.gov.uk/company/17232390",
      ],
      // Confirmed 4 Aug as the public contact address, and the same constant
      // the footer prints. A schema email that differs from the one on the page
      // is worse than none: it is the address an assistant will quote back.
      email: "admin@scalesage.ai",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "admin@scalesage.ai",
        areaServed: ["GB", "EU"],
        availableLanguage: "English",
      },
      // TODO (Cy, pending verification): add `telephone` and a PostalAddress
      // `address` (registered office) once those are confirmed. Left absent
      // rather than guessed: a wrong registered address in structured data is
      // a claim about a legal entity.
    },
    {
      "@type": "Service",
      serviceType: "AI systems & automation for SMEs",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: ["GB", "EU"],
    },
  ],
};
// FAQPage structured data now lives on /pricing (where the FAQ renders).

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Nav />
        {children}
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  );
}
