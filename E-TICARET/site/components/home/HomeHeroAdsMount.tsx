"use client";

/** Kilit: public/home-hero-ads-KILIT.txt — npm run verify:home-hero-ads-kilit */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeHeroAds } from "@/components/home/HomeHeroAds";

/** Legacy index gövdesindeki #eq-home-hero-mount noktasına React vitrin kartlarını yerleştirir. */
export function HomeHeroAdsMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const mountEl = document.getElementById("eq-home-hero-mount");
    const banner = document.querySelector(
      ".right-col > .hero-banner.eq-world-first-banner",
    );
    if (banner && mountEl && !mountEl.parentElement?.classList.contains("eq-home-platform-hero")) {
      const wrap = document.createElement("div");
      wrap.className = "eq-home-platform-hero";
      const parent = banner.parentElement;
      if (parent) {
        parent.insertBefore(wrap, banner);
        wrap.appendChild(banner);
        wrap.appendChild(mountEl);
      }
    }
    setMount(mountEl);
  }, []);

  useEffect(() => {
    if (!mount) return;
    mount.removeAttribute("aria-busy");
    const w = window as Window & { eqI18nApply?: (node?: ParentNode | Document) => void };
    if (typeof w.eqI18nApply === "function") w.eqI18nApply(mount);
  }, [mount]);

  if (!mount) return null;
  return createPortal(<HomeHeroAds />, mount);
}
