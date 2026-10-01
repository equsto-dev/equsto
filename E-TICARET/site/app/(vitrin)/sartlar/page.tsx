import type { Metadata } from "next";
import Link from "next/link";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { HAKKIMIZDA_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Şartlar ve Koşullar · Equsto",
  description:
    "Equsto satış şartları ve koşulları: teklif geçerliliği, ödeme, teslim, montaj ve nakliye koşulları. Yazılı tekliflerle aynı şartlar.",
  alternates: {
    canonical: "https://equsto.com/sartlar",
    languages: { tr: "https://equsto.com/sartlar", en: "https://equsto.com/en/terms" },
  },
};

export default function SartlarPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-legal" extraCss={HAKKIMIZDA_PAGE_CSS}>
      <main className="hk-main" id="sartlar">
        <h1 data-i18n="sartlar.title">Şartlar ve Koşullar</h1>
        <p className="hk-lead" data-i18n-html="sartlar.lead_html">
          Bu sayfa, <strong>equsto.com</strong> üzerinden gerçekleşen satış ve teklif süreçlerine uygulanan şartları
          açıklar. İade ve cayma koşulları için{" "}
          <Link href="/iade-politikasi">İade ve cayma politikası</Link>, kişisel veriler için{" "}
          <Link href="/kvkk">KVKK ve gizlilik</Link> sayfalarına bakınız.
        </p>

        <div className="hk-box">
          <p style={{ margin: 0, fontSize: 14 }} data-i18n-html="sartlar.seller_html">
            <strong>Satıcı:</strong> Equsto Teknoloji Limited · <strong>Ülke:</strong> Türkiye ·{" "}
            <strong>İletişim:</strong> <a href="mailto:info@equsto.com">info@equsto.com</a> ·{" "}
            <Link href="/iletisim">İletişim formu</Link>
          </p>
        </div>

        <h2 data-i18n="sartlar.terms_h2">Satış şartlarımız</h2>
        <p data-i18n="sartlar.terms_intro">
          Aşağıdaki şartlar, yazılı tekliflerimizde ve siparişlerimizde uygulanan şartlarla aynıdır.
        </p>
        <ol className="hk-summary">
          <li data-i18n="sartlar.t1">Teklifimiz 7 (YEDİ) gün geçerlidir.</li>
          <li data-i18n="sartlar.t2">
            Fiyatlarımıza KDV dahil değildir, faturada ayrıca eklenecektir.
          </li>
          <li data-i18n="sartlar.t3">
            Faturamız TL olarak kesilecektir. Tutarlar TCMB Efektif Satış Kuru üzerinden hesaplanmıştır.
          </li>
          <li data-i18n="sartlar.t4">
            Ödeme; siparişte %50 peşin banka havalesi, kalanı mal tesliminden önce banka havalesi şeklindedir.
          </li>
          <li data-i18n="sartlar.t5">
            Ödeme şartlarının yerine getirilmesi ile birlikte teklif sipariş statüsüne geçer.
          </li>
          <li data-i18n="sartlar.t6">
            Montaj satıcıya aittir. Her türlü tesisat ve sarf malzemesi alıcıya aittir.
          </li>
          <li data-i18n="sartlar.t7">Nakliye ve nakliye sigortası alıcıya aittir.</li>
          <li data-i18n="sartlar.t8">
            Her türlü yatay ve dikey taşımacılık alıcıya aittir. Kamyon üstü teslimdir.
          </li>
          <li data-i18n="sartlar.t9">Teslim yeri müşteri adresidir.</li>
          <li data-i18n="sartlar.t10">
            Teslim süresi: kesin siparişinizi takiben 6-8 hafta (üretim programına göre teyit).
          </li>
          <li data-i18n="sartlar.t11">
            Soğuk odalarda dış ünite mesafesi 10-12 m olarak fiyatlandırılmıştır.
          </li>
          <li data-i18n="sartlar.t12">
            İş kapsamında değişiklik olması durumunda karşılıklı mutabakatla teklif revize edilir.
          </li>
          <li data-i18n="sartlar.t13">
            Ölçü bekler çözümünün siparişten sonraki 1 ay içinde tamamlanması gerekir.
          </li>
          <li data-i18n="sartlar.t14">Zamanında ödenmeyen bedel için aylık %5 vade farkı uygulanır.</li>
          <li data-i18n="sartlar.t15">
            {"Depoda 1 aydan fazla bekleyen mallar için aylık sipariş bedelinin %5'i depo kirasıdır."}
          </li>
          <li data-i18n="sartlar.t16">
            Dijital mutabakatlar yazılı mutabakat gibi sonuç doğurur.
          </li>
          <li data-i18n="sartlar.t17">
            Equsto.com yapay zekadan yardım alır; hata yapabilir. Nihai teyit satıcı onayındadır.
          </li>
        </ol>

        <p className="hk-en" data-i18n-html="sartlar.updated_html">
          Son güncelleme: Ekim 2026 · Şartlar URL:{" "}
          <a href="https://equsto.com/sartlar">equsto.com/sartlar</a>
        </p>

        <div className="hk-actions">
          <Link className="hk-a-primary" href="/iletisim" data-i18n="sartlar.cta_contact">
            Soru — iletişim
          </Link>
          <Link className="hk-a-secondary" href="/iade-politikasi" data-i18n="sartlar.cta_returns">
            İade politikası
          </Link>
        </div>
      </main>
    </VitrinShell>
  );
}
