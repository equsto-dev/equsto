import type { Metadata } from "next";
import BesosLayoutShell from "@/components/besos/BesosLayoutShell";

export const metadata: Metadata = {
  title: "Besos · Bar Design Studio",
  description:
    "Bar Design Studio — Manhattan, Boulverdier, Clover ve 42 modüllük bar katalog. Bar servisinin sanatını yükseltiyoruz.",
  alternates: {
    canonical: "https://equsto.com/besos",
    languages: {
      tr: "https://equsto.com/besos",
      en: "https://equsto.com/en/besos",
    },
  },
  openGraph: {
    title: "Besos · Bar Design Studio",
    description:
      "Modüler kokteyl bar istasyonları, bar ekipmanı ve IMT300 berrak buz makinesi — Equsto Bar Design Studio.",
    url: "https://equsto.com/besos",
    type: "website",
    locale: "tr_TR",
    images: [{ url: "https://equsto.com/og-cover-besos.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Besos · Bar Design Studio",
    description:
      "Modüler kokteyl bar istasyonları ve bar ekipmanı — Equsto Bar Design Studio.",
    images: ["https://equsto.com/og-cover-besos.jpg"],
  },
};

export default BesosLayoutShell;
