"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

function chromeRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById("eq-shop-chrome-root");
}

/** Üst krom — body kökünde; viewport üstüne yapışık sticky */
export default function ShopChromePortal({ children }: { children: ReactNode }) {
  const root = chromeRoot();
  if (!root) return null;
  return createPortal(children, root);
}
