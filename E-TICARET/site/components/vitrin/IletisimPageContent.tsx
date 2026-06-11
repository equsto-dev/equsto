import ContactKonuBanner from "@/components/vitrin/ContactKonuBanner";
import { EQUSTO_OFFICE_ADDRESS, EQUSTO_OFFICE_MAP_EMBED } from "@/lib/site/company-address";

export default function IletisimPageContent() {
  return (
    <>
      <ContactKonuBanner />
      <main className="ct-page">
        <p id="ct-konu" className="ct-konu" role="status" aria-live="polite" />

        <div className="ct-grid">
          <section className="ct-panel ct-info" aria-labelledby="ct-info-title">
            <h2 id="ct-info-title" className="ct-panel-title" data-i18n="contact.info_title">
              İletişim Bilgileri
            </h2>
            <table className="ct-info-table">
              <tbody>
                <tr>
                  <th scope="row" data-i18n="contact.info_company_l">
                    Firma Adı
                  </th>
                  <td data-i18n="contact.info_company_v">Equsto Teknoloji Limited</td>
                </tr>
                <tr>
                  <th scope="row" data-i18n="contact.info_address_l">
                    Adres
                  </th>
                  <td data-i18n-skip>{EQUSTO_OFFICE_ADDRESS}</td>
                </tr>
                <tr>
                  <th scope="row" data-i18n="contact.info_phone_l">
                    Telefon
                  </th>
                  <td>
                    <a href="tel:+905326840152">+90 532 684 01 52</a>
                  </td>
                </tr>
                <tr>
                  <th scope="row" data-i18n="contact.info_email_l">
                    E-Posta
                  </th>
                  <td>
                    <a href="mailto:info@equsto.com">info@equsto.com</a>
                  </td>
                </tr>
                <tr>
                  <th scope="row" data-i18n="contact.info_export_l">
                    İhracat
                  </th>
                  <td data-i18n="contact.info_export_v">
                    TR · AE · QA · SA · AZ · KZ · UZ · AL · RO · BG
                  </td>
                </tr>
                <tr>
                  <th scope="row" data-i18n="contact.info_hours_l">
                    Çalışma saatleri
                  </th>
                  <td data-i18n="contact.info_hours_v">Pazartesi–Cuma 09:00–18:00 (TR)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="ct-panel ct-form-wrap" aria-labelledby="ct-form-title">
            <h2 id="ct-form-title" className="ct-panel-title" data-i18n="contact.form_title">
              İletişim Formu
            </h2>
            <p className="ct-form-note" data-i18n="contact.form_note">
              Lütfen iletişim bilgilerinizi eksiksiz doldurmaya özen gösteriniz.
            </p>
            <form id="equsto-iletisim-form" className="ct-form" noValidate>
              <label className="ct-field ct-field--full">
                <span data-i18n="contact.form_dept">Departman Seçiniz *</span>
                <select id="eq-iletisim-dept" name="departman" required defaultValue="">
                  <option value="" disabled data-i18n="contact.form_dept_ph">
                    Departman seçin
                  </option>
                  <option value="satis" data-i18n="contact.dept_sales">
                    Satış mühendisliği / teklif
                  </option>
                  <option value="pfos" data-i18n="contact.dept_pfos">
                    Proje Fabrikası (PFOS)
                  </option>
                  <option value="besos" data-i18n="contact.dept_besos">
                    Bar Design (Besos)
                  </option>
                  <option value="lojistik" data-i18n="contact.dept_logistics">
                    Lojistik / teslimat
                  </option>
                  <option value="muhasebe" data-i18n="contact.dept_finance">
                    Muhasebe / ödeme
                  </option>
                  <option value="diger" data-i18n="contact.dept_other">
                    Diğer
                  </option>
                </select>
              </label>
              <div className="ct-field-row">
                <label className="ct-field">
                  <span data-i18n="contact.form_first">Adınız *</span>
                  <input id="eq-iletisim-ad" name="ad" type="text" autoComplete="given-name" required />
                </label>
                <label className="ct-field">
                  <span data-i18n="contact.form_last">Soyadınız *</span>
                  <input id="eq-iletisim-soyad" name="soyad" type="text" autoComplete="family-name" required />
                </label>
              </div>
              <label className="ct-field ct-field--full">
                <span data-i18n="contact.form_email">E-Posta Adresiniz *</span>
                <input id="eq-iletisim-mail" name="eposta" type="email" autoComplete="email" required />
              </label>
              <label className="ct-field ct-field--full">
                <span data-i18n="contact.form_phone">Telefon *</span>
                <input
                  id="eq-iletisim-tel"
                  name="telefon"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0532 …"
                  required
                />
              </label>
              <label className="ct-field ct-field--full">
                <span data-i18n="contact.form_message">Mesajınız *</span>
                <textarea id="eq-iletisim-mesaj" name="mesaj" rows={5} required />
              </label>
              <div className="ct-captcha">
                <span id="eq-iletisim-captcha-code" className="ct-captcha-code" aria-hidden="true" />
                <label className="ct-field ct-captcha-input">
                  <span data-i18n="contact.form_captcha">Güvenlik Kodu *</span>
                  <input id="eq-iletisim-captcha-input" type="text" autoComplete="off" required />
                </label>
                <button
                  type="button"
                  id="eq-iletisim-captcha-refresh"
                  className="ct-captcha-refresh"
                  aria-label="Güvenlik kodunu yenile"
                  title="Yenile"
                >
                  ↻
                </button>
              </div>
              <label className="ct-privacy">
                <input id="eq-iletisim-privacy" type="checkbox" required />
                <span data-i18n-html="contact.form_privacy_html">
                  <a href="/iade-politikasi">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum.
                </span>
              </label>
              <p id="eq-iletisim-status" className="ct-form-status" role="status" aria-live="polite" />
              <div className="ct-form-actions">
                <button type="submit" id="eq-iletisim-submit" className="ct-btn ct-btn--primary" data-i18n="contact.form_send">
                  Gönder
                </button>
                <button type="reset" className="ct-btn ct-btn--secondary" data-i18n="contact.form_clear">
                  Temizle
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="ct-quick">
          <a className="ct-quick-card" href="/sss">
            <span className="ct-quick-icon" aria-hidden="true">
              ?
            </span>
            <span data-i18n="contact.quick_faq">Sık Sorulan Sorular</span>
          </a>
          <a className="ct-quick-card" href="/iletisim">
            <span className="ct-quick-icon" aria-hidden="true">
              ☎
            </span>
            <span data-i18n="contact.quick_support">Müşteri Hizmetleri</span>
          </a>
          <a className="ct-quick-card" href="/hesabim">
            <span className="ct-quick-icon" aria-hidden="true">
              📦
            </span>
            <span data-i18n="contact.quick_orders">Sipariş Takip</span>
          </a>
        </div>

        <div className="ct-map-wrap">
          <iframe
            title="Equsto — Kağıthane, İstanbul"
            className="ct-map"
            src={EQUSTO_OFFICE_MAP_EMBED}
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </main>
    </>
  );
}
