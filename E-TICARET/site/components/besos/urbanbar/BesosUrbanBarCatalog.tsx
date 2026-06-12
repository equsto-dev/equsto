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
  filterAll: { tr: "Tümü", en: "All" },
  filterLabel: { tr: "Kategori", en: "Category" },
  clearFilters: { tr: "Filtreleri temizle", en: "Clear filters" },
  filterAria: { tr: "Ürün kategorisi filtrele", en: "Filter by product category" },
};

function ui(key: keyof typeof UI, locale: BesosLocale) {
  return UI[key][locale];
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

  const pageSize = cols * ROWS_PER_PAGE;
  const visibleCount = flatProducts.length;
  const shownCount = Math.min(loadedCount, visibleCount);
  const remaining = visibleCount - shownCount;
  const visibleProducts = flatProducts.slice(0, shownCount);
  const hasGroupFilter = activeGroups.size > 0;

  const toggleGroup = (key: string) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

      {searchableGroups.length > 0 ? (
        <div className="ub-besos-filters" aria-label={ui("filterAria", locale)}>
          <div className="ub-besos-filters-label">{ui("filterLabel", locale)}</div>
          <div className="ub-besos-filters-scroll">
            <button
              type="button"
              className={`ub-besos-filter-chip${!hasGroupFilter ? " is-active" : ""}`}
              onClick={clearGroupFilters}
            >
              {ui("filterAll", locale)}
              <span className="ub-besos-filter-chip__count">
                {searchableGroups.reduce((n, g) => n + g.items.length, 0)}
              </span>
            </button>
            {searchableGroups.map((group) => {
              const active = activeGroups.has(group.key);
              return (
                <button
                  key={group.key}
                  type="button"
                  className={`ub-besos-filter-chip${active ? " is-active" : ""}`}
                  onClick={() => toggleGroup(group.key)}
                  aria-pressed={active}
                >
                  {group.label}
                  <span className="ub-besos-filter-chip__count">{group.items.length}</span>
                </button>
              );
            })}
          </div>
          {hasGroupFilter ? (
            <button type="button" className="ub-besos-filters-clear" onClick={clearGroupFilters}>
              {ui("clearFilters", locale)}
            </button>
          ) : null}
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
                    <div className="ub-besos-group-head ub-besos-group-head--grid" id={`ub-${group.slug}`}>
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
            <div className="ub-besos-loadmore" aria-label={ui("loadMoreAria", locale)}>
              <button
                type="button"
                className="ub-besos-loadmore__btn"
                onClick={() => setLoadedCount((n) => Math.min(n + pageSize, visibleCount))}
              >
                {ui("loadMore", locale)}
                <span className="ub-besos-loadmore__meta">
                  ({remaining} {ui("remaining", locale)})
                </span>
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
