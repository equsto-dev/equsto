import { notFound } from "next/navigation";
import Script from "next/script";
import BesosModulPdpBoot from "@/components/besos/BesosModulPdpBoot";
import BesosModulProductScripts from "@/components/besos/BesosModulProductScripts";
import JsonLdScript from "@/components/seo/JsonLdScript";
import ShopFooterHost from "@/components/shop/ShopFooterHost";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopStyles from "@/components/shop/ShopStyles";
import {
  besosToSsr,
  buildBesosModulJsonLd,
  findBesosModul,
} from "@/lib/besos/modul-pdp-server";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export async function renderBesosModulPage(
  slug: string,
  locale: "tr" | "en" = "tr",
) {
  const product = await findBesosModul(slug);
  if (!product) notFound();

  const ssr = besosToSsr(product, locale);
  const jsonLd = buildBesosModulJsonLd(ssr);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <Script id="besos-modul-pdp-body-class" strategy="beforeInteractive">
        {`(function(){try{document.body.classList.add("eq-besos-modul-pdp");}catch(e){}})();`}
      </Script>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-product-page.css?v=${SHOP_ASSET_V}`} precedence="high" />
      <ShopStyles variant="product" />
      <ShopProductMain ssr={ssr} />
      <BesosModulPdpBoot />
      <BesosModulProductScripts />
      <ShopFooterHost />
    </>
  );
}
