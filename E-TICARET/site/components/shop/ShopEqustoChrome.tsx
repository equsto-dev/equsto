"use client";

import { EQ_DEPT_PATH, submitBesosSearch, toggleEqDrawer } from "@/lib/besos/site-nav";
import { usePathname } from "next/navigation";
import { Fragment, useRef } from "react";
import EqustoLogoLink from "@/components/shop/EqustoLogoLink";
import LangSwitcherSlot from "@/components/shop/LangSwitcherSlot";
import ShopChromePortal from "@/components/shop/ShopChromePortal";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import { CHROME_HDR, chromeLangFromPath } from "@/lib/shop/chrome-i18n";
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

function topnavHref(key: string, pathname: string | null): string {
  const base = EQ_DEPT_PATH[key] || `/shop/${encodeURIComponent(key)}`;
  if (pathname?.startsWith("/en")) return base.startsWith("/en") ? base : `/en${base}`;
  return base;
}

function preventActiveNavClick(e: React.MouseEvent, active: boolean) {
  if (!active) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
}

type ShopEqustoChromeProps = {
  activeDept?: ShopDeptSlug | null;
  variant?: "shop" | "besos";
};

/** Legacy vitrin üst bant — KİLİT: public/topnav-bar-design-KILIT.txt */
export default function ShopEqustoChrome({
  activeDept,
  variant = "shop",
}: ShopEqustoChromeProps) {
  const isBesos = variant === "besos";
  const pathname = usePathname();
  const lang = chromeLangFromPath(pathname);
  const h = CHROME_HDR[lang];
  const searchRef = useRef<HTMLInputElement>(null);
  const onToggleDrawer = isBesos ? toggleEqDrawer : toggleDrawer;
  const hrefFor = (key: string) => topnavHref(key, pathname);

  return (
    <ShopChromePortal>
      <div className="eq-shop-chrome">
        <header className="hdr">
          <EqustoLogoLink />
          <div className="pg-inner hdr-pg-inner">
            <div className="hdr-alici">
              <div style={{ fontSize: 9, color: "var(--eq-text-subtle)" }} data-i18n="common.delivery_to">
                {h.delivery_label}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600 }} data-i18n="common.delivery_city">
                {h.delivery_city}
              </div>
            </div>
            <div className="srch">
              <div
                className="srch-cat"
                role="button"
                tabIndex={0}
                onClick={onToggleDrawer}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleDrawer();
                  }
                }}
                data-i18n="common.all_categories_caps"
              >
                {h.all_categories}
              </div>
              <input
                ref={isBesos ? searchRef : undefined}
                className="srch-input"
                type="search"
                placeholder={
                  isBesos
                    ? lang === "en"
                      ? "Search bar modules, products or categories…"
                      : "Bar modülü, ürün veya kategori ara..."
                    : h.search_placeholder
                }
                autoComplete="off"
                spellCheck={isBesos ? false : undefined}
                data-i18n-attr={
                  isBesos ? "placeholder:besos.search_placeholder" : "placeholder:common.search_placeholder"
                }
                onInput={
                  isBesos
                    ? (e) => {
                        const fn = (window as Window & { filterStations?: (q: string) => void }).filterStations;
                        fn?.(e.currentTarget.value);
                      }
                    : undefined
                }
                onKeyDown={
                  isBesos
                    ? (e) => {
                        if (e.key === "Enter") submitBesosSearch(e.currentTarget.value);
                      }
                    : undefined
                }
              />
              <button
                type="button"
                className="srch-btn"
                aria-label={h.search_aria}
                title={h.search_aria}
                data-i18n-attr="aria-label:common.search_aria, title:common.search_aria"
                onClick={
                  isBesos ? () => submitBesosSearch(searchRef.current?.value ?? "") : undefined
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
              <LangSwitcherSlot />
              <div className="theme-wrap">
                <button
                  type="button"
                  className="theme-toggle"
                  id="theme-toggle"
                  onClick={() => (window as Window & { equstoCycleTheme?: () => void }).equstoCycleTheme?.()}
                  title={h.theme_title}
                  data-i18n-attr="title:common.theme_title"
                >
                  ◐
                </button>
                <span className="theme-legend" data-i18n="common.theme_label">
                  {h.theme_label}
                </span>
              </div>
              <a href="/login" className="eq-hdr-account" title={h.login_title} data-i18n-attr="title:common.login_title">
                <span data-i18n="common.my_account">{h.my_account}</span>
                <span className="eq-hdr-account-title" data-i18n="common.account_projects">
                  {h.account_projects}
                </span>
              </a>
              <div className="eq-hdr-orders">
                <span data-i18n="common.returns">{h.returns}</span>
                <span data-i18n="common.and_orders">{h.and_orders}</span>
              </div>
              <div
                id="equsto-hdr-cart"
                className="equsto-hdr-cart"
                title={h.cart_title}
                role="button"
                tabIndex={0}
                data-i18n-attr="title:common.cart_aria_title"
              >
                <span id="equsto-cart-count" aria-hidden="true">
                  <span className="eq-hdr-cart-badge">0</span>
                </span>
                <span data-i18n="common.cart">{h.cart}</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="topnav" aria-label={h.departments_aria} data-i18n-attr="aria-label:nav.departments_aria">
          <div className="pg-inner topnav-inner">
            <button
              type="button"
              className="topnav-item topnav-all"
              onClick={onToggleDrawer}
              data-i18n="common.all_categories_lower"
            >
              {h.all_categories_lower}
            </button>
            <span className="topnav-sep" aria-hidden="true">
              |
            </span>
            <a className="topnav-item topnav-pfos" href={hrefFor("pfos")} data-i18n="nav.pfos">
              Proje Fabrikası
            </a>
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
                <a
                  className={`topnav-item${activeDept === d.key ? " active" : ""}`}
                  href={hrefFor(d.key)}
                  aria-current={activeDept === d.key ? "page" : undefined}
                  onClick={(e) => preventActiveNavClick(e, activeDept === d.key)}
                  data-i18n={d.labelKey}
                >
                  {d.fallback}
                </a>
              </Fragment>
            ))}
            <span className="topnav-sep" aria-hidden="true">
              |
            </span>
            <a
              className={`topnav-item topnav-besos${isBesos ? " active" : ""}`}
              href={hrefFor("besos")}
              aria-current={isBesos ? "page" : undefined}
              onClick={(e) => preventActiveNavClick(e, isBesos)}
              data-i18n="nav.bar_design"
            >
              Bar Design
            </a>
          </div>
        </nav>

        <span data-eq-shop-chrome-v={SHOP_ASSET_V} hidden aria-hidden="true" />
      </div>
    </ShopChromePortal>
  );
}
