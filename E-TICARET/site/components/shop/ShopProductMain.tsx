export default function ShopProductMain() {
  return (
    <div className="pg">
      <div className="body">
        <aside className="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-label="Filtreler">
          <nav className="sidebar" id="eq-sidebar" aria-label="Kategoriler" />
          <div className="eq-filter-sec">
            <div className="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz">Markalarımız</div>
            <div id="eq-filter-brands" className="eq-filter-brands" />
          </div>
        </aside>
        <div className="right-col">
          <div className="breadcrumb" id="eq-product-bc">
            <a href="/" id="eq-product-bc-home">
              Ana Sayfa
            </a>{" "}
            › <span>Yükleniyor…</span>
          </div>
          <main className="eq-product-main" id="eq-product-root">
            <div className="eq-product-miss">Ürün bilgisi yükleniyor…</div>
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
