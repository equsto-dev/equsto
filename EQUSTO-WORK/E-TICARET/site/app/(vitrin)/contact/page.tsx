import type { Metadata } from "next";
import ContactKonuBanner from "@/components/vitrin/ContactKonuBanner";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { CONTACT_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "İletişim ve teklif · Equsto",
  description: "Equsto satış mühendisliği: restoran, otel, kafe ve catering projeleri için teklif, PFOS ve WhatsApp hattı.",
  alternates: {
    canonical: "https://equsto.com/contact",
    languages: { tr: "https://equsto.com/contact", en: "https://equsto.com/en/contact" },
  },
};

export default function ContactPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-contact" extraCss={CONTACT_PAGE_CSS}>
      <ContactKonuBanner />
      <main className="ct-main">
        <h1 data-i18n="contact.title">İletişim ve teklif</h1>
        <p className="ct-lead" data-i18n-html="contact.lead_html">
          Vitrinde <strong>anında ödeme ile sepet satışı</strong> yerine Equsto <strong>Satış Mühendisliği</strong> hattı
          kullanılır: ölçü, tesisat ve lojistik netleştikten sonra teklif ve sipariş akışı buradan yürütülür. Sağ alttaki
          WhatsApp düğmesinden de yazabilirsiniz; <code>konu</code> ile geldiyseniz mesaj metni otomatik dolar.
        </p>
        <p id="ct-konu" className="ct-konu" role="status" aria-live="polite" />
        <div className="ct-actions">
          <a className="ct-a-primary" href="/pfos" data-i18n="contact.cta_pfos">
            Proje Fabrikası — mutfak teklifi
          </a>
          <a className="ct-a-secondary" href="/besos" data-i18n="contact.cta_besos">
            Bar Design Studio — Besos
          </a>
          <a className="ct-a-secondary" href="/besos/imt300" data-i18n="contact.cta_imt300">
            IMT300 ürün sayfası
          </a>
        </div>
        <p className="ct-lead" style={{ marginBottom: 12 }} data-i18n="contact.where_h">
          Nereye tıklamalısınız?
        </p>
        <ul className="ct-list">
          <li data-i18n="contact.where_besos">
            <strong>Besos</strong> üzerindeki «Satın Al» şu an sizi bu sayfaya veya WhatsApp ön metnine yönlendirir; gerçek
            satın alma Equsto ekibi ile netleşir.
          </li>
          <li data-i18n="contact.where_catalog">
            <strong>Katalog ürünleri</strong> için vitrin sepeti kullanılabilir; kurumsal projelerde yine{" "}
            <strong>Proje Fabrikası</strong> veya bu iletişim hattı tercih edilir.
          </li>
          <li data-i18n="contact.where_imt300">
            <strong>IMT300</strong> için teknik detay: <a href="/besos/imt300">IMT300</a> sayfası; teklif aynı hattan.
          </li>
        </ul>
      </main>
    </VitrinShell>
  );
}
