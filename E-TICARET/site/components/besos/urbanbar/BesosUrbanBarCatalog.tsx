"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { filterUrbanBarProducts } from "@/lib/besos/urbanbar/catalog";
import type { BesosLocale } from "@/lib/besos/locale";
import type { BesosUrbanBarSectionCatalog } from "@/lib/besos/urbanbar/types";

const ROWS_PER_PAGE = 6;
const GRID_GAP_PX = 16;
const GRID_MIN_COL_PX = 220;

type Props = {
  section: BesosUrbanBarSectionCatalog;
  locale?: BesosLocale;
};

const UI = {
  searchPh: { tr: "Urban Bar ürünlerinde ara…", en: "Search Urban Bar products…" },
  products: { tr: "ürün", en: "products" },
  source: { tr: "Urban Bar · equsto.com", en: "Urban Bar · equsto.com" },
  view: { tr: "İncele", en: "View" },
  noMatch: { tr: "Aramanızla eşleşen ürün bulunamadı.", en: "No products match your search." },
  loadMore: { tr: "Daha fazla ürün yükle", en: "Load more products" },
  remaining: { tr: "kaldı", en: "remaining" },
  loadMoreAria: { tr: "Daha fazla ürün yükle", en: "Load more products" },
  filterLabel: { tr: "Alt kategoriler", en: "Subcategories" },
  filterAll: { tr: "Tümü", en: "All" },
  sectionFilter: { tr: "{section} alt kategorileri", en: "{section} subcategories" },
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

function ProductTile({
  product,
  locale,
}: {
  product: BesosUrbanBarSectionCatalog["groups"][0]["items"][0];
  locale: BesosLocale;
}) {
  const img = product.imageUrl || (product.image ? besosAssetPath(product.image) : "");
  const groupLabel = locale === "en" ? product.groupLabelEn : product.groupLabelTr;

  return (
    <article className="ub-besos-card" data-group={product.group}>
      <Link className="ub-besos-card-media" href={product.shopHref}>
        {img ? (
          img.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name} loading="lazy" decoding="async" />
          ) : (
            <Image src={img} alt={product.name} width={360} height={360} loading="lazy" unoptimized />
          )
        ) : (
          <span className="ub-besos-card-ph">Urban Bar</span>
        )}
      </Link>
      <div className="ub-besos-card-body">
        <div className="ub-besos-card-kicker">{groupLabel}</div>
        <h3 className="ub-besos-card-title">
          <Link href={product.shopHref}>{product.name}</Link>
        </h3>
        {product.code ? <div className="ub-besos-card-code">{product.code}</div> : null}
        {product.price ? <div className="ub-besos-card-price">{product.price}</div> : null}
        <Link className="ub-besos-card-cta" href={product.shopHref}>
          {ui("view", locale)}
        </Link>
      </div>
    </article>
  );
}

function gridColumnsForWidth(width: number): number {
  return Math.max(1, Math.floor((width + GRID_GAP_PX) / (GRID_MIN_COL_PX + GRID_GAP_PX)));
}

export default function BesosUrbanBarCatalog({ section, locale = "tr" }: Props) {
  const [query, setQuery] = useState("");
  const [activeGroups, setActiveGroups] = useState<ReadonlySet<string>>(new Set());
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

  const filteredGroups = useMemo(() => {
    if (!activeGroups.size) return searchableGroups;
    return searchableGroups.filter((g) => activeGroups.has(g.key));
  }, [searchableGroups, activeGroups]);

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

  const clearGroupFilters = () => setActiveGroups(new Set());

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
  }, [query, pageSize, activeGroups]);

  const facetPanel = (
    <div className="ub-besos-facets__panel">
      <div className="ub-besos-facets__hd">
        <span>{ui("sectionFilter", locale, { section: section.label })}</span>
        {hasGroupFilter ? (
          <button type="button" className="ub-besos-facets__clear" onClick={clearGroupFilters}>
            {ui("clearFilters", locale)}
          </button>
        ) : null}
      </div>
      <ul className="ub-besos-facets__list">
        {searchableGroups.map((group) => {
          const checked = !hasGroupFilter || activeGroups.has(group.key);
          return (
            <li key={group.key}>
              <label className="ub-besos-facets__label">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const on = e.target.checked;
                    if (!hasGroupFilter) {
                      if (!on) {
                        setActiveGroups(
                          new Set(searchableGroups.filter((g) => g.key !== group.key).map((g) => g.key)),
                        );
                      }
                      return;
                    }
                    if (on) {
                      const next = new Set(activeGroups);
                      next.add(group.key);
                      if (next.size >= searchableGroups.length) clearGroupFilters();
                      else setActiveGroups(next);
                      return;
                    }
                    const next = new Set(activeGroups);
                    next.delete(group.key);
                    setActiveGroups(next);
                  }}
                />
                <span className="ub-besos-facets__name">{group.label}</span>
                <span className="ub-besos-facets__count">{group.items.length}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const quickFilters = searchableGroups.length > 0 ? (
    <div className="ub-besos-quick-filters" aria-label={ui("filterLabel", locale)}>
      <span className="ub-besos-quick-filters__label">{ui("filterLabel", locale)}</span>
      <div className="ub-besos-quick-filters__scroll">
        <button
          type="button"
          className={`ub-besos-quick-filter${!hasGroupFilter ? " is-active" : ""}`}
          onClick={clearGroupFilters}
        >
          {ui("filterAll", locale)}
          <span className="ub-besos-quick-filter__count">
            {searchableGroups.reduce((n, g) => n + g.items.length, 0)}
          </span>
        </button>
        {searchableGroups.map((group) => {
          const active = hasGroupFilter && activeGroups.has(group.key);
          return (
            <button
              key={group.key}
              type="button"
              className={`ub-besos-quick-filter${active ? " is-active" : ""}`}
              aria-pressed={active}
              onClick={() => {
                if (!hasGroupFilter) {
                  setActiveGroups(new Set([group.key]));
                  return;
                }
                if (active) {
                  const next = new Set(activeGroups);
                  next.delete(group.key);
                  setActiveGroups(next.size ? next : new Set());
                  return;
                }
                setActiveGroups(new Set([...activeGroups, group.key]));
              }}
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
      <div className="ub-besos-catalog-head">
        <div className="ub-besos-catalog-meta">
          <span className="ub-besos-catalog-brand">{ui("source", locale)}</span>
          <span className="ub-besos-catalog-count">
            {visibleCount} {ui("products", locale)}
          </span>
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
              {hasGroupFilter ? <span className="ub-besos-filter-mob__dot" aria-hidden="true" /> : null}
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

          {visibleCount === 0 ? (
            <p className="ub-besos-empty">{ui("noMatch", locale)}</p>
          ) : (
            <>
              <div className="ub-besos-grid" ref={gridRef}>
                {visibleProducts.map(({ group, product }, index) => {
                  const showHead =
                    index === 0 || visibleProducts[index - 1]?.group.key !== group.key;
                  return (
                    <Fragment key={product.equstoId}>
                      {showHead ? (
                        <div
                          className="ub-besos-group-head ub-besos-group-head--grid"
                          id={`ub-${group.slug}`}
                        >
                          <h2>{group.label}</h2>
                          <span>{group.items.length}</span>
                        </div>
                      ) : null}
                      <ProductTile product={product} locale={locale} />
                    </Fragment>
                  );
                })}
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
