import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { HAKKIMIZDA_PAGE_CSS } from "@/lib/vitrin/page-css";
import KvkkConsentActions from "@/components/vitrin/KvkkConsentActions";

export const metadata: Metadata = {
  title: "KVKK ve çerez politikası · Equsto",
  description:
    "Equsto kişisel verilerin korunması (KVKK) ve çerez politikası. Google Analytics / Ads ölçümü için Consent Mode.",
  alternates: {
    canonical: "https://equsto.com/kvkk",
    languages: {
      tr: "https://equsto.com/kvkk",
      en: "https://equsto.com/en/privacy",
    },
  },
};

export default function KvkkPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-legal" extraCss={HAKKIMIZDA_PAGE_CSS}>
      <main className="hk-main" id="kvkk">
        <h1>KVKK ve çerez politikası</h1>
        <p className="hk-lead">
          Bu sayfa, <strong>equsto.com</strong> ziyaretçileri ve müşterileri için kişisel veri işleme ile çerez
          kullanımını özetler. Veri sorumlusu: Equsto Teknoloji Limited ·{" "}
          <a href="mailto:info@equsto.com">info@equsto.com</a> · <a href="/iletisim">İletişim</a>.
        </p>

        <div className="hk-box">
          <p style={{ margin: 0, fontSize: 14 }}>
            Reklam ve analitik çerezleri için Google Consent Mode v2 kullanıyoruz. Tercihinizi aşağıdan
            güncelleyebilirsiniz; varsayılan olarak ölçüm çerezleri kapalıdır.
          </p>
          <KvkkConsentActions />
        </div>

        <h2 id="veri">Hangi verileri işleriz?</h2>
        <div className="hk-box">
          <ul className="hk-summary">
            <li>İletişim ve teklif formları: ad, e-posta, telefon, proje notları</li>
            <li>Sipariş ve hesap: fatura / teslimat bilgileri, sipariş geçmişi</li>
            <li>Teknik: IP, tarayıcı, cihaz, sayfa görüntüleme (yalnızca onay sonrası analitik)</li>
            <li>Destek: kedi sohbet / e-posta yazışmaları</li>
          </ul>
        </div>

        <h2>Amaç ve hukuki dayanak</h2>
        <p>
          Veriler sözleşme kurulması ve ifası, müşteri taleplerinin yanıtlanması, yasal yükümlülükler ve —
          açık rıza ile — site kullanım analizi / reklam performans ölçümü için işlenir. Veriler üçüncü
          kişilere satılmaz.
        </p>

        <h2 id="cerezler">Çerezler</h2>
        <div className="hk-box">
          <ul className="hk-summary">
            <li>
              <strong>Zorunlu:</strong> oturum, sepet, güvenlik — site çalışması için gerekli
            </li>
            <li>
              <strong>Analitik (GA4):</strong> yalnızca onay sonrası — <code>analytics_storage</code>
            </li>
            <li>
              <strong>Reklam (Google Ads):</strong> yalnızca onay sonrası — <code>ad_storage</code>,{" "}
              <code>ad_user_data</code>, <code>ad_personalization</code>
            </li>
          </ul>
        </div>

        <h2>Haklarınız</h2>
        <p>
          KVKK m.11 kapsamında bilgi talep etme, düzeltme, silme, işlemeyi kısıtlama ve şikâyet (Kişisel
          Verileri Koruma Kurumu) haklarına sahipsiniz. Talepleriniz için{" "}
          <a href="mailto:info@equsto.com">info@equsto.com</a>.
        </p>

        <p style={{ fontSize: 13, opacity: 0.75 }}>
          Son güncelleme: 14 Temmuz 2026 · İlgili:{" "}
          <a href="/iade-politikasi">İade politikası</a>
        </p>
      </main>
    </VitrinShell>
  );
}
