import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import HakkimizdaContent from "@/components/vitrin/HakkimizdaContent";
import { HAKKIMIZDA_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "About Equsto",
  description:
    "Equsto: Turkey-based industrial kitchen and gastronomy platform. Project Factory, catalogue and Bar Design Studio.",
  alternates: {
    canonical: "https://equsto.com/en/about",
    languages: { tr: "https://equsto.com/hakkimizda", en: "https://equsto.com/en/about" },
  },
};

export default function EnAboutPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-hakkimizda" extraCss={HAKKIMIZDA_PAGE_CSS}>
      <HakkimizdaContent lang="en" />
    </VitrinShell>
  );
}
