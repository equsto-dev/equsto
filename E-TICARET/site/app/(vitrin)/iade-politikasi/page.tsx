import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { HAKKIMIZDA_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "İade ve cayma politikası · Equsto",
  description:
    "Equsto iade, cayma ve garanti koşulları. Endüstriyel mutfak ekipmanı siparişleri için iade süreci, süreler ve iletişim.",
  alternates: {
    canonical: "https://equsto.com/iade-politikasi",
    languages: {
      tr: "https://equsto.com/iade-politikasi",
      en: "https://equsto.com/en/return-policy",
    },
  },
};

export default function IadePolitikasiPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-legal" extraCss={HAKKIMIZDA_PAGE_CSS}>
      <main className="hk-main" id="iade-politikasi">
        <h1 data-i18n="returns.title">İade ve cayma politikası</h1>
        <p className="hk-lead" data-i18n-html="returns.lead_html">
          Bu sayfa, <strong>equsto.com</strong> üzerinden sunulan ürün ve hizmetler için iade, cayma ve ayıplı mal
          süreçlerini açıklar. <strong>Equsto Teknoloji Limited</strong> endüstriyel mutfak ekipmanında B2B ve proje
          satışına odaklanır; tüketici alımlarında 6502 sayılı Kanun kapsamındaki haklar saklıdır.
        </p>

        <div className="hk-box">
          <p style={{ margin: 0, fontSize: 14 }} data-i18n-html="returns.seller_html">
            <strong>Satıcı:</strong> Equsto Teknoloji Limited · <strong>İletişim:</strong>{" "}
            <a href="mailto:info@equsto.com">info@equsto.com</a> ·{" "}
            <a href="/contact">İletişim formu</a> ve site içi WhatsApp hattı
          </p>
        </div>

        <h2 data-i18n="returns.scope_h2">1. Kapsam</h2>
        <p data-i18n="returns.scope_p">
          Politika; katalogda listelenen stok ve sipariş üzerine tedarik edilen endüstriyel mutfak ekipmanları ile
          vitrin sepeti veya yazılı teklif onayı sonrası oluşan siparişleri kapsar. Montaj, tesisat ve proje
          mühendisliği hizmetleri ayrı sözleşme ve teklif metninde düzenlenir.
        </p>

        <h2 data-i18n="returns.withdrawal_h2">2. Cayma hakkı (tüketici)</h2>
        <p data-i18n="returns.withdrawal_p">
          Tüketici sıfatıyla mesafeli sözleşme kuran müşteriler, teslimattan itibaren <strong>14 gün</strong> içinde
          herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildirimi yazılı olarak{" "}
          <a href="mailto:info@equsto.com">info@equsto.com</a> adresine veya{" "}
          <a href="/contact">iletişim</a> kanallarımıza iletilmelidir.
        </p>
        <ul>
          <li data-i18n="returns.withdrawal_ex1">
            Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda üretilen / özelleştirilen ürünler
          </li>
          <li data-i18n="returns.withdrawal_ex2">
            Montajı yapılmış, ambalajı açılmış ve hijyen veya teknik bütünlük açısından yeniden satılamayacak ekipmanlar
          </li>
          <li data-i18n="returns.withdrawal_ex3">
            Sipariş üzerine ithal / özel üretim kalemler (teklifte aksi belirtilmedikçe)
          </li>
        </ul>
        <p data-i18n="returns.withdrawal_note">
          Cayma hakkının kullanılması halinde, yasal süre içinde ürün bedeli (varsa standart teslimat ücreti düşülerek)
          ödeme yönteminize iade edilir; iade, ürünün satıcıya ulaşmasından sonra en geç <strong>14 iş günü</strong>{" "}
          içinde tamamlanır.
        </p>

        <h2 data-i18n="returns.conditions_h2">3. İade koşulları</h2>
        <ul>
          <li data-i18n="returns.cond1">
            İade öncesinde <strong>info@equsto.com</strong> üzerinden iade talebi açılmalı ve onay numarası (RMA)
            alınmalıdır.
          </li>
          <li data-i18n="returns.cond2">
            Ürün, orijinal ambalajında, eksiksiz aksesuar ve belgelerle, kullanılmamış ve satılabilir durumda olmalıdır.
          </li>
          <li data-i18n="returns.cond3">
            Taşıma sırasında oluşan hasarlar taşıyıcı tutanağı ile birlikte en geç <strong>48 saat</strong> içinde
            bildirilmelidir.
          </li>
        </ul>

        <h2 data-i18n="returns.nonreturn_h2">4. İade kabul edilmeyen durumlar</h2>
        <ul>
          <li data-i18n="returns.nr1">Müşteri ölçü / model onayı sonrası üretilen özel siparişler</li>
          <li data-i18n="returns.nr2">Kurulumu yapılmış veya devreye alınmış sabit ekipmanlar (ayıplı ise madde 5)</li>
          <li data-i18n="returns.nr3">İade onayı olmadan gönderilen kargolar</li>
          <li data-i18n="returns.nr4">Yanlış kullanım, tesisat uyumsuzluğu veya yetkisiz müdahale kaynaklı arızalar</li>
        </ul>

        <h2 data-i18n="returns.defect_h2">5. Ayıplı mal ve garanti</h2>
        <p data-i18n="returns.defect_p">
          Üretim veya sevkiyat kaynaklı ayıplarda, yürürlükteki mevzuat ve üretici garantisi çerçevesinde onarım,
          parça değişimi veya ürün değişimi sağlanır. Garanti süreleri marka ve modele göre değişir; fatura ve
          teslimat belgesi saklanmalıdır.
        </p>

        <h2 data-i18n="returns.shipping_h2">6. İade kargo maliyeti</h2>
        <p data-i18n="returns.shipping_p">
          Cayma hakkı kapsamındaki iadelerde, yasal istisnalar hariç, iade kargo ücreti müşteriye aittir. Ayıplı /
          hatalı sevkiyatlarda kargo masrafı Equsto veya yetkili servis tarafından karşılanır.
        </p>

        <h2 data-i18n="returns.process_h2">7. İade süreci</h2>
        <ol>
          <li data-i18n="returns.step1">İade talebi: e-posta veya iletişim formu ile sipariş no, ürün kodu ve gerekçe</li>
          <li data-i18n="returns.step2">Onay: Equsto ekibi RMA ve gönderim adresini paylaşır</li>
          <li data-i18n="returns.step3">Kargo: Ürün yetkili depoya ulaştırılır; hasarlı kargoda tutanak zorunludur</li>
          <li data-i18n="returns.step4">
            Kontrol ve iade: Teknik kontrol sonrası uygun bulunan tutar, onaylı ödeme yöntemine iade edilir
          </li>
        </ol>

        <h2 data-i18n="returns.b2b_h2">8. Kurumsal (B2B) siparişler</h2>
        <p data-i18n="returns.b2b_p">
          Restoran, otel, catering ve proje siparişlerinde iade ve iptal koşulları yazılı teklif / sipariş onayında
          belirtilir. Proje Fabrikası (PFOS) çıktıları bilgilendirme amaçlıdır; bağlayıcı sipariş yalnızca onaylı
          teklif ile oluşur.
        </p>

        <p className="hk-en" data-i18n-html="returns.updated_html">
          Son güncelleme: Mayıs 2026. Sorularınız için{" "}
          <a href="/contact">iletişim</a> sayfasını kullanın.
        </p>

        <div className="hk-actions">
          <a className="hk-a-primary" href="/contact" data-i18n="returns.cta_contact">
            İade talebi — iletişim
          </a>
          <a className="hk-a-secondary" href="/shop" data-i18n="returns.cta_shop">
            Kataloğa dön
          </a>
        </div>
      </main>
    </VitrinShell>
  );
}
