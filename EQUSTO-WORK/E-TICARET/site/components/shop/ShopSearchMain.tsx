export default function ShopSearchMain() {
  return (
    <main className="eq-arama-wrap" id="eq-arama-main">
      <div className="eq-dept-plp-layout eq-arama-layout">
        <aside className="eq-dept-plp-aside eq-arama-aside" id="eq-arama-aside" aria-label="Filtreler" data-i18n-attr="aria-label:plp.filters_aria">
          <div className="eq-dept-plp-aside__hd" data-i18n="plp.filters">
            Filtreler
          </div>
          <div id="eq-arama-facets" />
        </aside>
        <div className="eq-dept-filter-backdrop" id="eq-arama-filter-backdrop" aria-hidden="true" />
        <div className="eq-dept-plp-main eq-arama-main">
          <h1 className="eq-arama-title" id="eq-arama-title" data-i18n="search.title">
            Arama
          </h1>
          <p className="eq-arama-count" id="eq-arama-count" />
          <div className="eq-dept-plp-selected" id="eq-arama-selected" hidden>
            <div className="eq-cm-selected__chips" id="eq-arama-chips" />
            <button type="button" className="eq-cm-selected__clear" id="eq-arama-clear-all" data-i18n="plp.clear_all">
              HEPSİNİ SİL
            </button>
          </div>
          <div className="eq-dept-plp-toolbar">
            <button type="button" className="eq-dept-plp-filter-mob" id="eq-arama-filter-mob" data-i18n="plp.filter_mob">
              Filtrele
            </button>
            <div className="eq-dept-plp-count" id="eq-arama-filter-count" />
            <label className="eq-dept-plp-sort">
              <span data-i18n="plp.sort_label">Sıralama</span>
              <select id="eq-arama-sort" aria-label="Sıralama" data-i18n-attr="aria-label:plp.sort_aria">
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
          <div className="eq-dept-plp-grid eq-arama-grid" id="eq-arama-grid" role="list">
            <p className="eq-dept-plp-status" data-i18n="search.loading">
              Yükleniyor…
            </p>
          </div>
          <div className="eq-arama-more" id="eq-arama-more" />
        </div>
      </div>
    </main>
  );
}
