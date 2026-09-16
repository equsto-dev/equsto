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
};

export default BesosLayoutShell;
