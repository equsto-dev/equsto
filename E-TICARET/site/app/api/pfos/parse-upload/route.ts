import { NextRequest, NextResponse } from "next/server";
import { processPdfUpload } from "@/lib/pfos/parse-upload/process-pdf-upload";
import type { ProcessPdfUploadResult } from "@/lib/pfos/parse-upload/process-pdf-upload";
import { getMemberIdByToken, requireMemberSession } from "@/lib/member-auth";
import { persistListeUpload } from "@/lib/pfos/liste-upload-store";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Basit in-memory rate limit (sunucu bazlı geçici koruma)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export type { ParseUploadOzet } from "@/lib/pfos/parse-upload/types";
export type ParseUploadResponse = ProcessPdfUploadResult;

/** POST /api/pfos/parse-upload — PDF → yapılandırılmış satırlar → birebir teklif */
export async function POST(req: NextRequest) {
  try {
    // GÜVENLİK (K4 Kapatıldı): Üye oturumu zorunlu
    const auth = await requireMemberSession(req, null);
    if (auth instanceof Response) return auth;

    // GÜVENLİK (K4 Kapatıldı): Üye başına Rate Limit (10 dakikada 5 dosya)
    const memberEmail = auth.session.user.email;
    const now = Date.now();
    const rateLimit = rateLimitMap.get(memberEmail);
    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= 5) {
        return NextResponse.json(
          { error: "Çok fazla dosya yüklediniz. Lütfen 10 dakika bekleyin." },
          { status: 429 }
        );
      }
      rateLimit.count++;
    } else {
      rateLimitMap.set(memberEmail, { count: 1, resetTime: now + 10 * 60 * 1000 });
    }

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

    const memberId = await getMemberIdByToken(auth.session.token);
    const saved = await persistListeUpload({
      bytes: new Uint8Array(buffer),
      originalName: name,
      kind: "pdf",
      memberId,
    });

    return NextResponse.json(
      {
        ...body,
        kaynak_yukleme_id: saved?.id ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[PFOS parse-upload]", err);
    const msg = err instanceof Error ? err.message : "Sunucu hatası";
    const userMsg = /ANTHROPIC_API_KEY|npm run api|Vercel Environment/i.test(msg)
      ? "PDF analizi için Claude anahtarı canlı ortamda tanımlı değil. Liste tekrar denenebilir veya Excel olarak yükleyin."
      : msg;
    const status =
      /Anthropic|Meilisearch|502|çıkarılamadı|ANTHROPIC/i.test(msg) ? 502 : 500;
    return NextResponse.json({ error: userMsg }, { status });
  }
}
