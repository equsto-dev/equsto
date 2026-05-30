"use client";

import { useEffect } from "react";

export default function MarkaHubMount() {
  useEffect(() => {
    document.body.classList.add("eq-marka-hub");
    const root = document.getElementById("eq-cat-shell");
    if (window.EqMarkaHub && typeof window.EqMarkaHub.mount === "function" && root) {
      window.EqMarkaHub.mount(root);
    }
  }, []);
  return null;
}
