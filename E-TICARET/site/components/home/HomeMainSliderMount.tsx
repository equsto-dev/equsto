"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeMainSlider } from "@/components/home/HomeMainSlider";

/** Legacy gövdedeki #eq-home-slider-mount → React ana slider (PFOS bar plan eskizi). */
export function HomeMainSliderMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("eq-home-slider-mount"));
  }, []);

  useEffect(() => {
    if (!mount) return;
    mount.removeAttribute("aria-busy");
    const w = window as Window & {
      eqI18nApply?: (node?: ParentNode | Document) => void;
      __eqMxReinitHero?: () => void;
    };
    if (typeof w.eqI18nApply === "function") w.eqI18nApply(mount);
    if (typeof w.__eqMxReinitHero === "function") w.__eqMxReinitHero();
  }, [mount]);

  if (!mount) return null;
  return createPortal(<HomeMainSlider />, mount);
}
