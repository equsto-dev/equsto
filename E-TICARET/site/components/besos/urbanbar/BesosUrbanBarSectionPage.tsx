import type { Metadata } from "next";
import ShopFooterHost from "@/components/shop/ShopFooterHost";
import BesosUrbanBarCatalog from "@/components/besos/urbanbar/BesosUrbanBarCatalog";
import BesosUrbanBarPowered from "@/components/besos/urbanbar/BesosUrbanBarPowered";
import { getBesosUrbanBarSection } from "@/lib/besos/urbanbar/catalog";
import type { BesosUrbanBarSectionKey } from "@/lib/besos/urbanbar/catalog";
import { loadBesosUrbanBarCatalog } from "@/lib/besos/urbanbar/load-data";
import type { BesosLocale } from "@/lib/besos/locale";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const META: Record<
  BesosUrbanBarSectionKey,
  { titleTr: string; titleEn: string; descTr: string; descEn: string }
> = {
  bardaklar: {
    titleTr: "Bardaklar · Urban Bar · Besos",
    titleEn: "Glassware · Urban Bar · Besos",
    descTr: "Urban Bar kokteyl, viski, şampanya ve servis bardakları — Besos Bar Design kataloğu.",
    descEn: "Urban Bar cocktail, whisky, champagne and serve glassware — Besos Bar Design catalogue.",
  },
  "bar-ekipman": {
    titleTr: "Bar Ekipmanları · Urban Bar · Besos",
    titleEn: "Bar Equipment · Urban Bar · Besos",
    descTr: "Urban Bar shaker, jigger, süzgeç ve profesyonel bar aksesuarları — Besos kataloğu.",
    descEn: "Urban Bar shakers, jiggers, strainers and professional bar accessories — Besos catalogue.",
  },
};

export function besosUrbanBarMetadata(section: BesosUrbanBarSectionKey, locale: BesosLocale): Metadata {
  const m = META[section];
  const title = locale === "en" ? m.titleEn : m.titleTr;
  const description = locale === "en" ? m.descEn : m.descTr;
  const path = locale === "en" ? `/en/besos/${section === "bardaklar" ? "bardaklar" : "bar-ekipman"}` : `/besos/${section === "bardaklar" ? "bardaklar" : "bar-ekipman"}`;
  return {
    title,
    description,
    alternates: { canonical: `https://equsto.com${path}` },
  };
}

type Props = {
  section: BesosUrbanBarSectionKey;
  locale?: BesosLocale;
};

export default async function BesosUrbanBarSectionPage({ section, locale = "tr" }: Props) {
  const catalog = await loadBesosUrbanBarCatalog();
  const sectionData = getBesosUrbanBarSection(catalog, section, locale);

  if (!sectionData) {
    return (
      <main className="besos-page ub-besos-page">
        <div className="ub-besos-hero">
          <p>{locale === "en" ? "Catalog not built yet." : "Katalog henüz oluşturulmadı."}</p>
        </div>
        <ShopFooterHost />
      </main>
    );
  }

  const homeHref = locale === "en" ? "/en/besos" : "/besos";
  const sectionLabel = sectionData.label;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-dept-plp.css?v=${SHOP_ASSET_V}`} />
      <main className="besos-page ub-besos-page">
        <header className="ub-besos-hero">
          <div className="ub-besos-hero-inner">
            <nav className="ub-besos-crumb" aria-label="Breadcrumb">
              <a href={homeHref}>Besos</a>
              <span aria-hidden="true">›</span>
              <span>{sectionLabel}</span>
            </nav>
            <BesosUrbanBarPowered className="ub-besos-kicker" />
            <h1>{sectionLabel}</h1>
            <p className="ub-besos-lead">{sectionData.blurb}</p>
            <p className="ub-besos-stat">
              {sectionData.productCount} {locale === "en" ? "products" : "ürün"}
            </p>
          </div>
        </header>
        <BesosUrbanBarCatalog section={sectionData} locale={locale} />
      </main>
      <ShopFooterHost />
    </>
  );
}
