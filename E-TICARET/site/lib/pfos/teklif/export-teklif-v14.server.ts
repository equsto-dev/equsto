import { readFile } from "fs/promises";
import path from "path";
import { TEKLIF_V14_TEMPLATE_PATH } from "./constants";
import type { TeklifModelV14 } from "./teklif-v14.types";
import { sanitizeTeklifV14ModelForExport } from "./sanitize-teklif-v14-export";
import { enrichTeklifV14ModelGorsel } from "./enrich-teklif-v14-gorsel.server";
import { populateTeklifV14Sheet } from "./build-teklif-v14-excel";

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
}

/** Sunucu — PFOS v14 Excel (e-posta eki / admin indirme) */
async function loadTemplateBytes(): Promise<Buffer> {
  const candidates = [
    TEKLIF_V14_TEMPLATE_PATH,
    path.join(process.cwd(), "public/data/templates/equsto_teklif_v14.xlsx"),
    path.join(process.cwd(), "templates/teklif-v14.xlsx"),
  ];
  for (const p of candidates) {
    try {
      return await readFile(p);
    } catch {
      /* next */
    }
  }
  const res = await fetch(`${siteOrigin()}/data/templates/equsto_teklif_v14.xlsx`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Teklif Excel şablonu bulunamadı");
  return Buffer.from(await res.arrayBuffer());
}

export async function generateTeklifV14ExcelBuffer(
  model: TeklifModelV14,
): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default;
  const cleaned = sanitizeTeklifV14ModelForExport(model);
  const withGorsel = await enrichTeklifV14ModelGorsel(cleaned);
  const templateBytes = await loadTemplateBytes();
  const wb = new ExcelJS.Workbook();
  const templateAb = templateBytes.buffer.slice(
    templateBytes.byteOffset,
    templateBytes.byteOffset + templateBytes.byteLength,
  );
  // @ts-expect-error exceljs Buffer typings vs Node 22
  await wb.xlsx.load(templateAb);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel sayfası bulunamadı");

  await populateTeklifV14Sheet(wb, ws, withGorsel, {
    kurMode: "static",
    siteOrigin: siteOrigin(),
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
