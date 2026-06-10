import { NextRequest, NextResponse } from "next/server";
import { parseWithClaude } from "@/lib/pfos/parse-upload/claude-proforma";
import { eslestirProformaKalemler } from "@/lib/pfos/parse-upload/meili-kalem-eslestir";
import { buildQuoteFromMeiliEslestirme } from "@/lib/pfos/parse-upload/build-quote";
import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import type { MatchedItem } from "@/lib/pfos/parse-upload/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export type ParseUploadOzet = {
  eslesen: number;
  mevcut_atlandi: number;
  bulunamayan: number;
  genel_toplam_eur: number;
};

export type ParseUploadResponse = PFOSResponse & {
  kaynak_dosya: string;
  toplam_kalem: number;
  ozet_eslestirme: ParseUploadOzet;
  eslestirme_kalemler: MatchedItem[];
};

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
    const baseName = name.replace(/\.pdf$/i, "");

    const parsedItems = await parseWithClaude(buffer, { notlar });
    if (parsedItems.length === 0) {
      return NextResponse.json(
        { error: "PDF'den kalem çıkarılamadı. Dosya formatını kontrol edin." },
        { status: 422 },
      );
    }

    const eslestirmeler = await eslestirProformaKalemler(parsedItems);
    const matchedItems = eslestirmeler.map((e) => e.matched);
    const quote = await buildQuoteFromMeiliEslestirme({
      eslestirmeler,
      kaynakDosya: name,
      projeAdi: projeAdi || baseName,
      sehir,
    });

    const bulunan = matchedItems.filter((i) => i.eslesen_urun !== null).length;
    const mevcut = matchedItems.filter((i) => i.mevcut).length;
    const bulunamayan = matchedItems.filter((i) => i.not_found).length;
    const genelToplam = matchedItems.reduce(
      (sum, i) => sum + (i.toplam_eur ?? 0),
      0,
    );

    const body: ParseUploadResponse = {
      ...quote,
      kaynak_dosya: name,
      toplam_kalem: parsedItems.length,
      ozet_eslestirme: {
        eslesen: bulunan,
        mevcut_atlandi: mevcut,
        bulunamayan,
        genel_toplam_eur: Math.round(genelToplam * 100) / 100,
      },
      eslestirme_kalemler: matchedItems,
    };

    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    console.error("[PFOS parse-upload]", err);
    const msg = err instanceof Error ? err.message : "Sunucu hatası";
    const status = /Anthropic|Meilisearch|502/i.test(msg) ? 502 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
