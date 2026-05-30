import type { ShopDeptMeta } from "@/lib/shop/depts";

export default function ShopDeptPlpMain({ meta }: { meta: ShopDeptMeta }) {
  return (
    <div className="pg">
      <div className="eq-dept-plp-layout">
        <aside className="eq-dept-plp-aside" id="eq-dept-plp-aside" aria-label="Filtreler" data-i18n-attr="aria-label:plp.filters_aria">
          <div className="eq-dept-plp-aside__hd" data-i18n={meta.navKey}>
            {meta.title}
          </div>
          <div id="eq-dept-plp-facets" />
        </aside>
        <div className="eq-dept-filter-backdrop" id="eq-dept-filter-backdrop" aria-hidden="true" />
        <main className="eq-dept-plp-main" id="eq-dept-plp-main">
          <h1 className="eq-dept-plp-title" data-i18n={meta.navKey}>
            {meta.title}
          </h1>
          <p className="eq-dept-plp-lead" data-i18n={meta.leadKey}>
            {meta.lead}
          </p>
          <div className="eq-dept-plp-selected" id="eq-dept-plp-selected" hidden>
            <div className="eq-cm-selected__chips" id="eq-dept-cm-chips-main" />
          </div>
          <div className="eq-dept-plp-toolbar">
            <button type="button" className="eq-dept-plp-filter-mob" id="eq-dept-plp-filter-mob" data-i18n="plp.filter_mob">
              Filtrele
            </button>
            <div className="eq-dept-plp-count" id="eq-dept-plp-count" />
            <label className="eq-dept-plp-sort">
              <span data-i18n="plp.sort_label">Sıralama</span>
              <select id="eq-dept-plp-sort" aria-label="Sıralama" data-i18n-attr="aria-label:plp.sort_aria">
                <option value="" data-i18n="plp.sort_mixed">
                  Karışık Sıra
                </option>
                <option value="name" data-i18n="plp.sort_name_asc">
                  Alfabetik A-Z
                </option>
                <option value="name-desc" data-i18n="plp.sort_name_desc">
                  Alfabetik Z-A
                </option>
                <option value="price-asc" data-i18n="plp.sort_price_asc">
                  Fiyat Artan
                </option>
                <option value="price-desc" data-i18n="plp.sort_price_desc">
                  Fiyat Azalan
                </option>
              </select>
            </label>
          </div>
          <div className="eq-dept-plp-grid" id="eq-dept-plp-grid" role="list">
            <p className="eq-dept-plp-status" data-i18n="plp.loading_catalog">
              Katalog yükleniyor…
            </p>
          </div>
          <nav className="eq-dept-plp-pages" id="eq-dept-plp-pages" aria-label="Sayfalama" data-i18n-attr="aria-label:plp.pagination_aria" />
        </main>
      </div>
      <footer className="footer">
        <span style={{ fontSize: 10, color: "var(--eq-text-muted)" }} data-i18n="footer.b2b_partners">
          B2B · proje · kanal ortaklıkları
        </span>
        <span data-i18n="common.manage_cookies">Çerez tercihlerini yönet</span>
      </footer>
    </div>
  );
}
