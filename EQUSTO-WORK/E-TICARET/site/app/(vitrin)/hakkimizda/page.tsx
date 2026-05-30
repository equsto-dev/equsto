import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
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
      <main className="hk-main" id="hakkimizda">
        <h1 data-i18n="about.title">Hakkımızda</h1>
        <p className="hk-lead" data-i18n-html="about.lead_html">
          <strong>Equsto</strong>, Türkiye merkezli bir <strong>endüstriyel mutfak ve gastronomi platformudur</strong>.
          Restoran, otel, kafe, catering ve bulut mutfak projeleri için ekipman seçimi, kapasite planlaması ve marka
          danışmanlığı sunar; <strong>Proje Fabrikası (PFOS)</strong> ile ekipman listenizi ve teklif özetinizi{" "}
          <strong>5 dakika içinde</strong> oluşturur.
        </p>
        <div className="hk-box">
          <p style={{ margin: 0, fontSize: 14 }} data-i18n="about.company_box">
            <strong>Equsto Teknoloji Limited</strong> — Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği.
            Katalog: pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanları.
          </p>
        </div>
        <h2 data-i18n="about.what_h2">Ne yapıyoruz?</h2>
        <p data-i18n="about.what_p">
          Equsto, Türkiye&apos;de ve seçili ihracat pazarlarında endüstriyel mutfak ekipmanı satışı ile mutfak proje
          danışmanlığını tek çatı altında birleştirir.
        </p>
        <ul>
          <li data-i18n="about.bullet_catalog">
            <strong>Online katalog</strong> — binlerce SKU, departman filtreleri, teknik ölçüler
          </li>
          <li data-i18n="about.bullet_pfos">
            <strong>Proje Fabrikası</strong> — konsept, kapasite ve m²&apos;ye göre otomatik ekipman listesi
          </li>
          <li data-i18n="about.bullet_besos">
            <strong>Bar Design Studio · Besos</strong> — modüler bar ve IMT300 berrak buz çözümleri
          </li>
          <li data-i18n="about.bullet_sales">
            <strong>Satış mühendisliği</strong> — tesisat, lojistik ve marka alternatifleriyle net teklif
          </li>
        </ul>
        <h2 data-i18n="about.brands_h2">Endüstriyel mutfak ekipmanı markaları</h2>
        <p data-i18n="about.brands_p">
          Katalogda <strong>Öztiryakiler</strong>, <strong>Atalay</strong> ve seçili uluslararası mutfak markaları yer
          alır. Pişirme, soğutma, yıkama, hazırlık, kahve ve içecek hatları departman bazında listelenir.
        </p>
        <div className="hk-actions">
          <a className="hk-a-primary" href="/pfos" data-i18n="about.cta_pfos">
            Proje Fabrikası — teklif başlat
          </a>
          <a className="hk-a-secondary" href="/buradan-basladi" data-i18n="about.cta_story">
            Buradan başladık
          </a>
          <a className="hk-a-secondary" href="/contact" data-i18n="about.cta_contact">
            İletişim
          </a>
          <a className="hk-a-secondary" href="/shop/marka" data-i18n="about.cta_brands">
            Markalar
          </a>
        </div>
      </main>
    </VitrinShell>
  );
}
