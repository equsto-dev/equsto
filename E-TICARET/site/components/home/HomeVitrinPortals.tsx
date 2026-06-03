"use client";

/** Kilit: public/home-vitrin-KILIT.txt — npm run verify:home-vitrin-kilit */
import { HomeHeroAdsMount } from "@/components/home/HomeHeroAdsMount";
import { HomeMainSliderMount } from "@/components/home/HomeMainSliderMount";
import { HomeCafemarktMount } from "@/components/home/HomeCafemarktMount";

/** Ana sayfa React portalları — üst üçlü vitrin + alt slider + Cafemarkt vitrin */
export function HomeVitrinPortals() {
  return (
    <>
      <HomeHeroAdsMount />
      <HomeMainSliderMount />
      <HomeCafemarktMount />
    </>
  );
}
