"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import BesosUrbanBarPlpCard from "@/components/besos/urbanbar/BesosUrbanBarPlpCard";
import BesosUrbanBarPowered from "@/components/besos/urbanbar/BesosUrbanBarPowered";
import {
  buildUrbanBarCapacityFacets,
  filterUrbanBarProducts,
  productMatchesUrbanBarCapacities,
} from "@/lib/besos/urbanbar/catalog";
import type { BesosLocale } from "@/lib/besos/locale";
import type { BesosUrbanBarSectionCatalog } from "@/lib/besos/urbanbar/types";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const ROWS_PER_PAGE = 6;
const GRID_GAP_PX = 16;
const GRID_MIN_COL_PX = 240;

type Props = {
  section: BesosUrbanBarSectionCatalog;
  locale?: BesosLocale;
};

const UI = {
  searchPh: { tr: "Urban Bar ürünlerinde ara…", en: "Search Urban Bar products…" },
  products: { tr: "ürün", en: "products" },
  noMatch: { tr: "Aramanızla eşleşen ürün bulunamadı.", en: "No products match your search." },
  loadMore: { tr: "Daha fazla ürün yükle", en: "Load more products" },
  remaining: { tr: "kaldı", en: "remaining" },
  loadMoreAria: { tr: "Daha fazla ürün yükle", en: "Load more products" },
  filterLabel: { tr: "Alt kategoriler", en: "Subcategories" },
  sectionFilter: { tr: "{section} alt kategorileri", en: "{section} subcategories" },
  capacityLabel: { tr: "Kapasite", en: "Capacity" },
  filterAll: { tr: "Tümü", en: "All" },
  selectedFilters: { tr: "Seçilen filtreler", en: "Selected filters" },
  clearAllFilters: { tr: "Hepsini sil", en: "Clear all" },
  filtersAria: { tr: "Ürün filtreleri", en: "Product filters" },
  clearFilters: { tr: "Filtreleri temizle", en: "Clear filters" },
  showing: { tr: "{shown} / {total} ürün gösteriliyor", en: "Showing {shown} / {total} products" },
  filterMob: { tr: "Filtrele", en: "Filter" },
};

