import "@mantine/core/styles.css";
import "@/styles/custom.css";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { AiAssistant } from "@/components/ai";
import { Footer, Header, Providers } from "@/components";
import { JsonLd } from "@/components/layout/JsonLd";
import { PostHogInit } from "@/components/layout/PostHogInit";
import { SocialStats } from "@/components/layout/SocialStats";
import { UnhandledErrorLogger } from "@/components/layout/UnhandledErrorLogger";
import ClientParticles from "@/components/layout/ClientParticles";
import { SkipLink } from "@/components/layout/SkipLink";
import { baseURL, fonts, sameAs } from "@/config";
import { home, person } from "@/content";
import { generateMeta } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadataBase = new URL(baseURL);

export async function generateMetadata() {
  return {
    ...generateMeta({
      title: home.title,
      description: home.description,
      baseURL,
      path: home.path,
      image: home.image,
    }),
    metadataBase: new URL(baseURL),
    alternates: {
      canonical: baseURL,
      types: {
        "application/rss+xml": `${baseURL}/api/rss`,
      },
    },
    openGraph: {
      siteName: "flabs.tech",
      locale: "en_US",
      images: [
        {
          url: home.image,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: home.title,
      description: home.description,
      images: [home.image],
      site: "@fritzelborges",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fonts.heading.variable} ${fonts.body.variable} ${fonts.label.variable} ${fonts.code.variable}`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript />
      </head>
      <UnhandledErrorLogger />
      <body style={{ minHeight: "100vh", margin: 0, padding: 0 }}>
        <Providers>
          <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <ClientParticles quantity={60} staticity={30} ease={40} />
          </div>

          <div style={{ height: "16px" }} />
          <SkipLink />
          <Header />
          <main 
            style={{ flex: 1, width: "100%", padding: "var(--mantine-spacing-lg)" }}
            id="main-content"
          >
            {children}
          </main>
          <SocialStats />
          <Footer />
          <AiAssistant />
        </Providers>
      <Analytics />
      <SpeedInsights />
      <PostHogInit />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: person.name,
        url: baseURL,
        image: `${baseURL}${person.avatar}`,
        sameAs: Object.values(sameAs).filter((v): v is string => Boolean(v)),
        jobTitle: person.role,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Joinville",
          addressCountry: "BR",
        },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "flabs.tech",
        url: baseURL,
        description: home.description,
        author: {
          "@type": "Person",
          name: person.name,
        },
      }} />
    </body>
    </html>
  );
}
