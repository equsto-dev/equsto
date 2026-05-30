type ProductSsr = {
  name: string;
  brand: string;
  description: string;
  deptTitle: string;
  deptHref: string;
  image?: string;
  priceTry?: number;
  priceLabel?: string;
};

type Props = {
  ssr?: ProductSsr | null;
};

export default function ShopProductMain({ ssr }: Props) {
  const deptHref = ssr?.deptHref ?? "/shop";

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
            ›{" "}
            {ssr ? (
              <>
                <a href={deptHref}>{ssr.deptTitle}</a> › <span>{ssr.name}</span>
              </>
            ) : (
              <span data-i18n="pdp.breadcrumb_loading">Yükleniyor…</span>
            )}
          </div>
          <main className="eq-product-main eq-pdp-booting" id="eq-product-root">
            {ssr ? (
              <article className="eq-product-seo-only" aria-hidden="true">
                <h1>{ssr.name}</h1>
                {ssr.brand ? <p>{ssr.brand}</p> : null}
                <p>{ssr.description}</p>
                {ssr.priceLabel ? <p>{ssr.priceLabel}</p> : null}
                {ssr.priceTry ? (
                  <p>{ssr.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ KDV dahil</p>
                ) : null}
              </article>
            ) : null}
            <div className="eq-pdp-skeleton" aria-hidden="true">
              <div className="eq-pdp-skeleton__hero">
                <div className="eq-pdp-skeleton__media" />
                <div className="eq-pdp-skeleton__copy">
                  <div className="eq-pdp-skeleton__line eq-pdp-skeleton__line--sm" />
                  <div className="eq-pdp-skeleton__line eq-pdp-skeleton__line--lg" />
                  <div className="eq-pdp-skeleton__line eq-pdp-skeleton__line--md" />
                  <div className="eq-pdp-skeleton__box" />
                  <div className="eq-pdp-skeleton__line eq-pdp-skeleton__line--md" />
                </div>
              </div>
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
