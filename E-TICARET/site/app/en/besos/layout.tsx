import type { Metadata } from "next";

export { default } from "../../besos/layout";

export const metadata: Metadata = {
  title: "Besos · Bar Design Studio",
  description:
    "Besos · Bar Design Studio — modular cocktail bar stations for hotels and restaurants. Manhattan, Boulverdier, Clover and 42-module bar catalogue.",
  alternates: {
    canonical: "https://equsto.com/en/besos",
    languages: {
      tr: "https://equsto.com/besos",
      en: "https://equsto.com/en/besos",
    },
  },
  openGraph: {
    title: "Besos · Bar Design Studio",
    description:
      "Modular cocktail bar stations, bar equipment and IMT300 clear ice machine — Equsto Bar Design Studio.",
    url: "https://equsto.com/en/besos",
    type: "website",
    locale: "en_US",
    images: [{ url: "https://equsto.com/og-cover-besos.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Besos · Bar Design Studio",
    description: "Modular cocktail bar stations — Equsto Bar Design Studio.",
    images: ["https://equsto.com/og-cover-besos.jpg"],
  },
};