function ui(key: keyof typeof UI, locale: BesosLocale, vars?: Record<string, string | number>) {
  let text = UI[key][locale];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

function gridColumnsForWidth(width: number): number {
  return Math.max(1, Math.floor((width + GRID_GAP_PX) / (GRID_MIN_COL_PX + GRID_GAP_PX)));
}

function toggleFilterKey(set: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function FacetButton({
  label,
  count,
  active,
  onToggle,
}: {
  label: string;
  count: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`ub-besos-facet-item${active ? " is-active" : ""}`}
        aria-pressed={active}
        onClick={onToggle}
      >
        <span className="ub-besos-facet-item__name">{label}</span>
        <span className="ub-besos-facet-item__count">{count}</span>
      </button>
    </li>
  );
}

export default function BesosUrbanBarCatalog({ section, locale = "tr" }: Props) {
  const [query, setQuery] = useState("");
  const [cartReady, setCartReady] = useState(false);
  const [activeGroups, setActiveGroups] = useState<ReadonlySet<string>>(new Set());
  const [activeCapacities, setActiveCapacities] = useState<ReadonlySet<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cols, setCols] = useState(4);
  const [loadedCount, setLoadedCount] = useState(ROWS_PER_PAGE * 4);
  const gridRef = useRef<HTMLDivElement>(null);

  const searchableGroups = useMemo(() => {
    return section.groups
      .map((group) => ({
        ...group,
        items: filterUrbanBarProducts(group.items, query),
      }))
      .filter((g) => g.items.length > 0);
  }, [section.groups, query]);

  const categoryFilteredGroups = useMemo(() => {
    if (!activeGroups.size) return searchableGroups;
    return searchableGroups.filter((g) => activeGroups.has(g.key));
  }, [searchableGroups, activeGroups]);

  const capacityFacetSource = useMemo(
    () => categoryFilteredGroups.flatMap((g) => g.items),
    [categoryFilteredGroups],
  );

  const capacityFacets = useMemo(
    () => buildUrbanBarCapacityFacets(capacityFacetSource, locale),
    [capacityFacetSource, locale],
  );

  const filteredGroups = useMemo(() => {
    return categoryFilteredGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((p) => productMatchesUrbanBarCapacities(p, activeCapacities)),
      }))
      .filter((g) => g.items.length > 0);
  }, [categoryFilteredGroups, activeCapacities]);

  const flatProducts = useMemo(() => {
    return filteredGroups.flatMap((group) =>
      group.items.map((product) => ({ group, product })),
    );
  }, [filteredGroups]);

  const pageSize = Math.max(ROWS_PER_PAGE, cols * ROWS_PER_PAGE);
  const visibleCount = flatProducts.length;
  const shownCount = Math.min(loadedCount, visibleCount);
  const remaining = visibleCount - shownCount;
  const visibleProducts = flatProducts.slice(0, shownCount);
  const hasGroupFilter = activeGroups.size > 0;
  const hasCapacityFilter = activeCapacities.size > 0;
  const hasAnyFilter = hasGroupFilter || hasCapacityFilter;

  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; kind: "group" | "capacity" }[] = [];
    for (const group of searchableGroups) {
      if (activeGroups.has(group.key)) {
        chips.push({ id: `g:${group.key}`, label: group.label, kind: "group" });
      }
    }
    for (const cap of capacityFacets) {
      if (activeCapacities.has(cap.key)) {
        chips.push({ id: `c:${cap.key}`, label: cap.label, kind: "capacity" });
      }
    }
    return chips;
  }, [searchableGroups, capacityFacets, activeGroups, activeCapacities]);

  const clearAllFilters = () => {
    setActiveGroups(new Set());
    setActiveCapacities(new Set());
  };

  useEffect(() => {
    if (window.EqustoCart) setCartReady(true);
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => setCols(gridColumnsForWidth(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setLoadedCount(pageSize);
  }, [query, pageSize, activeGroups, activeCapacities]);

  const categoryPanel = (
    <div className="ub-besos-facets__panel">
      <div className="ub-besos-facets__hd">
        <span>{ui("sectionFilter", locale, { section: section.label })}</span>
      </div>
      <ul className="ub-besos-facets__list ub-besos-facets__list--category">
        {searchableGroups.map((group) => (
          <FacetButton
            key={group.key}
            label={group.label}
            count={group.items.length}
            active={activeGroups.has(group.key)}
            onToggle={() => setActiveGroups(toggleFilterKey(activeGroups, group.key))}
          />
        ))}
      </ul>
    </div>
  );

  const capacityPanel =
    capacityFacets.length > 0 ? (
      <div className="ub-besos-facets__panel ub-besos-facets__panel--capacity">
        <div className="ub-besos-facets__hd">
          <span>{ui("capacityLabel", locale)}</span>
        </div>
        <ul className="ub-besos-facets__list ub-besos-facets__list--capacity">
          {capacityFacets.map((cap) => (
            <FacetButton
              key={cap.key}
              label={cap.label}
              count={cap.count}
              active={activeCapacities.has(cap.key)}
              onToggle={() => setActiveCapacities(toggleFilterKey(activeCapacities, cap.key))}
            />
          ))}
        </ul>
      </div>
    ) : null;

  const facetPanel = (
    <div className="ub-besos-facets__stack">
      {hasAnyFilter ? (
        <div className="ub-besos-facets__clear-row">
          <button type="button" className="ub-besos-facets__clear" onClick={clearAllFilters}>
            {ui("clearFilters", locale)}
          </button>
        </div>
      ) : null}
      {categoryPanel}
      {capacityPanel}
    </div>
  );

  const quickFilters = searchableGroups.length > 0 ? (
    <div className="ub-besos-quick-filters" aria-label={ui("filterLabel", locale)}>
      <span className="ub-besos-quick-filters__label">{ui("filterLabel", locale)}</span>
      <div className="ub-besos-quick-filters__scroll">
        <button
          type="button"
          className={`ub-besos-quick-filter${!hasGroupFilter ? " is-active" : ""}`}
          onClick={() => setActiveGroups(new Set())}
        >
          {ui("filterAll", locale)}
          <span className="ub-besos-quick-filter__count">
            {searchableGroups.reduce((n, g) => n + g.items.length, 0)}
          </span>
        </button>
        {searchableGroups.map((group) => {
          const active = activeGroups.has(group.key);
          return (
            <button
              key={group.key}
              type="button"
              className={`ub-besos-quick-filter${active ? " is-active" : ""}`}
              aria-pressed={active}
              onClick={() => setActiveGroups(toggleFilterKey(activeGroups, group.key))}
            >
              {group.label}
              <span className="ub-besos-quick-filter__count">{group.items.length}</span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <section className="ub-besos-catalog" id="ub-catalog">
      <Script
        src={`/ecom-cart.js?v=${SHOP_ASSET_V}`}
        strategy="afterInteractive"
        onReady={() => {
          setCartReady(true);
          window.EqustoCart?.syncBadge?.();
        }}
      />
      <div className="ub-besos-catalog-head">
        <div className="ub-besos-catalog-head__title">
          <h1 className="ub-besos-plp-title">{section.label}</h1>
          <div className="ub-besos-catalog-meta">
            <BesosUrbanBarPowered className="ub-besos-powered--meta" />
            <span className="ub-besos-catalog-count">
              {visibleCount} {ui("products", locale)}
            </span>
          </div>
        </div>
        <label className="ub-besos-search">
          <span className="sr-only">{ui("searchPh", locale)}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui("searchPh", locale)}
            autoComplete="off"
          />
        </label>
      </div>

      {quickFilters}

      <div className="ub-besos-plp">
        <aside className="ub-besos-facets" aria-label={ui("filtersAria", locale)}>
          {facetPanel}
        </aside>

        <div className="ub-besos-plp-main">
          <div className="ub-besos-plp-toolbar">
            <button
              type="button"
              className="ub-besos-filter-mob"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {ui("filterMob", locale)}
              {hasAnyFilter ? <span className="ub-besos-filter-mob__dot" aria-hidden="true" /> : null}
            </button>
            <p className="ub-besos-plp-status">
              {visibleCount > 0
                ? ui("showing", locale, { shown: shownCount, total: visibleCount })
                : null}
            </p>
          </div>

          {filtersOpen ? (
            <div className="ub-besos-facets ub-besos-facets--mob" aria-label={ui("filtersAria", locale)}>
              {facetPanel}
            </div>
          ) : null}

          {hasAnyFilter ? (
            <div className="ub-besos-selected-filters">
              <div className="ub-besos-selected-filters__hd">{ui("selectedFilters", locale)}</div>
              <div className="ub-besos-selected-filters__chips">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className="ub-besos-selected-chip"
                    onClick={() => {
                      if (chip.kind === "group") {
                        setActiveGroups(toggleFilterKey(activeGroups, chip.id.slice(2)));
                      } else {
                        setActiveCapacities(toggleFilterKey(activeCapacities, chip.id.slice(2)));
                      }
                    }}
                  >
                    {chip.label}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
              <button type="button" className="ub-besos-selected-filters__clear" onClick={clearAllFilters}>
                {ui("clearAllFilters", locale)}
              </button>
            </div>
          ) : null}

          {visibleCount === 0 ? (
            <p className="ub-besos-empty">{ui("noMatch", locale)}</p>
          ) : (
            <>
              <div className="ub-besos-grid ub-plp-grid" ref={gridRef}>
                {visibleProducts.map(({ product }) => (
                  <BesosUrbanBarPlpCard
                    key={product.equstoId}
                    product={product}
                    locale={locale}
                    cartReady={cartReady}
                  />
                ))}
              </div>
              {remaining > 0 ? (
                <div className="ub-besos-loadmore eq-dept-plp-loadmore" aria-label={ui("loadMoreAria", locale)}>
                  <button
                    type="button"
                    className="ub-besos-loadmore__btn eq-dept-plp-loadmore__btn"
                    onClick={() => setLoadedCount((n) => Math.min(n + pageSize, visibleCount))}
                  >
                    {ui("loadMore", locale)}
                    <span className="ub-besos-loadmore__meta eq-dept-plp-loadmore__meta">
                      ({remaining} {ui("remaining", locale)})
                    </span>
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
