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
          <div className="eq-cart-layout">
            <div className="eq-cart-layout__main">
              <header className="eq-cart-page__head">
                <h1 className="eq-cart-page__title" data-i18n="common.cart">
                  Alışveriş Sepeti
                </h1>
                <p id="equsto-cart-summary" className="eq-cart-page__summary" hidden />
              </header>
              <div id="equsto-cart-scroll" className="eq-cart-page__list" aria-live="polite" />
            </div>
            <aside className="eq-cart-layout__aside" id="equsto-cart-aside">
              <div className="eq-cart-summary">
                <h2 className="eq-cart-summary__title">Sipariş özeti</h2>
                <ul id="equsto-cart-summary-rows" className="eq-cart-summary-rows" />
                <p className="eq-cart-summary__vat">KDV faturada ayrıca eklenir.</p>
                <button
                  type="button"
                  id="equsto-cart-checkout"
                  className="eq-cart-btn eq-cart-btn--primary"
                >
                  Alışverişi tamamla
                </button>
                <button type="button" id="equsto-cart-wa" className="eq-cart-btn eq-cart-btn--wa">
                  WhatsApp ile gönder
                </button>
                <button type="button" id="equsto-cart-clear" className="eq-cart-btn eq-cart-btn--muted">
                  Sepeti temizle
                </button>
              </div>
            </aside>
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
