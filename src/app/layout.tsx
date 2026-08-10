import "@mantine/core/styles.css";
import "@/styles/custom.css";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { AiAssistant } from "@/components/ai";
import { Footer, Header, Providers } from "@/components";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { JsonLd } from "@/components/layout/JsonLd";
import { PostHogInit } from "@/components/layout/PostHogInit";
import { SocialStats } from "@/components/layout/SocialStats";
import { TrackingProvider } from "@/components/layout/TrackingProvider";
import { UnhandledErrorLogger } from "@/components/layout/UnhandledErrorLogger";
import ClientParticles from "@/components/layout/ClientParticles";
import { SkipLink } from "@/components/layout/SkipLink";
import { baseURL, fonts, sameAs } from "@/config";
import { home, person } from "@/content";
import { generateMeta } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsightsWithRedaction } from "@/components/layout/SpeedInsightsWithRedaction";

import type { Viewport } from "next";
import { cookies } from "next/headers";
import { CONSENT_COOKIE } from "@/lib/tracking";
import { auth } from "@/auth";

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
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const initialConsent = cookieStore.get(CONSENT_COOKIE)?.value ?? null;
  const user = session?.user?.id
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        login: session.user.login,
      }
    : undefined;

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fonts.heading.variable} ${fonts.body.variable} ${fonts.label.variable} ${fonts.code.variable}`}
      {...mantineHtmlProps}
    >
      <head>
        {/* Must mirror MantineProvider defaultColorScheme, or the pre-paint
            script resolves unset preferences to light → light flash during load */}
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <UnhandledErrorLogger />
      <body style={{ minHeight: "100vh", margin: 0, padding: 0 }}>
        <Providers user={user}>
          <PostHogInit />
          <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <ClientParticles quantity={120} staticity={30} ease={40} />
          </div>

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
          <ConsentBanner initialConsent={initialConsent} />
        </Providers>
        <TrackingProvider />
      <Analytics />
      <SpeedInsightsWithRedaction />
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
