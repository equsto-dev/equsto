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
          <main className="eq-product-main" id="eq-product-root">
            {ssr ? (
              <article className="eq-product-ssr" id="eq-product-ssr-fallback">
                {ssr.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ssr.image}
                    alt={ssr.name}
                    width={480}
                    height={360}
                    className="eq-product-ssr__img"
                    loading="eager"
                    decoding="async"
                  />
                ) : null}
                <h1 className="eq-product-ssr__title">{ssr.name}</h1>
                {ssr.brand ? <p className="eq-product-ssr__brand">{ssr.brand}</p> : null}
                <p className="eq-product-ssr__lead">{ssr.description}</p>
                {ssr.priceLabel ? (
                  <p className="eq-product-ssr__price">{ssr.priceLabel}</p>
                ) : ssr.priceTry ? (
                  <p className="eq-product-ssr__price">
                    {ssr.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ KDV dahil
                  </p>
                ) : (
                  <p className="eq-product-ssr__price">Fiyat ve stok için teklif alın.</p>
                )}
                <p className="eq-product-ssr__note">
                  Detaylı teknik özellikler ve sepete ekleme bu sayfada yüklenir.
                </p>
              </article>
            ) : (
              <div className="eq-product-miss" data-i18n="pdp.loading_product">
                Ürün bilgisi yükleniyor…
              </div>
            )}
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
