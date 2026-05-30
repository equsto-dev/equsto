"use client";

import { useLayoutEffect } from "react";

const IMT300_BODY_EXTRA = ["besos-sub", "eq-imt-page"];

/** IMT300 — Besos layout sınıflarına eq-imt-page ekler (CSS seçicileri için) */
export default function Imt300BodyClass() {
  useLayoutEffect(() => {
    IMT300_BODY_EXTRA.forEach((c) => document.body.classList.add(c));
    return () => IMT300_BODY_EXTRA.forEach((c) => document.body.classList.remove(c));
  }, []);

  return null;
}
