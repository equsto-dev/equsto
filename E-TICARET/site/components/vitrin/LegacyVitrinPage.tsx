"use client";

import type { ReactNode } from "react";
import Script from "next/script";
import VitrinShell from "@/components/vitrin/VitrinShell";

type LegacyVitrinPageProps = {
  bodyClass: string;
  bodyHtml: string;
  scripts: string[];
  extraCss?: string;
  headStyles?: string[];
  headScripts?: ReactNode;
  styleVariant?: "plp" | "product" | "cart" | "search" | "pfos";
};

/** Büyük legacy sayfalar — HTML gövde TS modülünde, chrome React */
export default function LegacyVitrinPage({
  bodyClass,
  bodyHtml,
  scripts,
  extraCss,
  headStyles = [],
  headScripts,
  styleVariant = "plp",
}: LegacyVitrinPageProps) {
  return (
    <>
      {headStyles.map((href) => (
        // eslint-disable-next-line @next/next/no-css-tags
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {headScripts}
      <VitrinShell bodyClass={bodyClass} extraCss={extraCss} styleVariant={styleVariant}>
        <div id="eq-legacy-vitrin-root" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </VitrinShell>
      {scripts.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}
