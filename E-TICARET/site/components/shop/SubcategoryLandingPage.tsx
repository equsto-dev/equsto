"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getSubcategoryLanding } from "@/lib/shop/subcategory";
import { buildSubcategoryJsonLd } from "@/lib/seo/schemas";
import { catalogUrlSlug } from "@/lib/catalog-product-slug";

interface Props {
  landing: NonNullable<ReturnType<typeof getSubcategoryLanding>>;
  dept: string;
  locale: "tr" | "en";
  products: Record<string, unknown>[];
}

export default function SubcategoryLandingPage({ landing, dept, locale, products }: Props) {
  const isEn = locale === "en";
  const origin = "https://equsto.com";
  const trUrl = `https://equsto.com/shop/${dept}/kategori/${landing.slug}`;
  const enUrl = `https://equsto.com/en/shop/${dept}/kategori/${landing.slug}`;

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pg">
        <div className="eq-dept-plp-layout">
          <aside className="eq-dept-plp-aside" id="eq-dept-plp-aside" aria-label="Filtreler">
            <div className="eq-dept-plp-aside__hd">
              {title}
            </div>
            <div id="eq-dept-plp-facets" />
          </aside>
          <div className="eq-dept-filter-backdrop" id="eq-dept-filter-backdrop" aria-hidden="true" />
          <main className="eq-dept-plp-main" id="eq-dept-plp-main">
            <header className="eq-dept-plp-header">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link href={"/shop/" + dept}>{title}</Link>
              </nav>
              <h1 className="eq-dept-plp-title">{title}</h1>
              <p className="eq-dept-plp-lead">{description}</p>
            </header>

            <section className="eq-landing-content" aria-labelledby="landing-desc">
              <div id="landing-desc" className="eq-landing-desc">
                <p>{description}</p>
              </div>

              {usageAreas.length > 0 && (
                <section className="eq-landing-section" aria-labelledby="usage-areas-heading">
                  <h2 id="usage-areas-heading">Kullanım Alanları</h2>
                  <ul className="eq-landing-list">
                    {usageAreas.map((area, i) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </section>
              )}

              {selectionCriteria.length > 0 && (
                <section className="eq-landing-section" aria-labelledby="criteria-heading">
                  <h2 id="criteria-heading">Seçim Kriterleri</h2>
                  <ul className="eq-landing-list">
                    {selectionCriteria.map((criteria, i) => (
                      <li key={i}>{criteria}</li>
                    ))}
                  </ul>
                </section>
              )}

              {faq.length > 0 && (
                <section className="eq-landing-faq" aria-labelledby="faq-heading">
                  <h2 id="faq-heading">Sık Sorulan Sorular</h2>
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

              {relatedCategories.length > 0 && (
                <section className="eq-landing-related" aria-labelledby="related-heading">
                  <h2 id="related-heading">İlgili Kategoriler</h2>
                  <nav className="eq-related-categories" aria-label="İlgili kategoriler">
                    <ul>
                      {relatedCategories.map((cat) => (
                        <li key={cat.slug}>
                          <Link
                            href={`/shop/${dept}/kategori/${cat.slug}`}
                            hrefLang={isEn ? "en" : "tr"}
                          >
                            {isEn ? cat.titleEn : cat.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </section>
              )}

              {relatedDepartments.length > 0 && (
                <section className="eq-landing-depts" aria-labelledby="depts-heading">
                  <h2 id="depts-heading">İlgili Departmanlar</h2>
                  <nav aria-label="İlgili departmanlar">
                    <ul>
                      {relatedDepartments.map((deptItem) => (
                        <li key={deptItem.slug}>
                          <Link href={`/shop/${deptItem.slug}`}>
                            {isEn ? deptItem.titleEn : deptItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </section>
              )}
            </section>

            <section className="eq-landing-products" aria-labelledby="products-heading">
              <h2 id="products-heading" className="eq-landing-products-title">
                {title} - Ürünler
              </h2>
              <div className="eq-landing-products-grid" id="eq-landing-products-grid" role="list">
                {products.length > 0 ? (
                  products.map((product) => (
                    <Link
                      key={String(product.id || product.sku || product.model || "")}
                      href={`/shop/${dept}/${catalogUrlSlug(product)}`}
                      className="eq-product-card"
                    >
                      {String(product.name) && <h3 className="eq-product-card-title">{String(product.name)}</h3>}
                      {String(product.brand) && <p className="eq-product-card-brand">{String(product.brand)}</p>}
                      {typeof product.priceTry === "number" && product.priceTry > 0 && (
                        <p className="eq-product-card-price">
                          ₺{product.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </p>
                      )}
                    </Link>
                  ))
                ) : (
                  <p className="eq-landing-status">Bu kategoride ürün bulunamadı.</p>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
</>
);
}