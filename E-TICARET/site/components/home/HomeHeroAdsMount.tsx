"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeHeroAds } from "@/components/home/HomeHeroAds";

/** Legacy index gövdesindeki #eq-home-hero-mount noktasına React vitrin kartlarını yerleştirir. */
export function HomeHeroAdsMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("eq-home-hero-mount"));
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
