"use client";

import { useLayoutEffect } from "react";
import { EQUSTO_LOGO_DARK, EQUSTO_LOGO_LIGHT } from "@/lib/shop/logo";

type EqustoLogoLinkProps = {
  /** Koyu header bandı (varsayılan) */
  light?: boolean;
  className?: string;
};

function scheduleLogoRefresh() {
  window.EQUSTO_LOGO_REFRESH?.();
  return [50, 200, 600].map((ms) => window.setTimeout(() => window.EQUSTO_LOGO_REFRESH?.(), ms));
}

/** Header wordmark — SSR img + equsto-logo.js (portal sonrası) */
export default function EqustoLogoLink({ light = true, className = "logo" }: EqustoLogoLinkProps) {
  const src = light ? EQUSTO_LOGO_LIGHT : EQUSTO_LOGO_DARK;

  useLayoutEffect(() => {
    const timers = scheduleLogoRefresh();
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <a className={className} href="/" aria-label="Equsto">
      <img
        src={src}
        alt="EQUSTO"
        className="eq-logo-img eq-logo-wordmark"
        width={409}
        height={74}
        decoding="async"
        fetchPriority="high"
      />
    </a>
  );
}

declare global {
  interface Window {
    EQUSTO_LOGO_REFRESH?: () => void;
  }
}
