"use client";

import { goEqDept, submitBesosSearch, toggleEqDrawer } from "@/lib/besos/site-nav";
import { Fragment, useRef } from "react";
import ShopChromePortal from "@/components/shop/ShopChromePortal";

function cycleTheme() {
  const fn = (window as Window & { equstoCycleTheme?: () => void }).equstoCycleTheme;
  fn?.();
}

const DEPT_NAV: { key: string; labelKey: string; fallback: string }[] = [
  { key: "pisirme", labelKey: "nav.pisirme", fallback: "Pişirme Ekipmanları" },
  { key: "sogutma", labelKey: "nav.sogutma", fallback: "Soğutma Ekipmanları" },
  { key: "kahve", labelKey: "nav.kahve", fallback: "Kahve Ekipmanları" },
  { key: "yikama", labelKey: "nav.yikama", fallback: "Yıkama Ekipmanları" },
  { key: "hazirlik", labelKey: "nav.hazirlik", fallback: "Hazırlık Ekipmanları" },
  { key: "icecek", labelKey: "nav.icecek", fallback: "İçecek Ekipmanları" },
];

export default function BesosEqustoChrome() {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <ShopChromePortal>
    <div className="eq-shop-chrome">
      <header className="hdr">
        <a className="logo" href="/" aria-label="Equsto" />
        <div className="pg-inner hdr-pg-inner">
          <div className="hdr-alici">
            <div className="st-label" data-i18n="common.delivery_to">
              Teslimat Adresi
            </div>
            <div className="st-val" data-i18n="common.delivery_city">
              İstanbul, Türkiye
            </div>
          </div>
          <div className="srch">
            <div
              className="srch-cat"
              role="button"
              tabIndex={0}
              onClick={toggleEqDrawer}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleEqDrawer();
                }
              }}
              data-i18n="common.all_categories_caps"
            >
              ☰ Tüm Kategoriler
            </div>
            <input
              ref={searchRef}
              className="srch-input"
              type="search"
              placeholder="Bar modülü, ürün veya kategori ara..."
              autoComplete="off"
              spellCheck={false}
              data-i18n-attr="placeholder:besos.search_placeholder"
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
              data-i18n-attr="aria-label:common.search_aria, title:common.search_aria"
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
            <div className="theme-wrap">
              <button
                type="button"
                className="theme-toggle"
                id="theme-toggle"
                title="Tema"
                data-i18n-attr="title:common.theme_title"
                onClick={cycleTheme}
              >
                ◝
              </button>
              <span className="theme-legend" data-i18n="common.theme_label">
                Sistem · Açık · Koyu
              </span>
            </div>
            <a href="/login" className="eq-hdr-account" title="Üye girişi" data-i18n-attr="title:common.login_title">
              <span data-i18n="common.my_account">Hesabım</span>
              <span className="eq-hdr-account-title" data-i18n="common.account_projects">
                Projeler ve Listeler ▾
              </span>
            </a>
            <div data-eq-hdr-returns="1" className="eq-hdr-orders">
              <span data-i18n="common.returns">İadeler</span>
              <span data-i18n="common.and_orders">ve Siparişler</span>
            </div>
            <div
              id="equsto-hdr-cart"
              className="equsto-hdr-cart"
              title="Sepeti aç"
              role="button"
              tabIndex={0}
              data-i18n-attr="title:common.cart_aria_title"
            >
              <span id="equsto-cart-count">🛒 0</span>
              <span data-i18n="common.cart">Alışveriş Sepeti</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="topnav" aria-label="Departmanlar" data-i18n-attr="aria-label:nav.departments_aria">
        <div className="pg-inner topnav-inner">
          <div
            className="topnav-item"
            role="button"
            tabIndex={0}
            onClick={toggleEqDrawer}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleEqDrawer();
              }
            }}
            data-i18n="common.all_categories_lower"
          >
            ☰ Tüm kategoriler
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div
            className="topnav-item topnav-pfos"
            role="button"
            tabIndex={0}
            onClick={() => goEqDept("pfos")}
            aria-label="Proje Fabrikası"
            data-i18n-attr="aria-label:nav.pfos"
            data-i18n="nav.pfos"
          >
            <span className="topnav-pfos__in" aria-hidden="true">
              <span className="topnav-pfos__face topnav-pfos__face--plain">Proje Fabrikası</span>
              <span className="topnav-pfos__face topnav-pfos__face--dark">Proje Fabrikası</span>
            </span>
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          {DEPT_NAV.map(({ key, labelKey, fallback }) => (
            <Fragment key={key}>
              <span className="topnav-sep" aria-hidden="true">
                |
              </span>
              <div
                className="topnav-item"
                role="button"
                tabIndex={0}
                onClick={() => goEqDept(key)}
                data-i18n={labelKey}
              >
                {fallback}
              </div>
            </Fragment>
          ))}
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div
            className="topnav-item topnav-besos active"
            role="button"
            tabIndex={0}
            onClick={() => goEqDept("besos")}
            aria-label="Bar Design"
            aria-current="page"
            data-i18n-attr="aria-label:nav.bar_design"
          >
            <span className="topnav-besos__in" aria-hidden="true">
              <span className="topnav-besos__face topnav-besos__face--plain" data-i18n="nav.bar_design">
                Bar Design
              </span>
              <span className="topnav-besos__face topnav-besos__face--dark" data-i18n="nav.bar_design_hover">
                Dark Side
              </span>
            </span>
          </div>
        </div>
      </nav>
      <nav className="bd-besos-subnav" aria-label="Bar Design Studio" data-i18n-attr="aria-label:besos.hdr_studio">
        <a href="/besos" className="is-active" data-i18n="besos.hdr_nav_vitrin">
          Vitrin
        </a>
        <a href="/besos#bd-stations" data-i18n="besos.hdr_nav_modules">
          Modüller
        </a>
        <a href="/besos#bd-vitrum-projects" data-i18n="besos.hdr_nav_refs">
          Projeler
        </a>
        <a href="/besos/imt300">
          IMT300
        </a>
        <a href="/besos#bd-foot" data-i18n="besos.hdr_nav_quote">
          Teklif iste
        </a>
      </nav>
    </div>
    </ShopChromePortal>
  );
}
