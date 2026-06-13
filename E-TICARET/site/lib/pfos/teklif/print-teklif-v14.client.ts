"use client";

import type { TeklifModelV14 } from "./teklif-v14.types";
import { buildTeklifV14PrintHtml } from "./build-teklif-v14-print-html";
import { sanitizeTeklifV14ModelForExport } from "./sanitize-teklif-v14-export";

/** Görselli teklifi yazdır / PDF olarak kaydet (yönetim / pro) */
export function printTeklifV14(model: TeklifModelV14) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://equsto.com";
  const html = buildTeklifV14PrintHtml(sanitizeTeklifV14ModelForExport(model), {
    siteOrigin: origin,
    autoPrint: true,
  });
  const w = window.open("", "_blank");
  if (!w) {
    alert("Pop-up engellendi. Tarayıcıda pop-up izni verin.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
