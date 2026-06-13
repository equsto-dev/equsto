import Link from "next/link";
import BesosUrbanBarPdpCart from "@/components/besos/urbanbar/BesosUrbanBarPdpCart";
import BesosUrbanBarPdpGallery from "@/components/besos/urbanbar/BesosUrbanBarPdpGallery";
import type { BesosLocale } from "@/lib/besos/locale";
import { besosUrbanBarSectionHref } from "@/lib/besos/urbanbar/catalog";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";

export type BesosUrbanBarPdpView = {
  product: BesosUrbanBarProduct;
  sectionKey: "bardaklar" | "bar-ekipman";
  locale: BesosLocale;
  homeHref: string;
  sectionHref: string;
  sectionLabel: string;
  images: string[];
  priceLabel: string;
  cartItem: {
    n: string;
    b: string;
    c: string;
    p: string;
    img?: string;
  };
};

const UI = {
  sku: { tr: "SKU", en: "SKU" },
  inStock: { tr: "Stokta", en: "In stock" },
  outOfStock: { tr: "Stokta yok", en: "Out of stock" },
  features: { tr: "Ürün Özellikleri", en: "Product Features" },
  specs: { tr: "Teknik Özellikler", en: "Specifications" },
  care: { tr: "Ürün Bakımı", en: "Product Care" },
  safety: { tr: "Güvenlik Etiketleri", en: "Product Safety Labels" },
  vat: { tr: "KDV dahil", en: "Incl. VAT" },
  urbanBar: { tr: "Urban Bar", en: "Urban Bar" },
  besos: { tr: "Besos", en: "Besos" },
  source: { tr: "Kaynak", en: "Source" },
};

function ui(key: keyof typeof UI, locale: BesosLocale) {
  return UI[key][locale];
}

function HtmlBlock({ html, className }: { html?: string; className?: string }) {
  if (!html?.trim()) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function BesosUrbanBarPdp({ view }: { view: BesosUrbanBarPdpView }) {
  const { product, locale, homeHref, sectionHref, sectionLabel, images, priceLabel, cartItem } = view;
  const groupLabel = locale === "en" ? product.groupLabelEn : product.groupLabelTr;
  const features = product.features?.length ? product.features : null;

  return (
    <main className="besos-page ub-pdp-page">
      <div className="ub-pdp-shell">
        <nav className="ub-pdp-crumb" aria-label="Breadcrumb">
          <Link href={homeHref}>{ui("besos", locale)}</Link>
          <span aria-hidden="true">›</span>
          <Link href={sectionHref}>{sectionLabel}</Link>
          <span aria-hidden="true">›</span>
          <span>{product.name}</span>
        </nav>

        <div className="ub-pdp-grid">
          <BesosUrbanBarPdpGallery images={images} name={product.name} />

          <div className="ub-pdp-summary">
            <p className="ub-pdp-kicker">{ui("urbanBar", locale)}</p>
            <h1 className="ub-pdp-title">{product.name}</h1>

            <div className="ub-pdp-meta">
              {product.code ? (
                <span className="ub-pdp-sku">
                  {ui("sku", locale)}: <strong>{product.code}</strong>
                </span>
              ) : null}
              <span className={`ub-pdp-stock${product.inStock === false ? " ub-pdp-stock--out" : ""}`}>
                {product.inStock === false ? ui("outOfStock", locale) : ui("inStock", locale)}
              </span>
            </div>

            {priceLabel ? (
              <div className="ub-pdp-price">
                <span className="ub-pdp-price__amount">{priceLabel}</span>
                <span className="ub-pdp-price__vat">{ui("vat", locale)}</span>
              </div>
            ) : null}

            <BesosUrbanBarPdpCart item={cartItem} locale={locale} />

            {groupLabel ? <div className="ub-pdp-group-label">{groupLabel}</div> : null}
          </div>
        </div>

        <div className="ub-pdp-details">
          {product.introHtml ? (
            <section className="ub-pdp-section">
              <HtmlBlock html={product.introHtml} className="ub-pdp-prose" />
            </section>
          ) : product.description ? (
            <section className="ub-pdp-section">
              <p className="ub-pdp-prose">{product.description}</p>
            </section>
          ) : null}

          {features ? (
            <section className="ub-pdp-section">
              <h2 className="ub-pdp-section__title">{ui("features", locale)}</h2>
              <ul className="ub-pdp-features">
                {features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : product.featuresHtml ? (
            <section className="ub-pdp-section">
              <h2 className="ub-pdp-section__title">{ui("features", locale)}</h2>
              <HtmlBlock html={product.featuresHtml} className="ub-pdp-prose ub-pdp-prose--list" />
            </section>
          ) : null}

          {product.specifications?.length ? (
            <section className="ub-pdp-section">
              <h2 className="ub-pdp-section__title">{ui("specs", locale)}</h2>
              <dl className="ub-pdp-specs">
                {product.specifications.map((s) => (
                  <div key={s.key} className="ub-pdp-specs__row">
                    <dt>{s.key}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : product.specificationsHtml ? (
            <section className="ub-pdp-section">
              <h2 className="ub-pdp-section__title">{ui("specs", locale)}</h2>
              <HtmlBlock html={product.specificationsHtml} className="ub-pdp-prose ub-pdp-prose--list" />
            </section>
          ) : null}

          {product.productCareHtml ? (
            <section className="ub-pdp-section">
              <h2 className="ub-pdp-section__title">{ui("care", locale)}</h2>
              <HtmlBlock html={product.productCareHtml} className="ub-pdp-prose" />
            </section>
          ) : null}

          {product.safetyLabelsHtml ? (
            <section className="ub-pdp-section">
              <h2 className="ub-pdp-section__title">{ui("safety", locale)}</h2>
              <HtmlBlock html={product.safetyLabelsHtml} className="ub-pdp-prose" />
            </section>
          ) : null}

          {product.sourceUrl ? (
            <p className="ub-pdp-source">
              {ui("source", locale)}:{" "}
              <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
                urbanbar.com
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export function buildUrbanBarPdpView(
  product: BesosUrbanBarProduct,
  sectionKey: "bardaklar" | "bar-ekipman",
  locale: BesosLocale = "tr",
): BesosUrbanBarPdpView {
  const prefix = locale === "en" ? "/en" : "";
  const rawImages = product.imageUrls?.length
    ? product.imageUrls
    : [product.imageUrl, product.image].filter(Boolean);
  const images = rawImages.map((img) => {
    const s = String(img);
    if (s.startsWith("http")) return s;
    return s.startsWith("/") ? s : `/${s}`;
  });

  const sectionLabel = locale === "en" ? product.sectionLabelEn : product.sectionLabelTr;

  return {
    product,
    sectionKey,
    locale,
    homeHref: `${prefix}/besos`,
    sectionHref: besosUrbanBarSectionHref(sectionKey, locale),
    sectionLabel,
    images,
    priceLabel: product.price || "",
    cartItem: {
      n: product.name,
      b: product.vendor || "Urban Bar",
      c: product.groupLabelTr || sectionKey,
      p: product.price || "",
      img: images[0],
    },
  };
}
