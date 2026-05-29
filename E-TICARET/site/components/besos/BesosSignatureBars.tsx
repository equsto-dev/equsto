import { BESOS_STUDIO } from "@/lib/besos/branding";
import Image from "next/image";
import Link from "next/link";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { findBesosProduct } from "@/lib/besos/catalog";
import type { BesosLocale } from "@/lib/besos/locale";
import { localizeSignatureItem } from "@/lib/besos/locale";
import { besosModuleHrefFromProduct } from "@/lib/besos/module-url";
import { besosUi } from "@/lib/besos/ui-strings";
import type { BesosProduct, BesosSignatureItem } from "@/lib/besos/types";

type Props = {
  items: BesosSignatureItem[];
  products: BesosProduct[];
  locale?: BesosLocale;
};

export default function BesosSignatureBars({ items, products, locale = "tr" }: Props) {
  return (
    <section className="bes-vitrum-signature" aria-label={besosUi("signatureAria", locale)}>
      <div className="bes-vitrum-signature-head">
        <p className="bd-vl-kicker">{besosUi("signatureKicker", locale)}</p>
        <h2>{besosUi("signatureTitle", locale)}</h2>
      </div>
      {items.map((item, index) => {
        const localized = localizeSignatureItem(item, locale);
        const mod = findBesosProduct(products, item.slug);
        const img = mod?.image ? besosAssetPath(mod.image) : "";
        const reversed = index % 2 === 1;
        return (
          <article
            key={item.slug}
            className={`bes-vitrum-sig-page${reversed ? " bes-vitrum-sig-page--reverse" : ""}`}
          >
            <div className="bes-vitrum-sig-page-inner">
              <div className="bes-vitrum-sig-media">
                {img ? (
                  <Image
                    src={img}
                    alt={item.name}
                    width={960}
                    height={720}
                    loading="lazy"
                    unoptimized
                  />
                ) : (
                  <span className="bes-vitrum-sig-media-empty">{besosUi("signatureMediaPh", locale)}</span>
                )}
              </div>
              <div className="bes-vitrum-sig-body">
                <span className="bes-vitrum-sig-num">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="bes-vitrum-sig-name">{item.name}</h3>
                <p className="bes-vitrum-sig-tag">{localized.tagline}</p>
                <p className="bes-vitrum-sig-desc">{localized.blurb}</p>
                <Link
                  className="bes-vitrum-sig-cta"
                  href={besosModuleHrefFromProduct(
                    mod ?? { slug: item.slug, name: item.name, code: item.slug, category: "Signature Bar" },
                    locale,
                  )}
                >
                  {besosUi("modulePage", locale)}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
