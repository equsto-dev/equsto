import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalSiteJsonLd from "@/components/seo/GlobalSiteJsonLd";
import SiteDiscoveryFaqJsonLd from "@/components/seo/SiteDiscoveryFaqJsonLd";
import AnalyticsScripts from "@/components/seo/AnalyticsScripts";
import CookieConsentBanner from "@/components/seo/CookieConsentBanner";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#001e50" },
    { media: "(prefers-color-scheme: dark)", color: "#001e50" },
  ],
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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/eq/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/eq/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/eq/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/eq/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Equsto",
  },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search);var f=q.get("mobile")||q.get("eq-device");var k;if(f==="1"||f==="phone")k="phone";else if(f==="0"||f==="desktop")k="desktop";else if(f==="tablet")k="tablet";if(!k){try{var s=sessionStorage.getItem("eq-device-force");if(s==="phone"||s==="tablet"||s==="desktop")k=s;}catch(e){}}if(!k){var ua=navigator.userAgent||"";if(/iPhone|iPod|Windows Phone|webOS|BlackBerry/i.test(ua)||(/Android/i.test(ua)&&/Mobile/i.test(ua))||(navigator.userAgentData&&navigator.userAgentData.mobile))k="phone";else if(/iPad/i.test(ua)||(/Android/i.test(ua)&&!/Mobile/i.test(ua))||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))k="tablet";else if(window.matchMedia("(pointer: coarse)").matches)k=innerWidth<=900?"phone":"tablet";else k="desktop";}if(f==="1"||f==="phone"||f==="0"||f==="desktop"||f==="tablet"){try{sessionStorage.setItem("eq-device-force",k);}catch(e2){}}var r=document.documentElement;r.classList.add("eq-device-"+k);r.setAttribute("data-eq-device",k);}catch(e3){document.documentElement.classList.add("eq-device-desktop");}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AnalyticsScripts />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href={`/eq-mobile.css?v=${SHOP_ASSET_V}&m=20260919-shell`} />
        <GlobalSiteJsonLd />
        <SiteDiscoveryFaqJsonLd />
        <div id="eq-shop-chrome-root" />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}