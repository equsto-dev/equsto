import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { parseEkipmanWorksheet } from "@/lib/pfos/kategoriler/parse-ekipman-xlsx";
import { parseProformaExcelWorksheet } from "@/lib/pfos/liste-proforma-excel";
import {
  analyzeExcelForListe,
  analyzePdfForListe,
} from "@/lib/pfos/liste-pdf-analiz";
import { calculateListeQuote } from "@/lib/pfos/liste-fiyat";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import type { FiyatStratejisi } from "@/lib/pfos/schemas/pfos.schema";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_EXCEL_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

function parseFiyatStratejisi(raw: string): FiyatStratejisi {
  const v = raw.trim().toLowerCase();
  if (v === "ekonomik" || v === "premium" || v === "orta") return v;
  return TEKLIF_DEFAULT_FIYAT_STRATEJISI;
}

function fileKind(name: string): "excel" | "pdf" | null {
  if (/\.xlsx?$/i.test(name)) return "excel";
  if (/\.pdf$/i.test(name)) return "pdf";
  return null;
}

/** POST /api/pfos/liste-fiyat — multipart: file (.xlsx | .pdf), sehir?, projeAdi?, notlar? */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "multipart/form-data gerekli" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Dosya (file) gerekli" },
      { status: 400 },
    );
  }

  const name =
    file instanceof File && file.name ? file.name : "liste.xlsx";
  const kind = fileKind(name);
  if (!kind) {
    return NextResponse.json(
      { error: "Yalnızca .xlsx, .xls veya .pdf desteklenir" },
      { status: 400 },
    );
  }

  const ab = await file.arrayBuffer();
  const maxBytes = kind === "pdf" ? MAX_PDF_BYTES : MAX_EXCEL_BYTES;
  if (ab.byteLength > maxBytes) {
    return NextResponse.json(
      {
        error: `Dosya en fazla ${kind === "pdf" ? "15" : "8"} MB olabilir`,
      },
      { status: 400 },
    );
  }

  const sehir = String(form.get("sehir") || "İstanbul").trim() || "İstanbul";
  const projeAdi = String(form.get("projeAdi") || "").trim();
  const notlar = String(form.get("notlar") || "").trim();
  const fiyatStratejisi = parseFiyatStratejisi(
    String(form.get("fiyatStratejisi") || ""),
  );

  const baseName = name.replace(/\.(xlsx?|pdf)$/i, "");

  try {
    if (kind === "pdf") {
      const importKalemler = await analyzePdfForListe(ab, { notlar });
      const response = await calculateListeQuote({
        importKalemler,
        kaynakDosya: name,
        kaynakTip: "pdf",
        projeAdi: projeAdi || baseName,
        sehir,
        fiyatStratejisi,
      });
      return NextResponse.json(response, { status: 200 });
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(ab);
    const ws = wb.worksheets[0];
    if (!ws) {
      return NextResponse.json(
        { error: "Excel sayfası bulunamadı" },
        { status: 400 },
      );
    }

    let satirlar = parseEkipmanWorksheet(ws);
    if (!satirlar.length) {
      satirlar = parseProformaExcelWorksheet(ws);
    }
    if (satirlar.length) {
      const response = await calculateListeQuote({
        satirlar,
        kaynakDosya: name,
        kaynakTip: "excel",
        projeAdi: projeAdi || baseName,
        sehir,
        fiyatStratejisi,
      });
      return NextResponse.json(response, { status: 200 });
    }

    const importKalemler = await analyzeExcelForListe(ab, { notlar });
    const response = await calculateListeQuote({
      importKalemler,
      kaynakDosya: name,
      kaynakTip: "excel",
      projeAdi: projeAdi || baseName,
      sehir,
      fiyatStratejisi,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[PFOS liste-fiyat]", err);
    const msg = err instanceof Error ? err.message : "Sunucu hatası";
    const status = /ulaşılamad|proxy|502|Anthropic/i.test(msg) ? 502 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
