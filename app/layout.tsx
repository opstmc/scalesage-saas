import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

// Self-hosted at build by next/font — no runtime request to Google (faster
// first paint + no visitor-IP leak before consent, keeping the GDPR promise).
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

const SITE_URL = "https://scalesage.ai";

export const viewport: Viewport = {
  themeColor: "#0A1628",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ScaleSage, Diagnose. Build. Prove.",
    template: "%s · ScaleSage",
  },
  description:
    "Your business is leaking. We find it, fix it, and prove it. ScaleSage is the business doctor for growing SMEs, we diagnose the leak, install the systems that restore your execution bandwidth, and prove the result in numbers.",
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
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "ScaleSage",
    title: "ScaleSage, Diagnose. Build. Prove.",
    description:
      "Your business is leaking. We find it, fix it, and prove it. The operating system for growing SMEs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScaleSage, Diagnose. Build. Prove.",
    description:
      "Your business is leaking. We find it, fix it, and prove it. The operating system for growing SMEs.",
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
        "The business doctor for growing SMEs. We diagnose the leak, build the systems that close it, and prove the result in numbers.",
      slogan: "Diagnose. Build. Prove.",
      areaServed: ["GB", "EU"],
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
