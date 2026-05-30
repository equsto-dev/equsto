"use client";

import Script from "next/script";
import { useEffect } from "react";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

type Props = {
  bodyHtml: string;
  bodyClass?: string;
  scripts?: string[];
  extraStyles?: string[];
  withContactWidget?: boolean;
};

/** Chrome olmayan legacy sayfalar (login, admin) */
export default function RawLegacyPage({
  bodyHtml,
  bodyClass,
  scripts = [],
  extraStyles = [],
  withContactWidget = false,
}: Props) {
  const v = SHOP_ASSET_V;

  useEffect(() => {
    if (!bodyClass) return;
    const prev = document.body.className;
    document.body.className = bodyClass;
    try {
      window.equstoSyncContactFab?.();
    } catch (_) {}
    return () => {
      document.body.className = prev;
    };
  }, [bodyClass]);

  return (
    <>
      {extraStyles.map((href) => (
        // eslint-disable-next-line @next/next/no-css-tags
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {withContactWidget ? (
        // eslint-disable-next-line @next/next/no-css-tags
        <link rel="stylesheet" href={`/contact.css?v=${v}`} />
      ) : null}
      <Script src={`/theme.js?v=${v}`} strategy="beforeInteractive" />
      <AssetCdnConfigScript />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <div className={bodyClass} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src={`/eq-i18n.js?v=${v}`} strategy="afterInteractive" />
      {withContactWidget ? (
        <Script
          src={`/contact.js?v=${v}`}
          strategy="afterInteractive"
          onReady={() => {
            try {
              window.equstoSyncContactFab?.();
            } catch (_) {}
          }}
        />
      ) : null}
      {scripts.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}

declare global {
  interface Window {
    equstoSyncContactFab?: () => void;
  }
}
