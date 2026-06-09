import type { Metadata } from "next";
import IletisimPageContent from "@/components/vitrin/IletisimPageContent";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { CONTACT_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "İletişim · Equsto",
  description:
    "Equsto iletişim: satış mühendisliği, teklif, Proje Fabrikası ve WhatsApp hattı. İstanbul merkezli endüstriyel mutfak ekipmanı.",
  alternates: {
    canonical: "https://equsto.com/iletisim",
    languages: { tr: "https://equsto.com/iletisim", en: "https://equsto.com/en/iletisim" },
  },
};

export default function IletisimPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-contact eq-iletisim" extraCss={CONTACT_PAGE_CSS}>
      <IletisimPageContent />
    </VitrinShell>
  );
}
