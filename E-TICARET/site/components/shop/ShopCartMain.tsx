export default function ShopCartMain() {
  return (
    <>
      <nav className="breadcrumb" aria-label="Sayfa konumu">
        <a href="/">Anasayfa</a> › <span data-i18n="pages.cart_title">Sepet</span>
      </nav>
      <main className="pg eq-cart-page" id="equsto-cart-page">
        <div className="pg-inner eq-cart-page__inner">
          <header className="eq-cart-page__head">
            <h1 className="eq-cart-page__title" data-i18n="common.cart">
              Alışveriş Sepeti
            </h1>
            <p id="equsto-cart-summary" className="eq-cart-page__summary" hidden />
            <p className="eq-cart-page__lead">
              Sepetinizdeki ürünleri inceleyin; WhatsApp ile talep iletebilir veya sipariş oluşturabilirsiniz.
            </p>
          </header>
          <div id="equsto-cart-scroll" className="eq-cart-page__list" aria-live="polite" />
          <div className="eq-cart-page__actions">
            <button type="button" id="equsto-cart-clear" className="eq-cart-page__btn eq-cart-page__btn--muted">
              Sepeti temizle
            </button>
            <button type="button" id="equsto-cart-wa" className="eq-cart-page__btn eq-cart-page__btn--outline">
              WhatsApp ile gönder
            </button>
            <button type="button" id="equsto-cart-order" className="eq-cart-page__btn eq-cart-page__btn--primary">
              Siparişi oluştur
            </button>
          </div>
          <p className="eq-cart-page__note">
            Ödeme bu sayfada alınmaz; Equsto Satış Mühendisliği teklif ve sipariş sürecini yürütür.
          </p>
        </div>
      </main>
      <footer className="footer">
        <div className="refs">
          <span>Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği</span>
        </div>
        <div>© Equsto</div>
      </footer>
    </>
  );
}
