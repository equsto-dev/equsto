import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { HAKKIMIZDA_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "İade ve cayma politikası · Equsto",
  description:
    "Equsto iade, değişim, teslimat ve kargo koşulları. 14 gün iade, ücretsiz iade etiketi, 7 gün geri ödeme — Türkiye.",
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
          Bu sayfa, <strong>equsto.com</strong> üzerinden Türkiye&apos;ye yapılan satışlar için iade, değişim,
          teslimat ve kargo koşullarını açıklar. Google Merchant Center ve mesafeli satış mevzuatı ile uyumludur.
        </p>

        <div className="hk-box">
          <p style={{ margin: 0, fontSize: 14 }} data-i18n-html="returns.seller_html">
            <strong>Satıcı:</strong> Equsto Teknoloji Limited · <strong>Ülke:</strong> Türkiye ·{" "}
            <strong>İletişim:</strong> <a href="mailto:info@equsto.com">info@equsto.com</a> ·{" "}
            <a href="/iletisim">İletişim formu</a>
          </p>
        </div>

        <h2 data-i18n="returns.summary_h2">Özet — Google Merchant Center ile uyumlu</h2>
        <div className="hk-box">
          <ul className="hk-summary">
            <li data-i18n="returns.sum_returns">İade: Kusurlu ve kusursuz (yeni) ürünler için kabul edilir</li>
            <li data-i18n="returns.sum_exchange">Değişim: Kabul edilir (stok / eşdeğer model uygunluğuna bağlı)</li>
            <li data-i18n="returns.sum_condition">Ürün durumu: Yalnızca yeni ürünler</li>
            <li data-i18n="returns.sum_window">İade süresi: Teslimattan itibaren 14 gün</li>
            <li data-i18n="returns.sum_method">Yöntem: Posta ile veya Equsto depo / showroom teslimi</li>
            <li data-i18n="returns.sum_label">İade etiketi: RMA onayı sonrası ücretsiz (pakete dahil / e-posta ile)</li>
            <li data-i18n="returns.sum_restock">Yeniden stoklama ücreti: Yok</li>
            <li data-i18n="returns.sum_refund">Geri ödeme: Kontrol sonrası en geç 7 iş günü</li>
            <li data-i18n="returns.sum_delivery">Tahmini teslimat: 4–8 iş günü (Türkiye geneli)</li>
          </ul>
        </div>

        <h2 data-i18n="returns.scope_h2">1. Kapsam</h2>
        <p data-i18n="returns.scope_p">
          Politika; equsto.com kataloğundaki yeni endüstriyel mutfak ekipmanları, vitrin sepeti siparişleri ve yazılı
          teklif onayı sonrası oluşan siparişleri kapsar. Montaj, tesisat ve proje mühendisliği ayrı sözleşmede
          düzenlenir.
        </p>

        <h2 data-i18n="returns.policy_h2">2. İade ve değişim</h2>
        <p data-i18n="returns.policy_p">
          Teslimattan itibaren <strong>14 gün</strong> içinde, hem ayıplı (kusurlu) hem de ayıpsız (kusursuz) yeni
          ürünler için iade talebi açılabilir. Uygun stok ve model durumunda <strong>değişim</strong> (borsa) de
          sunulur. Cayma bildirimi <a href="mailto:info@equsto.com">info@equsto.com</a> veya{" "}
          <a href="/iletisim">iletişim</a> kanallarımıza yazılı iletilmelidir.
        </p>
        <p data-i18n="returns.policy_note">
          Ürünler yalnızca <strong>yeni</strong> ve satılabilir durumda iade alınır; orijinal ambalaj, aksesuar ve
          belgeler eksiksiz olmalıdır.
        </p>

        <h2 data-i18n="returns.withdrawal_h2">3. Cayma istisnaları</h2>
        <ul>
          <li data-i18n="returns.withdrawal_ex1">
            Müşteri ölçü / model onayı sonrası üretilen özel siparişler
          </li>
          <li data-i18n="returns.withdrawal_ex2">
            Montajı yapılmış, hijyen veya teknik bütünlük nedeniyle yeniden satılamayacak ekipmanlar
          </li>
          <li data-i18n="returns.withdrawal_ex3">
            Sipariş üzerine ithal / özel üretim kalemler (teklifte aksi belirtilmedikçe)
          </li>
        </ul>

        <h2 data-i18n="returns.conditions_h2">4. İade koşulları ve yöntem</h2>
        <ul>
          <li data-i18n="returns.cond1">
            Önce <strong>info@equsto.com</strong> üzerinden iade talebi açılmalı ve <strong>RMA</strong> onay
            numarası alınmalıdır.
          </li>
          <li data-i18n="returns.cond2">
            İade <strong>postayla</strong> (kargo) veya <strong>Equsto depo / showroom</strong> teslimi ile
            yapılabilir; adres RMA ile paylaşılır.
          </li>
          <li data-i18n="returns.cond3">
            Taşıma hasarları taşıyıcı tutanağı ile en geç <strong>48 saat</strong> içinde bildirilmelidir.
          </li>
        </ul>

        <h2 data-i18n="returns.nonreturn_h2">5. İade kabul edilmeyen durumlar</h2>
        <ul>
          <li data-i18n="returns.nr1">RMA onayı olmadan gönderilen kargolar</li>
          <li data-i18n="returns.nr2">Kullanılmış, hasarlı veya eksik parçalı ürünler</li>
          <li data-i18n="returns.nr3">Devreye alınmış sabit ekipmanlar (ayıplı mal — madde 6)</li>
          <li data-i18n="returns.nr4">Yanlış kullanım veya yetkisiz müdahale kaynaklı arızalar</li>
        </ul>

        <h2 data-i18n="returns.defect_h2">6. Ayıplı (kusurlu) mal</h2>
        <p data-i18n="returns.defect_p">
          Üretim veya sevkiyat kaynaklı ayıplarda onarım, parça / ürün değişimi veya bedel iadesi; mevzuat ve üretici
          garantisi çerçevesinde uygulanır. Ayıplı ürün iade kargo masrafı Equsto tarafından karşılanır.
        </p>

        <h2 data-i18n="returns.fees_h2">7. Ücretler ve geri ödeme</h2>
        <ul>
          <li data-i18n="returns.fee_label">
            <strong>İade etiketi:</strong> Onaylı iadelerde ücretsiz iade etiketi veya kargo talimatı sağlanır
          </li>
          <li data-i18n="returns.fee_restock">
            <strong>Yeniden stoklama:</strong> Ücret alınmaz
          </li>
          <li data-i18n="returns.fee_refund">
            <strong>Geri ödeme süresi:</strong> Ürün depomuza ulaşıp kontrol edildikten sonra en geç{" "}
            <strong>7 iş günü</strong> içinde ödeme yönteminize iade
          </li>
        </ul>

        <h2 data-i18n="returns.delivery_h2">8. Teslimat süreleri (giden kargo)</h2>
        <p data-i18n="returns.delivery_p">
          Türkiye geneli tahmini teslimat: <strong>4–8 iş günü</strong>. Siparişler hafta içi{" "}
          <strong>Pazartesi–Cumartesi</strong> işlenir; <strong>14:00</strong> (TSİ / GMT+3) sonrası verilen
          siparişler ertesi iş günü hazırlık kuyruğuna alınır.
        </p>
        <ul>
          <li data-i18n="returns.delivery_handling">Sevkiyata hazırlık: 2–4 iş günü</li>
          <li data-i18n="returns.delivery_transit">Nakliye (kargo taşıma): 2–4 iş günü</li>
        </ul>

        <h2 data-i18n="returns.outbound_h2">9. Giden kargo ücretleri (TRY)</h2>
        <p data-i18n="returns.outbound_p">Sipariş tutarına göre standart kargo ücretleri (KDV hariç / dahil teklifte belirtilir):</p>
        <ul>
          <li data-i18n="returns.outbound_t1">₺0,01 – ₺20.000,00: ₺400,00</li>
          <li data-i18n="returns.outbound_t2">₺20.000,01 – ₺25.000,00: ₺500,00</li>
          <li data-i18n="returns.outbound_t3">
            ₺25.000,01 ve üzeri: Proje lojistiği — teklif / sipariş onayında ayrıca belirtilir
          </li>
        </ul>

        <h2 data-i18n="returns.process_h2">10. İade süreci</h2>
        <ol>
          <li data-i18n="returns.step1">Talep: e-posta veya form ile sipariş no, ürün kodu ve gerekçe</li>
          <li data-i18n="returns.step2">RMA onayı ve ücretsiz iade etiketi / teslim adresi</li>
          <li data-i18n="returns.step3">Ürünün posta veya depo teslimi; hasarlı kargoda tutanak zorunlu</li>
          <li data-i18n="returns.step4">Kontrol ve 7 iş günü içinde geri ödeme veya değişim</li>
        </ol>

        <h2 data-i18n="returns.b2b_h2">11. Kurumsal (B2B) siparişler</h2>
        <p data-i18n="returns.b2b_p">
          Restoran, otel ve proje siparişlerinde ek koşullar yazılı teklifte yer alır. PFOS çıktıları bilgilendirme
          amaçlıdır; bağlayıcı sipariş onaylı teklif ile oluşur.
        </p>

        <p className="hk-en" data-i18n-html="returns.updated_html">
          Son güncelleme: Mayıs 2026 · Politika URL:{" "}
          <a href="https://equsto.com/iade-politikasi">equsto.com/iade-politikasi</a>
        </p>

        <div className="hk-actions">
          <a className="hk-a-primary" href="/iletisim" data-i18n="returns.cta_contact">
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
