import type { Metadata } from "next";
import PfosPublicPage from "@/components/pfos/public/PfosPublicPage";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export const metadata: Metadata = {
  title: "Proje Fabrikası — Online Endüstriyel Mutfak Teklifi · Equsto",
  description:
    "Restoran, kafe, otel ve bulut mutfak projeleri için anında online mutfak ekipmanı teklifi.",
  alternates: {
    canonical: "https://equsto.com/pfos",
    languages: { tr: "https://equsto.com/pfos", en: "https://equsto.com/en/pfos" },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://equsto.com/pfos",
    title: "Proje Fabrikası — Online Endüstriyel Mutfak Teklifi · Equsto",
    description:
      "Restoran, otel, cafe ve bulut mutfak projeleri için anında online mutfak ekipmanı teklifi.",
    images: [{ url: "https://equsto.com/og-cover-pfos.jpg", width: 1200, height: 630 }],
  },
};

const v = SHOP_ASSET_V;

export default function PfosPage() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/theme.css?v=${v}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-pfos-public-chrome.css?v=${v}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-pfos-wizard.css?v=${v}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/contact.css?v=${v}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-mobile.css?v=${v}`} />
      <PfosPublicPage />
    </>
  );
}
