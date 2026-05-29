import type { Metadata } from "next";
import Script from "next/script";
import BesosEqustoChrome from "@/components/besos/BesosEqustoChrome";
import BesosModulProductScripts from "@/components/besos/BesosModulProductScripts";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopStyles from "@/components/shop/ShopStyles";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bar modülü · Besos · Equsto",
  description:
    "Besos Bar Design Studio modül detayı — teknik özellikler, fiyat, stok ve teklif.",
  alternates: {
    canonical: "https://equsto.com/besos/modul",
    languages: {
      tr: "https://equsto.com/besos/modul",
      en: "https://equsto.com/en/besos/modul",
    },
  },
};

export default function BesosModulProductPage() {
  return (
    <>
      <Script id="besos-modul-pdp-body-class" strategy="beforeInteractive">
        {`(function(){try{document.body.classList.add("eq-besos-modul-pdp");}catch(e){}})();`}
      </Script>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-product-page.css?v=${SHOP_ASSET_V}`} precedence="high" />
      <ShopStyles variant="product" />
      <BesosEqustoChrome />
      <ShopProductMain />
      <BesosModulProductScripts />
    </>
  );
}
