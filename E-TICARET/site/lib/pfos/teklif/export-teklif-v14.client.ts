"use client";

import type { TeklifModelV14 } from "./teklif-v14.types";
import {
  TEKLIF_V14_TEMPLATE_URL,
  TEKLIF_V14_FORM_NO,
} from "./constants";
import { fetchTcmbKurForTeklif } from "./fetch-kur.client";
import { sanitizeTeklifV14ModelForExport } from "./sanitize-teklif-v14-export";
import { populateTeklifV14Sheet } from "./build-teklif-v14-excel";

async function fetchEurTry(): Promise<number | null> {
  const snap = await fetchTcmbKurForTeklif();
  return snap?.rate ?? null;
}

function clientSiteOrigin(): string {
  if (typeof window === "undefined") return "https://equsto.com";
  const host = window.location.origin;
  if (!host || host.includes("localhost") || host.includes("127.0.0.1")) {
    return "https://equsto.com";
  }
  return host;
}

/** equsto_teklif_v14.xlsx şablonunu doldurup indirir */
export async function downloadTeklifV14Excel(model: TeklifModelV14) {
  const ExcelJS = (await import("exceljs")).default;

  let merged = sanitizeTeklifV14ModelForExport(model);
  if (merged.ust.eurTry == null) {
    const rate = await fetchEurTry();
    if (rate) {
      merged = {
        ...merged,
        ust: { ...merged.ust, eurTry: rate },
      };
    }
  }

  const res = await fetch(TEKLIF_V14_TEMPLATE_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Şablon yüklenemedi: ${TEKLIF_V14_TEMPLATE_URL}`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await res.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel sayfası bulunamadı");

  const origin = clientSiteOrigin();
  await populateTeklifV14Sheet(wb, ws, merged, {
    kurMode: "webservice",
    kurFormulaUrl: `${origin}/api/kur?format=raw`,
    siteOrigin: origin,
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `equsto-teklif-${merged.ust.sayi}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 400);
}

export { TEKLIF_V14_FORM_NO, TEKLIF_V14_TEMPLATE_URL };
