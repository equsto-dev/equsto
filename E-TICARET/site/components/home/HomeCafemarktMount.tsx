"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeCafemarktBlock } from "@/components/home/HomeCafemarktBlock";

/** Kilitli slider (#eq-home-slider-mount) altına Cafemarkt tarzı vitrin */
export function HomeCafemarktMount() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMount(document.getElementById("eq-home-cafemarkt-mount"));
  }, []);

  useEffect(() => {
    if (!mount) return;
    mount.removeAttribute("aria-busy");
    document.body.classList.add("eq-home-cafemarkt-on");
  }, [mount]);

  if (!mount) return null;
  return createPortal(<HomeCafemarktBlock />, mount);
}
