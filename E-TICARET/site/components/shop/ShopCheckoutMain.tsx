export default function ShopCheckoutMain() {
  return (
    <>
      <nav className="breadcrumb" aria-label="Sayfa konumu">
        <a href="/">Anasayfa</a> › <a href="/sepet">Sepet</a> › <span>Teslimat</span>
      </nav>
      <main className="pg eq-cart-page" id="equsto-checkout-page">
        <div className="pg-inner eq-cart-page__inner">
          <header className="eq-cart-page__head">
            <h1 className="eq-cart-page__title">Teslimat</h1>
            <ol className="eq-pay-rail">
              <li>
                <a href="/sepet">Sepet</a>
              </li>
              <li>
                <button type="button" className="eq-pay-steps__btn is-on" data-eq-step="adres">
                  Teslimat
                </button>
              </li>
              <li>
                <button type="button" className="eq-pay-steps__btn" data-eq-step="odeme">
                  Ödeme
                </button>
              </li>
            </ol>
          </header>

          <div className="eq-pay">
            <div className="eq-pay__main">
              <p className="eq-checkout-login" id="equsto-checkout-login" hidden>
                Siparişi göndermek için <a href="/login?next=%2Fodeme">giriş yapın</a>. Teslimat
                bilgilerini şimdiden yazabilirsiniz.
              </p>

              <section id="eq-step-adres" className="eq-pay-panel">
                <article className="eq-pay-card">
                  <h2>Nereye teslim edelim</h2>
                  <div id="equsto-checkout-saved" className="eq-checkout-saved" hidden />
                  <div className="eq-pay-form" id="equsto-teslimat-form">
                    <label className="eq-pay-field" htmlFor="eq-teslimat-ad">
                      Ad soyad
                      <input id="eq-teslimat-ad" name="name" autoComplete="name" />
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-teslimat-tel">
                      Cep telefonu
                      <input
                        id="eq-teslimat-tel"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        placeholder="5xx xxx xx xx"
                      />
                    </label>
                    <label className="eq-pay-field eq-pay-field--full" htmlFor="eq-teslimat-eposta">
                      E-posta
                      <input id="eq-teslimat-eposta" name="email" type="email" autoComplete="email" />
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-teslimat-il">
                      İl
                      <select id="eq-teslimat-il" name="il" defaultValue="">
                        <option value="">Seçin</option>
                      </select>
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-teslimat-ilce">
                      İlçe
                      <select id="eq-teslimat-ilce" name="ilce" defaultValue="" disabled>
                        <option value="">Önce il</option>
                      </select>
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-teslimat-semt">
                      Semt
                      <input id="eq-teslimat-semt" autoComplete="address-level3" />
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-teslimat-posta">
                      Posta kodu
                      <input id="eq-teslimat-posta" inputMode="numeric" autoComplete="postal-code" maxLength={5} />
                    </label>
                    <label className="eq-pay-field eq-pay-field--full" htmlFor="eq-teslimat-adres">
                      Açık adres
                      <textarea
                        id="eq-teslimat-adres"
                        name="street-address"
                        rows={3}
                        autoComplete="street-address"
                        placeholder="Mahalle, cadde, bina, daire"
                      />
                    </label>
                    <label className="eq-pay-field eq-pay-field--full" htmlFor="eq-teslimat-baslik">
                      Teslimat notu
                      <input id="eq-teslimat-baslik" autoComplete="off" placeholder="Şantiye, depo, servis girişi" />
                    </label>
                  </div>
                </article>

                <article className="eq-pay-card">
                  <h2>Fatura</h2>
                  <div className="eq-cart-fatura__types" role="radiogroup" aria-label="Fatura tipi">
                    <label className="eq-cart-fatura__type">
                      <input type="radio" name="eq-fatura-tip" value="bireysel" defaultChecked />
                      Bireysel
                    </label>
                    <label className="eq-cart-fatura__type">
                      <input type="radio" name="eq-fatura-tip" value="kurumsal" />
                      Kurumsal
                    </label>
                  </div>
                  <div className="eq-pay-form eq-pay-form--gap">
                    <label className="eq-pay-field eq-cart-fatura__bireysel" htmlFor="eq-fatura-tckn">
                      T.C. kimlik no
                      <input id="eq-fatura-tckn" inputMode="numeric" maxLength={11} autoComplete="off" />
                    </label>
                    <label className="eq-pay-inline eq-cart-fatura__bireysel">
                      <input type="checkbox" id="eq-fatura-foreign" />
                      Türkiye Cumhuriyeti vatandaşı değilim
                    </label>
                    <label className="eq-pay-field eq-pay-field--full eq-cart-fatura__kurumsal" htmlFor="eq-fatura-unvan" hidden>
                      Firma ünvanı
                      <input id="eq-fatura-unvan" autoComplete="organization" />
                    </label>
                    <label className="eq-pay-field eq-cart-fatura__kurumsal" htmlFor="eq-fatura-vd" hidden>
                      Vergi dairesi
                      <input id="eq-fatura-vd" autoComplete="off" />
                    </label>
                    <label className="eq-pay-field eq-cart-fatura__kurumsal" htmlFor="eq-fatura-vkn" hidden>
                      Vergi no
                      <input id="eq-fatura-vkn" inputMode="numeric" maxLength={10} autoComplete="off" />
                    </label>
                  </div>
                  <label className="eq-pay-diff">
                    <input type="checkbox" id="eq-fatura-different" />
                    Fatura adresi teslimat adresinden farklı
                  </label>
                  <input type="checkbox" id="eq-fatura-same" defaultChecked hidden />
                  <div className="eq-pay-form eq-fatura-address" id="equsto-cart-fatura" hidden>
                    <label className="eq-pay-field" htmlFor="eq-fatura-ad">
                      Faturadaki ad
                      <input id="eq-fatura-ad" autoComplete="name" />
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-fatura-il">
                      İl
                      <select id="eq-fatura-il" defaultValue="">
                        <option value="">Seçin</option>
                      </select>
                    </label>
                    <label className="eq-pay-field" htmlFor="eq-fatura-ilce">
                      İlçe
                      <select id="eq-fatura-ilce" defaultValue="" disabled>
                        <option value="">Önce il</option>
                      </select>
                    </label>
                    <label className="eq-pay-field eq-pay-field--full" htmlFor="eq-fatura-adres">
                      Fatura adresi
                      <textarea id="eq-fatura-adres" rows={2} />
                    </label>
                  </div>
                </article>

                <p className="eq-cart-fatura__error" id="equsto-checkout-error" hidden />
                <button type="button" id="eq-adres-kaydet" className="eq-cart-btn eq-cart-btn--primary eq-pay-next">
                  Ödemeye devam et
                </button>
              </section>

              <section id="eq-step-odeme" className="eq-pay-panel" hidden>
                <article className="eq-pay-card">
                  <h2>Nasıl ödeyeceksiniz</h2>
                  <div className="eq-checkout-pay">
                    <label className="eq-checkout-pay__opt" id="eq-odeme-kart-label" hidden>
                      <input type="radio" name="eq-odeme-yontem" id="eq-odeme-kart" value="kart" />
                      <span>
                        <strong>Kart</strong>
                        <small>3D Secure ile tahsil edilir</small>
                      </span>
                    </label>
                    <label className="eq-checkout-pay__opt">
                      <input type="radio" name="eq-odeme-yontem" id="eq-odeme-havale" value="havale" defaultChecked />
                      <span>
                        <strong>Havale veya sipariş talebi</strong>
                        <small>Satış ekibi siparişi hazırlar</small>
                      </span>
                    </label>
                  </div>
                </article>
                <label className="eq-pay-diff">
                  <input type="checkbox" id="eq-sozlesme" />
                  <span>
                    <a href="/sartlar" target="_blank" rel="noreferrer">Şartlar ve koşulları</a> okudum,
                    mesafeli satış kapsamında siparişi onaylıyorum.
                  </span>
                </label>
                <button type="button" id="equsto-checkout-place" className="eq-cart-btn eq-cart-btn--primary eq-pay-next">
                  Siparişi gönder
                </button>
              </section>
            </div>

            <aside className="eq-pay__side" id="equsto-checkout-aside">
              <div className="eq-cart-summary">
                <h2 className="eq-cart-summary__title">Siparişiniz</h2>
                <div id="equsto-checkout-lines" className="eq-pay-lines" />
                <ul id="equsto-checkout-summary-rows" className="eq-cart-summary-rows" />
                <p className="eq-cart-summary__vat">KDV faturada ayrıca eklenir.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
