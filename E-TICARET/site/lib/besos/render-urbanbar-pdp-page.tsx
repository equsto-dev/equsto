import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import BesosUrbanBarPdpBoot from "@/components/besos/urbanbar/BesosUrbanBarPdpBoot";
import BesosUrbanBarProductScripts from "@/components/besos/urbanbar/BesosUrbanBarProductScripts";
import JsonLdScript from "@/components/seo/JsonLdScript";
import ShopFooterHost from "@/components/shop/ShopFooterHost";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopProductPdpSeed from "@/components/shop/ShopProductPdpSeed";
import ShopStyles from "@/components/shop/ShopStyles";
import type { BesosLocale } from "@/lib/besos/locale";
import {
  besosUrbanBarProductSlug,
  type BesosUrbanBarSectionKey,
} from "@/lib/besos/urbanbar/catalog";
import {
  buildBesosUrbanBarJsonLd,
  loadBesosUrbanBarPdpBundle,
} from "@/lib/besos/urbanbar/pdp-server";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export async function renderBesosUrbanBarPdpPage(
  sectionKey: BesosUrbanBarSectionKey,
  pathSlug: string,
  locale: BesosLocale = "tr",
) {
  const bundle = await loadBesosUrbanBarPdpBundle(sectionKey, pathSlug, locale);
  if (!bundle) notFound();

  const canonicalSlug = besosUrbanBarProductSlug(bundle.product);
  const normalizedPath = decodeURIComponent(pathSlug).toLowerCase().replace(/_/g, "-");
  const normalizedCanonical = canonicalSlug.toLowerCase().replace(/_/g, "-");
  if (normalizedPath !== normalizedCanonical) {
    const prefix = locale === "en" ? "/en/besos" : "/besos";
    const sec = sectionKey === "bardaklar" ? "bardaklar" : "bar-ekipman";
    redirect(`${prefix}/${sec}/${encodeURIComponent(canonicalSlug)}`);
  }

  const jsonLd = buildBesosUrbanBarJsonLd(bundle.ssr);

  return (
    <>
      <ShopProductPdpSeed seed={bundle.seed} />
      <JsonLdScript data={jsonLd} />
      <Script id="besos-urbanbar-pdp-body-class" strategy="beforeInteractive">
        {`(function(){try{document.body.classList.add("eq-besos-urbanbar-pdp","eq-shop");}catch(e){}})();`}
      </Script>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-product-page.css?v=${SHOP_ASSET_V}`} precedence="high" />
      <ShopStyles variant="product" />
      <ShopProductMain ssr={bundle.ssr} />
      <BesosUrbanBarPdpBoot />
      <BesosUrbanBarProductScripts />
      <ShopFooterHost />
    </>
  );
}
