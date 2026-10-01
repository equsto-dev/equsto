import type { Metadata } from "next";
import Link from "next/link";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { KARIYER_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Kariyer · Equsto",
  description:
    "Equsto kariyer: satış mühendisliği, proje danışmanlığı, katalog, yazılım ve operasyon alanlarında iş fırsatları. CV'nizi info@equsto.com adresine gönderin.",
  alternates: {
    canonical: "https://equsto.com/kariyer",
    languages: { tr: "https://equsto.com/kariyer", en: "https://equsto.com/en/careers" },
  },
};

export default function KariyerPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-kariyer" extraCss={KARIYER_PAGE_CSS}>
      <main className="kr-main" id="kariyer">
        <h1 data-i18n="kariyer.title">Kariyer</h1>
        <p className="kr-lead" data-i18n="kariyer.lead">
          Equsto; restoran, otel, kafe ve catering projelerine ekipman ve teknoloji hizmeti sunan bir endüstriyel
          mutfak platformudur. Ekibimiz için satış mühendisliği, proje, katalog, yazılım ve operasyon alanlarında
          yetenekler arıyoruz.
        </p>
        <h2 data-i18n="kariyer.depts_h2">Çalışma alanlarımız</h2>
        <ul className="kr-depts">
          <li data-i18n="kariyer.dept_sales">
            <strong>Satış mühendisliği</strong> — teklif, tesisat ve marka alternatifleri
          </li>
          <li data-i18n="kariyer.dept_project">
            <strong>Proje danışmanlığı</strong> — konsept, kapasite ve m² planlaması (PFOS)
          </li>
          <li data-i18n="kariyer.dept_catalog">
            <strong>Katalog ve veri</strong> — ürün kartları, ölçüler, fiyatlandırma
          </li>
          <li data-i18n="kariyer.dept_software">
            <strong>Yazılım ve dijital</strong> — vitrin, Proje Fabrikası, otomasyon
          </li>
          <li data-i18n="kariyer.dept_ops">
            <strong>Lojistik ve operasyon</strong> — sevkiyat, montaj koordinasyonu
          </li>
        </ul>
        <h2 data-i18n="kariyer.apply_h2">Başvuru</h2>
        <p data-i18n="kariyer.apply_p">
          CV&apos;nizi ve kısa bir tanıtım yazısını info@equsto.com adresine gönderebilirsiniz; başvurunuz ilgili
          departman tarafından değerlendirilir.
        </p>
        <div className="kr-actions">
          <a className="kr-a-primary" href="mailto:info@equsto.com" data-i18n="kariyer.cta_mail">
            CV gönder — info@equsto.com
          </a>
          <Link className="kr-a-secondary" href="/iletisim" data-i18n="kariyer.cta_contact">
            İletişim
          </Link>
        </div>
      </main>
    </VitrinShell>
  );
}
