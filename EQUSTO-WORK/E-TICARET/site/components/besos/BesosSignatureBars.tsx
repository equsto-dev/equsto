import { BESOS_STUDIO } from "@/lib/besos/branding";
import Image from "next/image";
import Link from "next/link";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { findBesosProduct } from "@/lib/besos/catalog";
import { besosModuleHrefFromProduct } from "@/lib/besos/module-url";
import type { BesosProduct, BesosSignatureItem } from "@/lib/besos/types";

type Props = {
  items: BesosSignatureItem[];
  products: BesosProduct[];
};

export default function BesosSignatureBars({ items, products }: Props) {
  return (
    <section className="bes-vitrum-signature" aria-label="İmza barlar">
      <div className="bes-vitrum-signature-head">
        <p className="bd-vl-kicker">{BESOS_STUDIO} imza barları</p>
        <h2>İmza barlar</h2>
      </div>
      {items.map((item, index) => {
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
                  <span className="bes-vitrum-sig-media-empty">Görsel</span>
                )}
              </div>
              <div className="bes-vitrum-sig-body">
                <span className="bes-vitrum-sig-num">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="bes-vitrum-sig-name">{item.name}</h3>
                <p className="bes-vitrum-sig-tag">{item.tagline}</p>
                <p className="bes-vitrum-sig-desc">{item.blurb}</p>
                <Link className="bes-vitrum-sig-cta" href={besosModuleHrefFromProduct(mod ?? { slug: item.slug, name: item.name, code: item.slug, category: "Signature Bar" })}>
                  Modül sayfası →
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
