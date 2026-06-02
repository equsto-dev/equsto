"use client";

import { HomeHeroAdsMount } from "@/components/home/HomeHeroAdsMount";
import { HomeMainSliderMount } from "@/components/home/HomeMainSliderMount";

/** Ana sayfa React portalları — üst üçlü vitrin + alt slider */
export function HomeVitrinPortals() {
  return (
    <>
      <HomeHeroAdsMount />
      <HomeMainSliderMount />
    </>
  );
}
