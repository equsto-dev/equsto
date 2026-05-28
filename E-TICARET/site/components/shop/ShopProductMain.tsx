export default function ShopProductMain() {
  return (
    <div className="pg">
      <div className="body">
        <aside
          className="eq-filter-col eq-refine-amazon"
          id="eq-filter-col"
          aria-label="Filtreler"
          data-i18n-attr="aria-label:pdp.filters_aria"
        >
          <nav className="sidebar" id="eq-sidebar" aria-label="Kategoriler" data-i18n-attr="aria-label:pdp.categories_aria" />
          <div className="eq-filter-sec">
            <div className="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz" data-i18n="pdp.brands_label">
              Markalarımız
            </div>
            <div id="eq-filter-brands" className="eq-filter-brands" />
          </div>
        </aside>
        <div className="right-col">
          <div className="breadcrumb" id="eq-product-bc">
            <a href="/" id="eq-product-bc-home" data-i18n="breadcrumb.home">
              Ana Sayfa
            </a>{" "}
            › <span data-i18n="pdp.breadcrumb_loading">Yükleniyor…</span>
          </div>
          <main className="eq-product-main" id="eq-product-root">
            <div className="eq-product-miss" data-i18n="pdp.loading_product">
              Ürün bilgisi yükleniyor…
            </div>
          </main>
        </div>
      </div>
      <footer className="footer">
        <div className="refs">
          <span style={{ fontSize: 10, color: "var(--eq-text-muted)" }} data-i18n="footer.b2b_partners">
            B2B · proje · kanal ortaklıkları
          </span>
        </div>
        <div data-i18n="common.manage_cookies">Çerez tercihlerini yönet</div>
      </footer>
    </div>
  );
}
