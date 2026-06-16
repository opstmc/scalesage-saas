import type { Metadata } from "next";
import "./globals.css";
import JourneyProvider from "@/components/JourneyProvider";

const SITE_URL = "https://scalesage.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ScaleSage — AI & Automation Specialists",
    template: "%s · ScaleSage",
  },
  description:
    "AI & automation specialists who diagnose your business, build custom AI systems you own, and prove the results in numbers. Diagnose. Build. Prove.",
  applicationName: "ScaleSage",
  keywords: [
    "AI automation specialists",
    "custom AI agents",
    "revenue recovery",
    "AEO",
    "GEO",
    "AI search visibility",
    "MEP",
    "Catalyst Diagnostic",
  ],
  authors: [{ name: "ScaleSage" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "ScaleSage",
    title: "ScaleSage — AI & Automation Specialists",
    description:
      "We diagnose your business, build custom AI systems you own, and prove the results. Not an agency — a specialist team.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScaleSage — AI & Automation Specialists",
    description:
      "We diagnose your business, build custom AI systems you own, and prove the results. Not an agency — a specialist team.",
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
      url: SITE_URL,
      description:
        "AI & automation specialists who diagnose, build custom AI systems you own, and prove the results.",
      slogan: "Diagnose. Build. Prove.",
    },
    {
      "@type": "Service",
      serviceType: "AI & Automation",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "GB",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the Catalyst Diagnostic?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A paid, structured diagnosis of your business. Before any call, our agents study your site, reviews and competitor stack and build a working demo of the highest-leverage fixes. You keep the report either way.",
          },
        },
        {
          "@type": "Question",
          name: "Do I own what you build?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Every system and agent we build is owned by you. No templates, no lock-in.",
          },
        },
        {
          "@type": "Question",
          name: "How does pricing work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tiers are public. Local from £297/mo, Business from £997/mo, Enterprise from £9,997/mo. The diagnostic fee is credited in full against your first retainer if you sign within 60 days.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <JourneyProvider>{children}</JourneyProvider>
      </body>
    </html>
  );
}
