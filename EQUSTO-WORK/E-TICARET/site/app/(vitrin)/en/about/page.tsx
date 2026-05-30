import type { Metadata } from "next";
import HakkimizdaPage from "../../hakkimizda/page";

export const metadata: Metadata = {
  title: "About Equsto · Equsto",
  description:
    "Equsto: Turkey-based industrial kitchen and gastronomy platform. Project Factory, catalogue and Bar Design Studio.",
  alternates: {
    canonical: "https://equsto.com/en/about",
    languages: { tr: "https://equsto.com/hakkimizda", en: "https://equsto.com/en/about" },
  },
};

export default HakkimizdaPage;
