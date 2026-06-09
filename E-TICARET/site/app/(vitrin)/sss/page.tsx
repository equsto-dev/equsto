import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import SssScripts from "@/components/vitrin/SssScripts";
import { SSS_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Sıkça sorulan sorular · Equsto",
  description:
    "Equsto SSS: teklif, Proje Fabrikası (PFOS), fiyatlandırma, teslimat, ödeme, garanti ve kişisel veriler hakkında yanıtlar.",
  alternates: {
    canonical: "https://equsto.com/sss",
    languages: { tr: "https://equsto.com/sss", en: "https://equsto.com/en/sss" },
  },
};

export default function SssPage() {
  return (
    <>
      <VitrinShell bodyClass="eq-shop eq-sss" extraCss={SSS_PAGE_CSS}>
        <main className="eq-sss-main" id="eq-sss">
          <a className="eq-sss-back" href="/" data-i18n="footer.sss_back">
            ← Size yardımcı olalım
          </a>
          <h1 data-i18n="footer.faq_title">Sıkça sorulan sorular</h1>
          <p className="eq-sss-lead" data-i18n="footer.faq_intro">
            Equsto endüstriyel mutfak ekipmanı, proje teklifi, Proje Fabrikası (PFOS) ve satış süreçleri hakkında
            yaygın sorular.
          </p>
          <div className="eq-sss-list" id="eq-sss-list" aria-live="polite" />
          <div className="eq-sss-actions">
            <a className="eq-sss-a-primary" href="/iletisim" data-i18n="footer.link_quote">
              Teklif ve proje talebi
            </a>
            <a className="eq-sss-a-secondary" href="/pfos" data-i18n="nav.pfos">
              Proje Fabrikası
            </a>
            <a className="eq-sss-a-secondary" href="/hakkimizda" data-i18n="footer.link_about">
              Equsto hakkında
            </a>
          </div>
        </main>
      </VitrinShell>
      <SssScripts />
    </>
  );
}
