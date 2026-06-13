import BesosUrbanBarPdpActions from "@/components/besos/urbanbar/BesosUrbanBarPdpActions";
import BesosUrbanBarPdpCart from "@/components/besos/urbanbar/BesosUrbanBarPdpCart";
import BesosUrbanBarPdpGallery from "@/components/besos/urbanbar/BesosUrbanBarPdpGallery";
import BesosUrbanBarPdpRelated, {
  type RelatedProduct,
} from "@/components/besos/urbanbar/BesosUrbanBarPdpRelated";
import type { BesosLocale } from "@/lib/besos/locale";
import {
  besosUrbanBarProductHref,
  besosUrbanBarProductSlug,
  besosUrbanBarSectionHref,
} from "@/lib/besos/urbanbar/catalog";
import { resolveUrbanBarGalleryImages } from "@/lib/besos/urbanbar/gallery-images";
import { splitUrbanBarPrice } from "@/lib/besos/urbanbar/price";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";

export type BesosUrbanBarPdpView = {
  product: BesosUrbanBarProduct;
  sectionKey: "bardaklar" | "bar-ekipman";
  locale: BesosLocale;
  homeHref: string;
  sectionHref: string;
  sectionLabel: string;
  canonicalUrl: string;
  images: string[];
  priceLabel: string;
  cartItem: {
    n: string;
    b: string;
    c: string;
    p: string;
    img?: string;
  };
  related: RelatedProduct[];
};

const UI = {
  sku: { tr: "SKU", en: "SKU" },
  inStock: { tr: "Stokta", en: "In stock" },
  outOfStock: { tr: "Stokta yok", en: "Out of stock" },
  desc: { tr: "Açıklama", en: "Description" },
  features: { tr: "Ürün Özellikleri", en: "Product Features" },
  specs: { tr: "Teknik Özellikler", en: "Specifications" },
  care: { tr: "Ürün Bakımı", en: "Care & Handling" },
  safety: { tr: "Güvenlik ve Sürdürülebilirlik", en: "Safety & Sustainability" },
  besos: { tr: "Besos", en: "Besos" },
};

function ui(key: keyof typeof UI, locale: BesosLocale) {
  return UI[key][locale];
}

