export default function ShopCartMain() {
  return (
    <>
      <nav className="breadcrumb" aria-label="Sayfa konumu" data-i18n-attr="aria-label:cart.breadcrumb_aria">
        <a href="/" data-i18n="cart.breadcrumb_home">
          Anasayfa
        </a>{" "}
        › <span data-i18n="pages.cart_title">Sepet</span>
      </nav>
      <main className="pg eq-cart-page" id="equsto-cart-page">
        <div className="pg-inner eq-cart-page__inner">
          <header className="eq-cart-page__head">
            <h1 className="eq-cart-page__title" data-i18n="common.cart">
              Alışveriş Sepeti
            </h1>
            <p id="equsto-cart-summary" className="eq-cart-page__summary" hidden />
            <p className="eq-cart-page__lead" data-i18n="cart.lead">
              Sepetinizdeki ürünleri inceleyin; WhatsApp ile talep iletebilir veya sipariş oluşturabilirsiniz.
            </p>
          </header>
          <div id="equsto-cart-scroll" className="eq-cart-page__list" aria-live="polite" />
          <div className="eq-cart-page__actions">
            <button
              type="button"
              id="equsto-cart-clear"
              className="eq-cart-page__btn eq-cart-page__btn--muted"
              data-i18n="cart.clear"
            >
              Sepeti temizle
            </button>
            <button
              type="button"
              id="equsto-cart-wa"
              className="eq-cart-page__btn eq-cart-page__btn--outline"
              data-i18n="cart.whatsapp"
            >
              WhatsApp ile gönder
            </button>
            <button
              type="button"
              id="equsto-cart-order"
              className="eq-cart-page__btn eq-cart-page__btn--primary"
              data-i18n="cart.order"
            >
              Siparişi oluştur
            </button>
          </div>
          <p className="eq-cart-page__note" data-i18n="cart.note">
            Ödeme bu sayfada alınmaz; Equsto Satış Mühendisliği teklif ve sipariş sürecini yürütür.
          </p>

          <div className="eq-cart-sync">
            <h2 className="eq-cart-sync__title" data-i18n="cart.sync_title">Cihazlar Arası Sepet Eşleştirme</h2>
            <p className="eq-cart-sync__lead" data-i18n="cart.sync_lead">
              Telefonunuzdaki sepeti bilgisayarınızla eşitlemek (veya tam tersi) için aşağıdaki eşleştirme alanlarını kullanabilirsiniz.
            </p>
            <div className="eq-cart-sync__row eq-cart-sync__row--send">
              <span className="eq-cart-sync__label" data-i18n="cart.sync_gen_label">A. Bu Cihazın Sepetini Aktar (Diğer Cihaz için Kod Üret)</span>
              <button type="button" id="eq-cart-pair-gen-btn" className="eq-cart-sync__btn" data-i18n="cart.sync_gen_btn">
                Eşleştirme Kodu Üret
              </button>
              <div id="eq-cart-pair-code-display" className="eq-cart-sync__code" hidden>
                KOD: <strong id="eq-cart-pair-code-val">------</strong>
                <div id="eq-cart-pair-qr-wrap">
                  <img id="eq-cart-pair-qr-img" src="" alt="QR" style={{ background: "#fff", padding: "6px", border: "1px solid #d5dbe6", borderRadius: "8px", width: "140px", height: "140px" }} />
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#5c6378" }}>Kameranızla taratarak anında eşleştirebilirsiniz.</p>
                  <a
                    id="eq-cart-pair-wa-btn"
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#25d366",
                      color: "#fff",
                      border: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      padding: "8px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      borderRadius: "8px",
                      marginTop: "4px"
                    }}
                  >
                    WhatsApp ile Gönder
                  </a>
                </div>
              </div>
            </div>
            <div className="eq-cart-sync__row eq-cart-sync__row--join">
              <span className="eq-cart-sync__label" data-i18n="cart.sync_join_label">B. Diğer Cihazın Sepetini Buraya Al</span>
              <input
                type="text"
                id="eq-cart-pair-input"
                className="eq-cart-sync__input"
                maxLength={6}
                placeholder="6 HANELİ KOD"
                autoComplete="off"
              />
              <button type="button" id="eq-cart-pair-join-btn" className="eq-cart-sync__btn" data-i18n="cart.sync_join_btn">
                Eşleştir
              </button>
            </div>
            <div id="eq-cart-pair-status" className="eq-cart-sync__msg" hidden />
          </div>
        </div>
      </main>
      <footer className="footer">
        <div className="refs">
          <span data-i18n="footer.tagline">Equsto Teknolojisi · Gastronomi Tasarımı</span>
        </div>
        <div>© Equsto</div>
      </footer>
    </>
  );
}
