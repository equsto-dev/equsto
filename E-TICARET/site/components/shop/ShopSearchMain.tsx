export default function ShopSearchMain() {
  return (
    <main className="eq-arama-wrap" id="eq-arama-main">
      <h1 className="eq-arama-title" id="eq-arama-title" data-i18n="search.title">
        Arama
      </h1>
      <p className="eq-arama-count" id="eq-arama-count" />
      <div className="eq-arama-grid" id="eq-arama-grid" role="list">
        <p className="eq-dept-plp-status" data-i18n="search.loading">
          Yükleniyor…
        </p>
      </div>
    </main>
  );
}
