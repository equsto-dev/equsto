"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { BESOS_TILE_GRID_KEYS, filterBesosProducts, groupBesosCatalogue } from "@/lib/besos/catalog";
import { besosPriceLabel } from "@/lib/besos/format-price";
import type { BesosLocale } from "@/lib/besos/locale";
import { besosModuleHrefFromProduct } from "@/lib/besos/module-url";
import { besosUi } from "@/lib/besos/ui-strings";
import type { BesosProduct } from "@/lib/besos/types";

type Props = {
  products: BesosProduct[];
  locale?: BesosLocale;
};

function productKey(p: BesosProduct): string {
  return p.slug ?? p.code;
}

function cardTitle(p: BesosProduct): string {
  const name = p.name?.trim() ?? "";
  const code = p.code?.trim() ?? "";
  if (name && name !== "Bar Module" && name !== code) {
    return code ? `${name} — ${code}` : name;
  }
  return code || name || "Bar modülü";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function ProductActions({
  product,
  classPrefix = "bes-prod",
  locale,
}: {
  product: BesosProduct;
  classPrefix?: string;
  locale: BesosLocale;
}) {
  const handleAction = (action: "cart" | "contact") => {
    const actions = window.EqBesosActions;
    if (!actions) return;
    if (action === "cart") actions.addToCart(product);
    else actions.openContact(product);
  };

  return (
    <div className={`${classPrefix}-actions`}>
      <button
        type="button"
        className={`${classPrefix}-btn ${classPrefix}-btn-primary`}
        onClick={() => handleAction("cart")}
      >
        {besosUi("addToCart", locale)}
      </button>
      <button
        type="button"
        className={`${classPrefix}-btn ${classPrefix}-btn-outline`}
        onClick={() => handleAction("contact")}
      >
        {besosUi("contact", locale)}
      </button>
    </div>
  );
}

function TapTile({ product, locale }: { product: BesosProduct; locale: BesosLocale }) {
  const img = product.image ? besosAssetPath(product.image) : "";
  const code = product.code?.trim() || product.name || besosUi("catalogModuleDefault", locale);
  const price = besosPriceLabel(product, locale);
  const desc = product.description ? truncate(product.description, 140) : "";
  const dim = product.totalDimensionsMm
    ? `${besosUi("totalDimensions", locale)} ${product.totalDimensionsMm} mm`
    : "";
  const href = besosModuleHrefFromProduct(product, locale);

  return (
    <article className="vit-tap-tile" data-page={product.page ?? ""} title={code}>
      <Link className="vit-tap-tile-hero" href={href}>
        {img ? (
          <Image src={img} alt={code} width={320} height={400} loading="lazy" unoptimized />
        ) : (
          <span className="vit-card-hero-empty">{besosUi("catalogImagePh", locale)}</span>
        )}
      </Link>
      <div className="vit-tap-tile-body">
        <div className="vit-tap-tile-code">{code}</div>
        {desc ? <p className="vit-tap-tile-desc">{desc}</p> : null}
        {dim ? <div className="vit-tap-tile-dim">{dim}</div> : null}
        <div className="vit-tap-tile-buy">
          {price ? <div className="vit-tap-tile-price">{price}</div> : null}
          <ProductActions product={product} classPrefix="bes-prod" locale={locale} />
        </div>
      </div>
    </article>
  );
}

function CardRow({
  product,
  categoryLabel,
  locale,
}: {
  product: BesosProduct;
  categoryLabel: string;
  locale: BesosLocale;
}) {
  const img = product.image ? besosAssetPath(product.image) : "";
  const title = cardTitle(product);
  const price = besosPriceLabel(product, locale);
  const desc = product.description ?? "";
  const href = besosModuleHrefFromProduct(product, locale);
  const pageRef = product.page ? ` · P.${product.page}` : "";

  return (
    <article className="vit-card-row" data-page={product.page ?? ""} title={title}>
      <div className="vit-card">
        <Link className="vit-card-hero" href={href} aria-label={title}>
          {img ? (
            <Image src={img} alt={title} width={640} height={384} loading="lazy" unoptimized />
          ) : (
            <div className="vit-card-hero-empty">{besosUi("catalogImagePh", locale)}</div>
          )}
        </Link>
        <div className="vit-card-info">
          <div className="vit-card-info-cat">
            {categoryLabel}
            {pageRef}
          </div>
          <h3 className="vit-card-info-h">{title}</h3>
          {desc ? <p className="vit-card-info-desc">{desc}</p> : null}
          <div className="vit-card-buy">
            {price ? <div className="vit-card-buy-price">{price}</div> : null}
            <ProductActions product={product} classPrefix="bes-prod" locale={locale} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BesosCatalog({ products, locale = "tr" }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    (window as Window & { filterStations?: (q: string) => void }).filterStations = (q) =>
      setQuery(String(q ?? "").trim());
    try {
      const stored = sessionStorage.getItem("besos-station-q");
      if (stored) {
        setQuery(stored);
        sessionStorage.removeItem("besos-station-q");
      }
    } catch {
      /* ignore */
    }
    return () => {
      delete (window as Window & { filterStations?: (q: string) => void }).filterStations;
    };
  }, []);

  const filtered = useMemo(
    () => filterBesosProducts(products, query, locale),
    [products, query, locale],
  );
  const groups = useMemo(() => groupBesosCatalogue(filtered, locale), [filtered, locale]);

  return (
    <section className="bes-catalog" id="bd-stations" aria-label={besosUi("catalogAria", locale)}>
      {query ? (
        <div className="bd-vitrum-flat-head">
          <h3>
            {locale === "en"
              ? `\u201c${query}\u201d — ${filtered.length} ${besosUi("catalogSearchMatch", locale)}`
              : `\u201c${query}\u201d için ${filtered.length} ${besosUi("catalogSearchMatch", locale)}`}
          </h3>
          <button type="button" className="bes-catalog-search-clear" onClick={() => setQuery("")}>
            {besosUi("catalogSearchClear", locale)}
          </button>
        </div>
      ) : null}

      {query ? (
        <div className="bd-vitrum-board bd-vitrum-flat">
          <div className="bd-vitrum-cat-grid">
            {filtered.map((p) => (
              <CardRow key={productKey(p)} product={p} categoryLabel={p.category} locale={locale} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bd-vitrum-board">
          {groups.map((g, i) => {
            const isTileGrid = !!BESOS_TILE_GRID_KEYS[g.key];
            const n = String(i + 1).padStart(2, "0");
            const minPage = Math.min(...g.items.map((p) => p.page ?? 9999));
            return (
              <section key={g.key} className="bd-vitrum-cat" id={`vit-${g.slug}`}>
                <div className="bd-vitrum-cat-head">
                  <div className="bd-vitrum-cat-num">{n}</div>
                  <div className="bd-vitrum-cat-meta">
                    <div className="bd-vitrum-cat-kicker">
                      {besosUi("catalogCategory", locale)} {n}
                    </div>
                    <h3 className="bd-vitrum-cat-title">{g.label}</h3>
                    <div className="bd-vitrum-cat-count">
                      {g.items.length} {besosUi("catalogProducts", locale)} · {besosUi("catalogPage", locale)} {minPage}+
                    </div>
                    {g.blurb ? <p className="bd-vitrum-cat-desc">{g.blurb}</p> : null}
                  </div>
                </div>
                <div className={`bd-vitrum-cat-grid${isTileGrid ? " bd-vitrum-cat-grid--tap" : ""}`}>
                  {g.items.map((p) =>
                    isTileGrid ? (
                      <TapTile key={productKey(p)} product={p} locale={locale} />
                    ) : (
                      <CardRow key={productKey(p)} product={p} categoryLabel={g.label} locale={locale} />
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
