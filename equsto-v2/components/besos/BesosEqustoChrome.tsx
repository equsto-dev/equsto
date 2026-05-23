"use client";

export default function BesosEqustoChrome() {
  return (
    <>
      <header className="hdr" data-besos-shell="locked">
        <a className="logo" href="/" aria-label="Equsto" />
        <div
          className="pg-inner hdr-pg-inner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
            padding: "10px 20px 10px 0",
          }}
        >
          <div className="hdr-alici">
            <div style={{ fontSize: 9, color: "var(--eq-text-subtle)" }}>Teslimat Adresi</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eq-drawer-head-text)" }}>
              İstanbul, Türkiye
            </div>
          </div>
          <div className="srch">
            <div
              className="srch-cat"
              onClick={() => (window as Window & { toggleDrawer?: () => void }).toggleDrawer?.()}
            >
              ☰ Tüm Kategoriler
            </div>
            <input
              className="srch-input"
              type="text"
              placeholder="Bar modülü, ürün veya kategori ara..."
              onInput={(e) => {
                const fn = (window as Window & { filterStations?: (q: string) => void }).filterStations;
                fn?.(e.currentTarget.value);
              }}
            />
            <button type="button" className="srch-btn" aria-label="Ara" title="Ara">
              <svg xmlns="http://www.w3.org/2000/svg" className="eq-srch-ico" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.35" />
                <line x1="12.35" y1="12.35" x2="17.85" y2="12.35" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="hdr-right">
            <div className="theme-wrap">
              <button
                type="button"
                className="theme-toggle"
                id="theme-toggle"
                onClick={() => (window as Window & { equstoCycleTheme?: () => void }).equstoCycleTheme?.()}
                title="Tema"
              >
                ◐
              </button>
              <span className="theme-legend">Sistem · Açık · Koyu</span>
            </div>
            <a href="/login.html" className="eq-hdr-account" title="Üye girişi">
              <span style={{ fontSize: 10, color: "var(--eq-text-muted)" }}>Hesabım</span>
              <span className="eq-hdr-account-title" style={{ fontSize: 12, fontWeight: 600 }}>
                Projeler ve Listeler ▾
              </span>
            </a>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.4 }}>
              <span style={{ fontSize: 10, color: "var(--eq-text-muted)" }}>İadeler</span>
              <span style={{ fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ve Siparişler</span>
            </div>
            <div
              id="equsto-hdr-cart"
              className="equsto-hdr-cart"
              style={{ display: "flex", flexDirection: "column", lineHeight: 1.4, cursor: "pointer" }}
              title="Sepeti aç"
              role="button"
              tabIndex={0}
            >
              <span id="equsto-cart-count" style={{ fontSize: 10, color: "var(--eq-text-muted)" }}>
                🛒 0
              </span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Alışveriş Sepeti</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="topnav" aria-label="Departmanlar">
        <div className="pg-inner topnav-inner">
          <div
            className="topnav-item topnav-all"
            onClick={() => (window as Window & { toggleDrawer?: () => void }).toggleDrawer?.()}
          >
            ☰ Tüm kategoriler
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("pfos")}>
            Proje Fabrikası
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("pisirme")}>
            Pişirme Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("sogutma")}>
            Soğutma Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("kahve")}>
            Kahve Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("yikama")}>
            Yıkama Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("hazirlik")}>
            Hazırlık Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" onClick={() => (window as Window & { eqGo?: (d: string) => void }).eqGo?.("icecek")}>
            İçecek Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div
            className="topnav-item topnav-besos active"
            onClick={() => {
              const eqGo = (window as Window & { eqGo?: (d: string) => void }).eqGo;
              if (eqGo) eqGo("besos");
              else location.href = "/besos";
            }}
            aria-current="page"
          >
            <span className="topnav-besos__in" aria-hidden="true">
              <span className="topnav-besos__face topnav-besos__face--plain">Bar Design</span>
              <span className="topnav-besos__face topnav-besos__face--dark">Dark Side</span>
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}
