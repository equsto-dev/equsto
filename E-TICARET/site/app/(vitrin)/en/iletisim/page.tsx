import type { Metadata } from "next";
import IletisimPageContent from "@/components/vitrin/IletisimPageContent";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { CONTACT_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Contact · Equsto",
  description:
    "Contact Equsto: sales engineering, quotes, Project Factory (PFOS) and WhatsApp for commercial kitchen equipment.",
  alternates: {
    canonical: "https://equsto.com/en/iletisim",
    languages: { tr: "https://equsto.com/iletisim", en: "https://equsto.com/en/iletisim" },
  },
};

export default function EnIletisimPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-contact eq-iletisim" extraCss={CONTACT_PAGE_CSS}>
      <IletisimPageContent />
    </VitrinShell>
  );
}
