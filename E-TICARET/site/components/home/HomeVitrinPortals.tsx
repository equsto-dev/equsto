"use client";

/** Kilit: public/home-vitrin-KILIT.txt — npm run verify:home-vitrin-kilit */
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
