import { NextRequest, NextResponse } from "next/server";
import { processPdfUpload } from "@/lib/pfos/parse-upload/process-pdf-upload";
import type { ProcessPdfUploadResult } from "@/lib/pfos/parse-upload/process-pdf-upload";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export type { ParseUploadOzet } from "@/lib/pfos/parse-upload/types";
export type ParseUploadResponse = ProcessPdfUploadResult;

/** POST /api/pfos/parse-upload — PDF → Claude → Meilisearch → teklif taslağı */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const name =
      file instanceof File && file.name ? file.name : "proforma.pdf";

    if (!/\.pdf$/i.test(name)) {
      return NextResponse.json(
        { error: "Sadece PDF dosyası kabul edilir" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF en fazla 15 MB olabilir" },
        { status: 400 },
      );
    }

    const sehir =
      String(formData.get("sehir") || "İstanbul").trim() || "İstanbul";
    const projeAdi = String(formData.get("projeAdi") || "").trim();
    const notlar = String(formData.get("notlar") || "").trim();

    const body = await processPdfUpload({
      buffer,
      kaynakDosya: name,
      projeAdi,
      sehir,
      notlar,
    });

    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    console.error("[PFOS parse-upload]", err);
    const msg = err instanceof Error ? err.message : "Sunucu hatası";
    const status =
      /Anthropic|Meilisearch|502|çıkarılamadı/i.test(msg) ? 502 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
