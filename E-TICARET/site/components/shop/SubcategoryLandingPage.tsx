"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getSubcategoryLanding } from "@/lib/shop/subcategory";
import { buildSubcategoryJsonLd } from "@/lib/seo/schemas";
import { catalogUrlSlug } from "@/lib/catalog-product-slug";
import { decodeHtmlEntities } from "@/lib/text/decode-html-entities";
import { publicAssetUrl } from "@/lib/public-asset-url";
import { extractProductSemantics } from "@/lib/shop/product-semantic";
import { SHOP_DEPTS, isShopDeptSlug } from "@/lib/shop/depts";

interface Props {
  landing: NonNullable<ReturnType<typeof getSubcategoryLanding>>;
  dept: string;
  locale: "tr" | "en";
  products: Record<string, unknown>[];
}

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

function productPriceTl(product: Record<string, unknown>): number {
  const n = Number(product.fiyat_tl ?? product.priceTry ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function productImageSrc(product: Record<string, unknown>): string {
  const imgs = product.images;
  const first = Array.isArray(imgs)
    ? imgs.find((x) => typeof x === "string" && String(x).trim())
    : null;
  const raw =
    (typeof first === "string" && first) ||
    (typeof product.image === "string" && product.image) ||
    (typeof product.shopify_image === "string" && product.shopify_image) ||
    "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return publicAssetUrl(String(raw).replace(/\\/g, "/").replace(/^\//, ""));
}

function productDimsLine(product: Record<string, unknown>): string {
  const o = (product.olculer && typeof product.olculer === "object"
    ? (product.olculer as Record<string, unknown>)
    : null) || null;
  if (o) {
    const w = o.genislik_mm ?? o.en_mm ?? o.uzunluk_mm;
    const d = o.derinlik_mm ?? o.boy_mm;
    const h = o.yukseklik_mm ?? o.yuk_mm;
    const parts = [w, d, h]
      .map((v) => (v != null && String(v).trim() ? String(v).trim() : ""))
      .filter(Boolean);
    if (parts.length >= 2) return parts.join(" × ") + " mm";
  }
  const sem = extractProductSemantics(product);
  return [sem.capacity, sem.energyType].filter(Boolean).join(" · ");
}

function productBrandLabel(product: Record<string, unknown>): string {
  const b = String(product.brand || product.oem_brand || "").trim();
  if (!b) return "";
  if (/öztiryakiler|oztiryakiler/i.test(b)) return "";
  return b;
}

function formatPriceLabel(tl: number, isEn: boolean): string {
  if (tl > 0) {
    return (
      "₺" +
      tl.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      " TL"
    );
  }
  return isEn ? "Contact for quote" : "Teklif için iletişim";
}

export default function SubcategoryLandingPage({ landing, dept, locale, products }: Props) {
  const isEn = locale === "en";
  const [sort, setSort] = useState<SortKey>("featured");

  const title = isEn ? landing.titleEn : landing.title;
  const description = isEn ? landing.descriptionEn : landing.description;
  const usageAreas = isEn ? (landing.usageAreasEn ?? []) : (landing.usageAreas ?? []);
  const selectionCriteria = isEn ? (landing.selectionCriteriaEn ?? []) : (landing.selectionCriteria ?? []);
  const relatedCategories = landing.relatedCategories || [];
  const faq = landing.faq || [];
  const relatedDepartments = landing.relatedDepartments || [];

  const jsonLd = buildSubcategoryJsonLd({
    slug: landing.slug,
    dept,
    title: isEn ? landing.titleEn : landing.title,
    description: isEn ? landing.descriptionEn : landing.description,
    relatedCategories: landing.relatedCategories || [],
    origin: "https://equsto.com",
    locale: isEn ? "en" : "tr",
  });

  const sortedProducts = useMemo(() => {
    const list = products.slice();
    if (sort === "name") {
      list.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "tr", { sensitivity: "base" }),
      );
    } else if (sort === "price-asc" || sort === "price-desc") {
      list.sort((a, b) => {
        const pa = productPriceTl(a);
        const pb = productPriceTl(b);
        if (pa <= 0 && pb <= 0) return 0;
        if (pa <= 0) return 1;
        if (pb <= 0) return -1;
        return sort === "price-asc" ? pa - pb : pb - pa;
      });
    }
    return list;
  }, [products, sort]);

  const shopPrefix = isEn ? "/en/shop" : "/shop";
  const deptHref = `${shopPrefix}/${dept}`;
  const deptTitle = isShopDeptSlug(dept) ? SHOP_DEPTS[dept].title : dept;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pg">
        <div className="eq-dept-plp-layout">
          <aside className="eq-dept-plp-aside" id="eq-dept-plp-aside" aria-label={isEn ? "Filters" : "Filtreler"}>
            <div className="eq-dept-plp-aside__hd">{title}</div>
            <div className="eq-landing-aside-help">
              <p>
                {isEn
                  ? "Brand, type and size filters live on the full department catalog."
                  : "Marka, tip ve ölçü filtreleri tüm departman kataloğunda."}
              </p>
              <Link className="eq-landing-aside-cta" href={deptHref}>
                {isEn ? "Open full catalog" : "Tüm katalogda filtrele"}
              </Link>
              {relatedCategories.length > 0 ? (
                <nav className="eq-landing-aside-related" aria-label={isEn ? "Related" : "İlgili"}>
                  <ul>
                    {relatedCategories.map((cat) => (
                      <li key={cat.slug}>
                        <Link href={`${shopPrefix}/${dept}/kategori/${cat.slug}`}>
                          {isEn ? cat.titleEn : cat.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          </aside>
          <div className="eq-dept-filter-backdrop" id="eq-dept-filter-backdrop" aria-hidden="true" />
          <main className="eq-dept-plp-main" id="eq-dept-plp-main">
            <header className="eq-dept-plp-header">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link href={deptHref}>{deptTitle}</Link>
                <span aria-hidden="true"> / </span>
                <span>{title}</span>
              </nav>
              <h1 className="eq-dept-plp-title">{title}</h1>
              <p className="eq-dept-plp-lead">{description}</p>
              <div className="eq-landing-toolbar">
                <p className="eq-landing-count">
                  {sortedProducts.length}{" "}
                  {isEn ? (sortedProducts.length === 1 ? "product" : "products") : "ürün"}
                </p>
                <label className="eq-landing-sort">
                  <span className="eq-landing-sort__label">{isEn ? "Sort" : "Sırala"}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label={isEn ? "Sort products" : "Ürünleri sırala"}
                  >
                    <option value="featured">{isEn ? "Featured" : "Öne çıkan"}</option>
                    <option value="price-asc">{isEn ? "Price ↑" : "Fiyat artan"}</option>
                    <option value="price-desc">{isEn ? "Price ↓" : "Fiyat azalan"}</option>
                    <option value="name">{isEn ? "Name" : "İsim"}</option>
                  </select>
                </label>
              </div>
            </header>

            <section
              className="eq-landing-products"
              aria-labelledby="products-heading"
            >
              <h2 id="products-heading" className="eq-landing-products-title">
                {title}
              </h2>
              <div
                className="eq-dept-plp-grid eq-landing-products-grid"
                id="eq-landing-products-grid"
                role="list"
              >
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((product, idx) => {
                    const href = `${shopPrefix}/${dept}/${catalogUrlSlug(product)}`;
                    const name = decodeHtmlEntities(String(product.name || ""));
                    const brand = productBrandLabel(product);
                    const img = productImageSrc(product);
                    const dims = productDimsLine(product);
                    const tl = productPriceTl(product);
                    const price = formatPriceLabel(tl, isEn);
                    return (
                      <article
                        key={String(product.id || product.sku || product.model || idx)}
                        className="eq-dept-plp-card"
                        role="listitem"
                      >
                        <Link className="eq-dept-plp-card__img" href={href}>
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt=""
                              loading={idx < 2 ? "eager" : "lazy"}
                              fetchPriority={idx < 2 ? "high" : undefined}
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="eq-img-ph" aria-hidden="true" />
                          )}
                        </Link>
                        <Link className="eq-dept-plp-card__name" href={href}>
                          {name}
                        </Link>
                        {brand ? <div className="eq-dept-plp-card__brand">{brand}</div> : null}
                        {dims ? <div className="eq-dept-plp-card__dims">{dims}</div> : null}
                        <div
                          className={
                            "eq-dept-plp-card__price" + (tl > 0 ? "" : " eq-dept-plp-card__price--quote")
                          }
                        >
                          {price}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="eq-landing-status">
                    {isEn ? "No products in this category." : "Bu kategoride ürün bulunamadı."}
                  </p>
                )}
              </div>
            </section>

            <section className="eq-landing-content" aria-labelledby="landing-desc">
              <div id="landing-desc" className="eq-landing-desc">
                <p>{description}</p>
              </div>

              {usageAreas.length > 0 && (
                <section className="eq-landing-section" aria-labelledby="usage-areas-heading">
                  <h2 id="usage-areas-heading">{isEn ? "Usage areas" : "Kullanım Alanları"}</h2>
                  <ul className="eq-landing-list">
                    {usageAreas.map((area, i) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </section>
              )}

              {selectionCriteria.length > 0 && (
                <section className="eq-landing-section" aria-labelledby="criteria-heading">
                  <h2 id="criteria-heading">{isEn ? "Selection criteria" : "Seçim Kriterleri"}</h2>
                  <ul className="eq-landing-list">
                    {selectionCriteria.map((criteria, i) => (
                      <li key={i}>{criteria}</li>
                    ))}
                  </ul>
                </section>
              )}

              {faq.length > 0 && (
                <section className="eq-landing-faq" aria-labelledby="faq-heading">
                  <h2 id="faq-heading">{isEn ? "FAQ" : "Sık Sorulan Sorular"}</h2>
                  <dl className="eq-faq-list">
                    {faq.map((item, i) => (
                      <div key={i} className="eq-faq-item">
                        <dt>{isEn ? item.qEn || item.q : item.q}</dt>
                        <dd>{isEn ? item.aEn || item.a : item.a}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {relatedDepartments.length > 0 && (
                <section className="eq-landing-depts" aria-labelledby="depts-heading">
                  <h2 id="depts-heading">{isEn ? "Related departments" : "İlgili Departmanlar"}</h2>
                  <nav aria-label={isEn ? "Related departments" : "İlgili departmanlar"}>
                    <ul>
                      {relatedDepartments.map((deptItem) => (
                        <li key={deptItem.slug}>
                          <Link href={`${shopPrefix}/${deptItem.slug}`}>
                            {isEn ? deptItem.titleEn : deptItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </section>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
