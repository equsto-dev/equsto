"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

type Props = {
  bodyHtml: string;
  bodyClass?: string;
  scripts?: string[];
  extraStyles?: string[];
};

/** Chrome olmayan legacy sayfalar (login, admin) */
export default function RawLegacyPage({ bodyHtml, bodyClass, scripts = [], extraStyles = [] }: Props) {
  const v = SHOP_ASSET_V;
  return (
    <>
      {extraStyles.map((href) => (
        // eslint-disable-next-line @next/next/no-css-tags
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <Script src={`/theme.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <div className={bodyClass} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src={`/eq-i18n.js?v=${v}`} strategy="afterInteractive" />
      {scripts.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}
