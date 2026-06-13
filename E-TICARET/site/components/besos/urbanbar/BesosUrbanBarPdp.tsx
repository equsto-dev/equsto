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
  features: { tr: "Ürün Özellikleri:", en: "Product Features:" },
  specs: { tr: "Teknik Özellikler:", en: "Specifications:" },
  care: { tr: "Ürün Bakımı:", en: "Product Care:" },
  safety: { tr: "Güvenlik Etiketlerini Görüntüle", en: "View Product Safety Labels" },
  besos: { tr: "Besos", en: "Besos" },
};

function ui(key: keyof typeof UI, locale: BesosLocale) {
  return UI[key][locale];
}

function HtmlBlock({ html, className }: { html?: string; className?: string }) {
  if (!html?.trim()) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
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

            <p className={`ub-pdp-stock${product.inStock === false ? " ub-pdp-stock--out" : ""}`}>
              {product.inStock === false ? ui("outOfStock", locale) : ui("inStock", locale)}
            </p>

            <BesosUrbanBarPdpCart item={cartItem} locale={locale} inStock={product.inStock !== false} />

            <BesosUrbanBarPdpActions title={product.name} url={canonicalUrl} locale={locale} />

            {product.code ? (
              <p className="ub-pdp-sku-line">
                {ui("sku", locale)}: {product.code}
              </p>
            ) : null}

            {product.introHtml ? (
              <HtmlBlock html={product.introHtml} className="ub-pdp-desc ub-pdp-prose" />
            ) : product.description ? (
              <p className="ub-pdp-desc">{product.description}</p>
            ) : null}

            {features ? (
              <section className="ub-pdp-block">
                <h2 className="ub-pdp-block__title">{ui("features", locale)}</h2>
                <ul className="ub-pdp-list">
                  {features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
            ) : product.featuresHtml ? (
              <section className="ub-pdp-block">
                <h2 className="ub-pdp-block__title">{ui("features", locale)}</h2>
                <HtmlBlock html={product.featuresHtml} className="ub-pdp-prose ub-pdp-prose--list" />
              </section>
            ) : null}

            {product.specifications?.length ? (
              <section className="ub-pdp-block">
                <h2 className="ub-pdp-block__title">{ui("specs", locale)}</h2>
                <ul className="ub-pdp-list ub-pdp-list--specs">
                  {product.specifications.map((s) => (
                    <li key={s.key}>
                      <strong>{s.key}:</strong>
                      {s.value}
                    </li>
                  ))}
                </ul>
              </section>
            ) : product.specificationsHtml ? (
              <section className="ub-pdp-block">
                <h2 className="ub-pdp-block__title">{ui("specs", locale)}</h2>
                <HtmlBlock html={product.specificationsHtml} className="ub-pdp-prose ub-pdp-prose--list" />
              </section>
            ) : null}

            {product.productCareHtml ? (
              <section className="ub-pdp-block">
                <h2 className="ub-pdp-block__title">{ui("care", locale)}</h2>
                <HtmlBlock html={product.productCareHtml} className="ub-pdp-prose" />
              </section>
            ) : null}

            {product.safetyLabelsHtml ? (
              <details className="ub-pdp-safety">
                <summary className="ub-pdp-safety__summary">{ui("safety", locale)}</summary>
                <HtmlBlock html={product.safetyLabelsHtml} className="ub-pdp-prose ub-pdp-safety__body" />
              </details>
            ) : null}
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
  const images = rawImages.map((img) => {
    const s = String(img);
    if (s.startsWith("http")) return s;
    return s.startsWith("/") ? s : `/${s}`;
  });

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
