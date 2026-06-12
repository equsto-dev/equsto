"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { filterUrbanBarProducts } from "@/lib/besos/urbanbar/catalog";
import type { BesosLocale } from "@/lib/besos/locale";
import type { BesosUrbanBarSectionCatalog } from "@/lib/besos/urbanbar/types";

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

export default function BesosUrbanBarCatalog({ section, locale = "tr" }: Props) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    return section.groups
      .map((group) => ({
        ...group,
        items: filterUrbanBarProducts(group.items, query),
      }))
      .filter((g) => g.items.length > 0);
  }, [section.groups, query]);

  const visibleCount = filteredGroups.reduce((n, g) => n + g.items.length, 0);

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

      {visibleCount === 0 ? (
        <p className="ub-besos-empty">{ui("noMatch", locale)}</p>
      ) : (
        filteredGroups.map((group) => (
          <div key={group.key} className="ub-besos-group" id={`ub-${group.slug}`}>
            <div className="ub-besos-group-head">
              <h2>{group.label}</h2>
              <span>{group.items.length}</span>
            </div>
            <div className="ub-besos-grid">
              {group.items.map((product) => (
                <ProductTile key={product.equstoId} product={product} locale={locale} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
