"use client";

import BesosHdrBrand from "@/components/besos/BesosHdrBrand";
import { goEqCart, goEqDept, submitBesosSearch } from "@/lib/besos/site-nav";
import { useRef } from "react";

export default function BesosEqustoChrome() {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <header className="hdr" data-besos-shell="locked">
        <BesosHdrBrand active="vitrin" />
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
            <input
              ref={searchRef}
              className="srch-input"
              type="search"
              placeholder="Bar modülü, ürün veya kategori ara..."
              onInput={(e) => {
                const fn = (window as Window & { filterStations?: (q: string) => void }).filterStations;
                fn?.(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitBesosSearch(e.currentTarget.value);
                }
              }}
            />
            <button
              type="button"
              className="srch-btn"
              aria-label="Ara"
              title="Ara"
              onClick={() => submitBesosSearch(searchRef.current?.value ?? "")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="eq-srch-ico"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.35" />
                <line
                  x1="12.35"
                  y1="12.35"
                  x2="17.85"
                  y2="12.35"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="hdr-right">
            <div
              id="equsto-hdr-cart"
              className="equsto-hdr-cart"
              style={{ display: "flex", flexDirection: "column", lineHeight: 1.4, cursor: "pointer" }}
              title="Sepet sayfası"
              role="button"
              tabIndex={0}
              onClick={goEqCart}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goEqCart();
                }
              }}
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
          <div className="topnav-item topnav-pfos" role="button" tabIndex={0} onClick={() => goEqDept("pfos")}>
            Proje Fabrikası
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("pisirme")}>
            Pişirme
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("icecek")}>
            İçecek
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div
            className="topnav-item topnav-besos active"
            role="button"
            tabIndex={0}
            onClick={() => goEqDept("besos")}
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
