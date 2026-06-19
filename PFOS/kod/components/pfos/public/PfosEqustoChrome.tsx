"use client";

import {
  goEqCart,
  goEqDept,
  submitBesosSearch,
  toggleEqDrawer,
} from "@/lib/besos/site-nav";
import LangSwitcherSlot from "@/components/shop/LangSwitcherSlot";
import { CHROME_HDR, chromeLangFromPath } from "@/lib/shop/chrome-i18n";
import { usePathname } from "next/navigation";
import { useRef } from "react";

/** Vitrin d-header — Besos / shop ile aynı üst bank + departman şeridi */
export default function PfosEqustoChrome() {
  const pathname = usePathname();
  const lang = chromeLangFromPath(pathname);
  const h = CHROME_HDR[lang];
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="eq-shop-chrome">
      <header className="hdr">
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
            <div style={{ fontSize: 9, color: "var(--eq-text-subtle)" }} data-i18n="common.delivery_to">
              {h.delivery_label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eq-drawer-head-text)" }} data-i18n="common.delivery_city">
              {h.delivery_city}
            </div>
          </div>
          <div className="srch">
            <div className="srch-cat" role="button" tabIndex={0} onClick={toggleEqDrawer} data-i18n="common.all_categories_caps">
              {h.all_categories}
            </div>
            <input
              ref={searchRef}
              className="srch-input"
              type="search"
              placeholder={h.search_placeholder}
              data-i18n-attr="placeholder:common.search_placeholder"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitBesosSearch(e.currentTarget.value);
                }
              }}
            />
            <button
              type="button"
              className="srch-btn"
              aria-label={h.search_aria}
              title={h.search_aria}
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
        </div>
        <div className="hdr-right">
          <LangSwitcherSlot />
          <div className="theme-wrap">
            <button
              type="button"
              className="theme-toggle"
              id="theme-toggle"
              suppressHydrationWarning
              onClick={() =>
                (window as Window & { equstoCycleTheme?: () => void }).equstoCycleTheme?.()
              }
              title={h.theme_title}
              aria-label={h.theme_title}
              data-i18n-attr="title:common.theme_title"
            >
              ◐
            </button>
            <span className="theme-legend" data-i18n="common.theme_label">
              {h.theme_label}
            </span>
          </div>
          <a href="/login.html" className="eq-hdr-account" title={h.login_title} data-i18n-attr="title:common.login_title">
            <span style={{ fontSize: 10, color: "var(--eq-text-muted)" }} data-i18n="common.my_account">
              {h.my_account}
            </span>
            <span className="eq-hdr-account-title" style={{ fontSize: 12, fontWeight: 600 }} data-i18n="common.account_projects">
              {h.account_projects}
            </span>
          </a>
          <div className="eq-hdr-orders" style={{ display: "flex", flexDirection: "column", lineHeight: 1.4 }}>
            <span style={{ fontSize: 10, color: "var(--eq-text-muted)" }} data-i18n="common.returns">
              {h.returns}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, cursor: "pointer" }} data-i18n="common.and_orders">
              {h.and_orders}
            </span>
          </div>
          <div
            id="equsto-hdr-cart"
            className="equsto-hdr-cart"
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.4,
              cursor: "pointer",
            }}
            title={h.cart_title}
            data-i18n-attr="title:common.cart_aria_title"
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
            <span id="equsto-cart-count" style={{ fontSize: 10, color: "var(--eq-text-muted)" }} aria-hidden="true">
              <span className="eq-hdr-cart-badge">0</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 600 }} data-i18n="common.cart">
              {h.cart}
            </span>
          </div>
        </div>
      </header>

      <nav className="topnav" aria-label={h.departments_aria} data-i18n-attr="aria-label:nav.departments_aria">
        <div className="pg-inner topnav-inner">
          <div className="topnav-item topnav-all" role="button" tabIndex={0} onClick={toggleEqDrawer} data-i18n="common.all_categories_lower">
            {h.all_categories_lower}
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div
            className="topnav-item topnav-pfos active"
            role="button"
            tabIndex={0}
            onClick={() => goEqDept("pfos")}
            aria-current="page"
          >
            <span data-i18n="nav.pfos">Proje Fabrikası</span>
            <span className="topnav-pfos-beta" aria-label="Beta">
              BETA
            </span>
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("pisirme")}>
            Pişirme Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("sogutma")}>
            Soğutma Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("kahve")}>
            Kahve Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("yikama")}>
            Yıkama Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("hazirlik")}>
            Hazırlık Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div className="topnav-item" role="button" tabIndex={0} onClick={() => goEqDept("icecek")}>
            İçecek Ekipmanları
          </div>
          <span className="topnav-sep" aria-hidden="true">
            |
          </span>
          <div
            className="topnav-item topnav-besos"
            role="button"
            tabIndex={0}
            onClick={() => goEqDept("besos")}
            data-i18n="nav.bar_design"
          >
            Bar Design
          </div>
        </div>
      </nav>
    </div>
  );
}
