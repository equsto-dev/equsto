"use client";

import { Fragment } from "react";
import ShopChromePortal from "@/components/shop/ShopChromePortal";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import type { ShopDeptSlug } from "@/lib/shop/depts";

const TOP_DEPTS: { key: ShopDeptSlug | string; labelKey: string; fallback: string }[] = [
  { key: "pisirme", labelKey: "nav.pisirme", fallback: "Pişirme Ekipmanları" },
  { key: "sogutma", labelKey: "nav.sogutma", fallback: "Soğutma Ekipmanları" },
  { key: "kahve", labelKey: "nav.kahve", fallback: "Kahve Ekipmanları" },
  { key: "yikama", labelKey: "nav.yikama", fallback: "Yıkama Ekipmanları" },
  { key: "hazirlik", labelKey: "nav.hazirlik", fallback: "Hazırlık Ekipmanları" },
  { key: "icecek", labelKey: "nav.icecek", fallback: "İçecek Ekipmanları" },
];

function goDept(key: string) {
  const fn = (window as Window & { eqGo?: (k: string) => void }).eqGo;
  if (typeof fn === "function") fn(key);
  else window.location.href = `/shop/${encodeURIComponent(key)}`;
}

function toggleDrawer() {
  const fn = (window as Window & { toggleDrawer?: () => void }).toggleDrawer;
  if (typeof fn === "function") fn();
}

export default function ShopEqustoChrome({ activeDept }: { activeDept?: ShopDeptSlug | null }) {
  return (
    <ShopChromePortal>
    <div className="eq-shop-chrome">
      <header className="hdr">
        <a className="logo" href="/" aria-label="Equsto" />
        <div className="pg-inner hdr-pg-inner">
          <div className="hdr-alici">
            <div style={{ fontSize: 9, color: "var(--eq-text-subtle)" }} data-i18n="common.delivery_to">
              Teslimat Adresi
            </div>
            <div style={{ fontSize: 11, fontWeight: 600 }} data-i18n="common.delivery_city">
              İstanbul, Türkiye
            </div>
          </div>
          <div className="srch">
            <div
              className="srch-cat"
              role="button"
              tabIndex={0}
              onClick={toggleDrawer}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleDrawer();
                }
              }}
              data-i18n="common.all_categories_caps"
            >
              ☰ Tüm Kategoriler
            </div>
            <input
              className="srch-input"
              type="search"
              placeholder="Ürün, marka veya kategori ara..."
              autoComplete="off"
              data-i18n-attr="placeholder:common.search_placeholder"
            />
            <button type="button" className="srch-btn" aria-label="Ara" data-i18n-attr="aria-label:common.search_aria">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
                data-i18n-attr="title:common.theme_title"
              >
                ◐
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
            <div className="eq-hdr-orders">
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
          <div className="topnav-item topnav-all" onClick={toggleDrawer} data-i18n="common.all_categories_lower">
            ☰ Tüm kategoriler
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item topnav-pfos" onClick={() => goDept("pfos")} data-i18n="nav.pfos">
            Proje Fabrikası
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item topnav-besos" onClick={() => goDept("besos")} data-i18n="nav.bar_design">
            Bar Design
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          {TOP_DEPTS.map((d, i) => (
            <Fragment key={d.key}>
              {i > 0 ? (
                <span className="topnav-sep" aria-hidden="true">
                  |
                </span>
              ) : null}
              <div
                className={`topnav-item${activeDept === d.key ? " active" : ""}`}
                onClick={activeDept === d.key ? undefined : () => goDept(d.key)}
                data-i18n={d.labelKey}
              >
                {d.fallback}
              </div>
            </Fragment>
          ))}
        </div>
      </nav>
      <span data-eq-shop-chrome-v={SHOP_ASSET_V} hidden aria-hidden="true" />
    </div>
    </ShopChromePortal>
  );
}
