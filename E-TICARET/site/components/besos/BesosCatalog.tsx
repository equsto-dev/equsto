"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { BESOS_TILE_GRID_KEYS, filterBesosProducts, groupBesosCatalogue } from "@/lib/besos/catalog";
import { besosPriceLabel } from "@/lib/besos/format-price";
import { besosModuleHrefFromProduct } from "@/lib/besos/module-url";
import type { BesosProduct } from "@/lib/besos/types";

type Props = {
  products: BesosProduct[];
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
}: {
  product: BesosProduct;
  classPrefix?: string;
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
        data-i18n="besos.catalog_add_to_cart"
      >
        Sepete Ekle
      </button>
      <button
        type="button"
        className={`${classPrefix}-btn ${classPrefix}-btn-outline`}
        onClick={() => handleAction("contact")}
        data-i18n="besos.catalog_contact"
      >
        İletişim
      </button>
    </div>
  );
}

function TapTile({ product }: { product: BesosProduct }) {
  const img = product.image ? besosAssetPath(product.image) : "";
  const code = product.code?.trim() || product.name || "Modül";
  const price = besosPriceLabel(product);
  const desc = product.description ? truncate(product.description, 140) : "";
  const dim = product.totalDimensionsMm ? `Total ${product.totalDimensionsMm} mm` : "";
  const href = besosModuleHrefFromProduct(product);

  return (
    <article className="vit-tap-tile" data-page={product.page ?? ""} title={code}>
      <Link className="vit-tap-tile-hero" href={href}>
        {img ? (
          <Image src={img} alt={code} width={320} height={400} loading="lazy" unoptimized />
        ) : (
          <span className="vit-card-hero-empty" data-i18n="besos.catalog_image_ph">
            Görsel
          </span>
        )}
      </Link>
      <div className="vit-tap-tile-body">
        <div className="vit-tap-tile-code">{code}</div>
        {desc ? <p className="vit-tap-tile-desc">{desc}</p> : null}
        {dim ? <div className="vit-tap-tile-dim">{dim}</div> : null}
        <div className="vit-tap-tile-buy">
          {price ? <div className="vit-tap-tile-price">{price}</div> : null}
          <ProductActions product={product} classPrefix="bes-prod" />
        </div>
      </div>
    </article>
  );
}

function CardRow({ product, categoryLabel }: { product: BesosProduct; categoryLabel: string }) {
  const img = product.image ? besosAssetPath(product.image) : "";
  const title = cardTitle(product);
  const price = besosPriceLabel(product);
  const desc = product.description ?? "";
  const href = besosModuleHrefFromProduct(product);
  const pageRef = product.page ? ` · P.${product.page}` : "";

  return (
    <article className="vit-card-row" data-page={product.page ?? ""} title={title}>
      <div className="vit-card">
        <Link className="vit-card-hero" href={href} aria-label={title}>
          {img ? (
            <Image src={img} alt={title} width={640} height={384} loading="lazy" unoptimized />
          ) : (
            <div className="vit-card-hero-empty" data-i18n="besos.catalog_image_ph">
              Görsel
            </div>
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
            <ProductActions product={product} classPrefix="bes-prod" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BesosCatalog({ products }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    (window as Window & { filterStations?: (q: string) => void }).filterStations = (q) =>
      setQuery(String(q ?? "").trim());
    return () => {
      delete (window as Window & { filterStations?: (q: string) => void }).filterStations;
    };
  }, []);

  const filtered = useMemo(
    () => filterBesosProducts(products, query),
    [products, query],
  );
  const groups = useMemo(() => groupBesosCatalogue(filtered), [filtered]);

  return (
    <section className="bes-catalog" id="bd-stations" aria-label="Bar modülleri kataloğu" data-i18n-attr="aria-label:besos.catalog_aria">
      {query ? (
        <div className="bd-vitrum-flat-head">
          <h3>
            &ldquo;{query}&rdquo; için {filtered.length} eşleşen ürün
          </h3>
          <button type="button" className="bes-catalog-search-clear" onClick={() => setQuery("")} data-i18n="besos.catalog_search_clear">
            Aramayı temizle
          </button>
        </div>
      ) : null}

      {query ? (
        <div className="bd-vitrum-board bd-vitrum-flat">
          <div className="bd-vitrum-cat-grid">
            {filtered.map((p) => (
              <CardRow key={productKey(p)} product={p} categoryLabel={p.category} />
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
                    <div className="bd-vitrum-cat-kicker">Kategori {n}</div>
                    <h3 className="bd-vitrum-cat-title">{g.label}</h3>
                    <div className="bd-vitrum-cat-count">
                      {g.items.length} ürün · Sayfa {minPage}+
                    </div>
                    {g.blurb ? <p className="bd-vitrum-cat-desc">{g.blurb}</p> : null}
                  </div>
                </div>
                <div className={`bd-vitrum-cat-grid${isTileGrid ? " bd-vitrum-cat-grid--tap" : ""}`}>
                  {g.items.map((p) =>
                    isTileGrid ? (
                      <TapTile key={productKey(p)} product={p} />
                    ) : (
                      <CardRow key={productKey(p)} product={p} categoryLabel={g.label} />
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
