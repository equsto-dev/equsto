import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import LegacyVitrinPage from "@/components/vitrin/LegacyVitrinPage";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import { IndexBodyHtml } from "@/lib/vitrin/bodies/index";
import {
  HOME_BODY_CLASS,
  HOME_CRITICAL_CSS,
  HOME_EXTRA_STYLES,
  HOME_SCRIPTS,
} from "@/lib/vitrin/legacy-scripts";

const HomeVitrinPortals = dynamic(
  () => import("@/components/home/HomeVitrinPortals").then((m) => m.HomeVitrinPortals),
  { ssr: false },
);

export const metadata: Metadata = {
  title: "Equsto | Endüstriyel Mutfak & Gastronomi Platformu",
  description:
    "Restoran, hotel, cafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları. Proje Fabrikası ile anında teklif.",
  alternates: {
    canonical: "https://equsto.com/",
    languages: { tr: "https://equsto.com/", en: "https://equsto.com/en/" },
  },
};

export default function HomePage() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="preload" href={`/theme.css?v=${SHOP_ASSET_V}`} as="style" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/theme.css?v=${SHOP_ASSET_V}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-mobile.css?v=${SHOP_ASSET_V}`} />
      <style id="eq-home-critical-css" dangerouslySetInnerHTML={{ __html: HOME_CRITICAL_CSS }} />
      <Script id="home-body-class-boot" strategy="beforeInteractive">
        {`(function(){try{var p=${JSON.stringify(HOME_BODY_CLASS)}.split(/\\s+/);for(var i=0;i<p.length;i++)if(p[i])document.body.classList.add(p[i]);}catch(e){}})();`}
      </Script>
      <LegacyVitrinPage
        bodyClass={HOME_BODY_CLASS}
        bodyHtml={IndexBodyHtml}
        scripts={HOME_SCRIPTS}
        headStyles={HOME_EXTRA_STYLES}
        portal={<HomeVitrinPortals />}
      />
    </>
  );
}
