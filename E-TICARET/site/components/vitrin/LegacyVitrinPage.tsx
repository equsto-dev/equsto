"use client";

import { useEffect, type ReactNode } from "react";
import Script from "next/script";
import VitrinShell from "@/components/vitrin/VitrinShell";

function applyLegacyVitrinI18n() {
  const root = document.getElementById("eq-legacy-vitrin-root");
  if (!root) return;
  const w = window as Window & {
    eqI18nApply?: (node?: ParentNode | Document) => void;
    eqPfosI18nApply?: () => void;
    eqI18nReady?: Promise<void>;
  };
  if (typeof w.eqI18nApply === "function") w.eqI18nApply(root);
  if (typeof w.eqPfosI18nApply === "function") w.eqPfosI18nApply();
}

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
  useEffect(() => {
    applyLegacyVitrinI18n();
    const w = window as Window & { eqI18nReady?: Promise<void> };
    if (w.eqI18nReady && typeof w.eqI18nReady.then === "function") {
      w.eqI18nReady.then(applyLegacyVitrinI18n);
    }
    window.addEventListener("equsto:i18n-ready", applyLegacyVitrinI18n);
    return () => window.removeEventListener("equsto:i18n-ready", applyLegacyVitrinI18n);
  }, [bodyHtml]);

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
