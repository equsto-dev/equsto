import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalSiteJsonLd from "@/components/seo/GlobalSiteJsonLd";
import SiteDiscoveryFaqJsonLd from "@/components/seo/SiteDiscoveryFaqJsonLd";
import AnalyticsScripts from "@/components/seo/AnalyticsScripts";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Equsto | Endüstriyel Mutfak & Gastronomi Platformu",
  description:
    "Equsto — Türkiye endüstriyel mutfak ekipmanı, Öztiryakiler yetkili bayii, PFOS ile 5 dakikada restoran mutfak teklifi. Restoran, otel, kafe, bulut mutfak.",
  metadataBase: new URL("https://equsto.com"),
  alternates: {
    types: {
      "text/plain": [{ url: "/llms.txt", title: "Equsto — LLMs" }],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AnalyticsScripts />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href={`/eq-mobile.css?v=${SHOP_ASSET_V}`} />
        <GlobalSiteJsonLd />
        <SiteDiscoveryFaqJsonLd />
        <div id="eq-shop-chrome-root" />
        {children}
      </body>
    </html>
  );
}