function HtmlBlock({ html, className }: { html?: string; className?: string }) {
  if (!html?.trim()) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function getBoxQuantity(name: string, specs?: { key: string; value: string }[]): string | null {
  const nameMatch = name.match(/\bbox of (\d+)\b|\bpack of (\d+)\b|\bset of (\d+)\b/i);
  if (nameMatch) {
    const qty = nameMatch[1] || nameMatch[2] || nameMatch[3];
    return qty;
  }
  const boxSpec = specs?.find((s) => /box|pack|qty|quantity/i.test(s.key));
  if (boxSpec) return boxSpec.value;
  return null;
}

export default function BesosUrbanBarPdp({ view }: { view: BesosUrbanBarPdpView }) {
  const {
    product,
    locale,
    canonicalUrl,
    images,
    priceLabel,
    cartItem,
    related,
  } = view;
  const features = product.features?.length ? product.features : null;
  const { amount, vat } = splitUrbanBarPrice(priceLabel, locale);
  const boxQty = getBoxQuantity(product.name, product.specifications);

  return (
    <main className="besos-page ub-pdp-page ub-shop">
      <div className="ub-pdp-shell">
        <div className="ub-pdp-layout">
          <div className="ub-pdp-layout__gallery">
            <BesosUrbanBarPdpGallery images={images} name={product.name} />
          </div>

          <div className="ub-pdp-layout__info">
            <h1 className="ub-pdp-title">{product.name}</h1>

            {amount ? (
              <div className="ub-pdp-price">
                <span className="ub-pdp-price__amount">{amount}</span>
                {vat ? <span className="ub-pdp-price__vat">{vat}</span> : null}
              </div>
            ) : null}

            {boxQty ? (
              <div className="ub-pdp-box-qty">
                <span className="ub-pdp-box-qty__label">
                  {locale === "en" ? "Sold in box quantities of:" : "Kutu İçeriği Adedi:"}
                </span>
                <strong className="ub-pdp-box-qty__val"> {boxQty}</strong>
              </div>
            ) : null}

            {product.inStock !== false ? (
              <p className="ub-pdp-stock">
                {ui("inStock", locale)}
              </p>
            ) : null}

            <BesosUrbanBarPdpCart item={cartItem} locale={locale} inStock={product.inStock !== false} />

            <BesosUrbanBarPdpActions title={product.name} url={canonicalUrl} locale={locale} />

            {product.code ? (
              <p className="ub-pdp-sku-line">
                {ui("sku", locale)}: {product.code}
              </p>
            ) : null}

            <div className="ub-pdp-accordions">
              {/* Description Accordion */}
              {product.introHtml || product.description ? (
                <details className="ub-pdp-accordion" open>
                  <summary className="ub-pdp-accordion__summary">{ui("desc", locale)}</summary>
                  <div className="ub-pdp-accordion__body">
                    {product.introHtml ? (
                      <HtmlBlock html={product.introHtml} className="ub-pdp-prose" />
                    ) : (
                      <p className="ub-pdp-desc">{product.description}</p>
                    )}
                  </div>
                </details>
              ) : null}

              {/* Features Accordion */}
              {features || product.featuresHtml ? (
                <details className="ub-pdp-accordion">
                  <summary className="ub-pdp-accordion__summary">{ui("features", locale)}</summary>
                  <div className="ub-pdp-accordion__body">
                    {features ? (
                      <ul className="ub-pdp-list">
                        {features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <HtmlBlock html={product.featuresHtml} className="ub-pdp-prose ub-pdp-prose--list" />
                    )}
                  </div>
                </details>
              ) : null}

              {/* Specifications Accordion */}
              {product.specifications?.length || product.specificationsHtml ? (
                <details className="ub-pdp-accordion">
                  <summary className="ub-pdp-accordion__summary">{ui("specs", locale)}</summary>
                  <div className="ub-pdp-accordion__body">
                    {product.specifications?.length ? (
                      <ul className="ub-pdp-list ub-pdp-list--specs">
                        {product.specifications.map((s) => (
                          <li key={s.key}>
                            <strong>{s.key}:</strong>
                            {s.value}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <HtmlBlock html={product.specificationsHtml} className="ub-pdp-prose ub-pdp-prose--list" />
                    )}
                  </div>
                </details>
              ) : null}

              {/* Care Accordion */}
              {product.productCareHtml ? (
                <details className="ub-pdp-accordion">
                  <summary className="ub-pdp-accordion__summary">{ui("care", locale)}</summary>
                  <div className="ub-pdp-accordion__body">
                    <HtmlBlock html={product.productCareHtml} className="ub-pdp-prose" />
                  </div>
                </details>
              ) : null}

              {/* Safety Accordion */}
              {product.safetyLabelsHtml ? (
                <details className="ub-pdp-accordion">
                  <summary className="ub-pdp-accordion__summary">{ui("safety", locale)}</summary>
                  <div className="ub-pdp-accordion__body">
                    <HtmlBlock html={product.safetyLabelsHtml} className="ub-pdp-prose" />
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </div>

        <BesosUrbanBarPdpRelated items={related} locale={locale} />
      </div>
    </main>
  );
}

export function buildUrbanBarPdpView(
  product: BesosUrbanBarProduct,
  sectionKey: "bardaklar" | "bar-ekipman",
  locale: BesosLocale = "tr",
  relatedProducts: BesosUrbanBarProduct[] = [],
  origin = "https://equsto.com",
): BesosUrbanBarPdpView {
  const prefix = locale === "en" ? "/en" : "";
  const rawImages = product.imageUrls?.length
    ? product.imageUrls
    : [product.imageUrl, product.image].filter(Boolean);
  const images = resolveUrbanBarGalleryImages(rawImages);

  const sectionLabel = locale === "en" ? product.sectionLabelEn : product.sectionLabelTr;
  const sectionHref = besosUrbanBarSectionHref(sectionKey, locale);
  const slug = besosUrbanBarProductSlug(product);
  const pdpPath = besosUrbanBarProductHref(sectionKey, slug, locale);
  const canonicalUrl = `${origin.replace(/\/$/, "")}${pdpPath}`;

  const related: RelatedProduct[] = relatedProducts.map((p) => ({
    name: p.name,
    price: p.price || "",
    image: p.imageUrl || (p.image?.startsWith("http") ? p.image : p.image ? `/${p.image.replace(/^\.\//, "")}` : undefined),
    href: p.besosHref || besosUrbanBarProductHref(sectionKey, besosUrbanBarProductSlug(p), locale),
  }));

  return {
    product,
    sectionKey,
    locale,
    homeHref: `${prefix}/besos`,
    sectionHref,
    sectionLabel,
    canonicalUrl,
    images,
    priceLabel: product.price || "",
    cartItem: {
      n: product.name,
      b: product.vendor || "Urban Bar",
      c: product.groupLabelTr || sectionKey,
      p: product.price || "",
      img: images[0],
    },
    related,
  };
}
