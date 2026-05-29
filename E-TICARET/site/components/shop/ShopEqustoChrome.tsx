"use client";

import { EQ_DEPT_PATH, submitBesosSearch, toggleEqDrawer } from "@/lib/besos/site-nav";
import { usePathname } from "next/navigation";
import { Fragment, useRef } from "react";
import LangSwitcherSlot from "@/components/shop/LangSwitcherSlot";
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
  const searchRef = useRef<HTMLInputElement>(null);
  const onToggleDrawer = isBesos ? toggleEqDrawer : toggleDrawer;
  const hrefFor = (key: string) => topnavHref(key, pathname);

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
                onClick={onToggleDrawer}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleDrawer();
                  }
                }}
                data-i18n="common.all_categories_caps"
              >
                ☰ Tüm Kategoriler
              </div>
              <input
                ref={isBesos ? searchRef : undefined}
                className="srch-input"
                type="search"
                placeholder={
                  isBesos ? "Bar modülü, ürün veya kategori ara..." : "Ürün, marka veya kategori ara..."
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
                aria-label="Ara"
                title="Ara"
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
            <button
              type="button"
              className="topnav-item topnav-all"
              onClick={onToggleDrawer}
              data-i18n="common.all_categories_lower"
            >
              ☰ Tüm kategoriler
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
