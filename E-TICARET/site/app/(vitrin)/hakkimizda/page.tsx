import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import HakkimizdaContent from "@/components/vitrin/HakkimizdaContent";
import { HAKKIMIZDA_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Hakkımızda · Equsto",
  description:
    "Equsto: Türkiye merkezli endüstriyel mutfak ve gastronomi platformu. Proje Fabrikası, katalog ve Bar Design Studio.",
  alternates: {
    canonical: "https://equsto.com/hakkimizda",
    languages: { tr: "https://equsto.com/hakkimizda", en: "https://equsto.com/en/about" },
  },
};

export default function HakkimizdaPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-hakkimizda" extraCss={HAKKIMIZDA_PAGE_CSS}>
      <HakkimizdaContent lang="tr" />
    </VitrinShell>
  );
}
