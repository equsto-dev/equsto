import type { ReactNode } from "react";
import Script from "next/script";
import BesosBodyClass from "@/components/besos/BesosBodyClass";
import BesosScripts from "@/components/besos/BesosScripts";
import BesosDrawerShell from "@/components/besos/BesosDrawerShell";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import "@/app/besos/besos.css";

/** Besos /en/besos — ortak layout (CSS, body sınıfları, drawer, script) */
export default function BesosLayoutShell({ children }: { children: ReactNode }) {
  const heroEmbed = "https://www.youtube-nocookie.com";
  return (
    <>
      <link rel="preconnect" href={heroEmbed} />
      <link rel="preconnect" href="https://www.youtube.com" />
      <link rel="preconnect" href="https://i.ytimg.com" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/theme.css?v=${SHOP_ASSET_V}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/besos-shell.css?v=${SHOP_ASSET_V}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/contact.css?v=${SHOP_ASSET_V}`} />
      <Script id="besos-body-class-boot" strategy="beforeInteractive">
        {`(function(){try{document.body.classList.add("bd-page","besos","eq-shop");}catch(e){}})();`}
      </Script>
      <BesosBodyClass />
      {children}
      <BesosDrawerShell />
      <BesosScripts />
    </>
  );
}
