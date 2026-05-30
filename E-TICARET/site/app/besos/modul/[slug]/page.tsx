import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import BesosEqustoChrome from "@/components/besos/BesosEqustoChrome";
import BesosModulPdpBoot from "@/components/besos/BesosModulPdpBoot";
import BesosModulProductScripts from "@/components/besos/BesosModulProductScripts";
import JsonLdScript from "@/components/seo/JsonLdScript";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopStyles from "@/components/shop/ShopStyles";
import {
  besosToSsr,
  buildBesosModulJsonLd,
  buildBesosModulMetadata,
  findBesosModul,
} from "@/lib/besos/modul-pdp-server";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await findBesosModul(slug);
  if (!product) {
    return { title: "Modül bulunamadı · Besos · Equsto", robots: { index: false } };
  }
  return buildBesosModulMetadata(besosToSsr(product));
}

export default async function BesosModulProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await findBesosModul(slug);
  if (!product) notFound();

  const ssr = besosToSsr(product);
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
      <BesosEqustoChrome />
      <ShopProductMain ssr={ssr} />
      <BesosModulPdpBoot />
      <BesosModulProductScripts />
    </>
  );
}
