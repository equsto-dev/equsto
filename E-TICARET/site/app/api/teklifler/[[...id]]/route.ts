import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";
import { requireMemberSession } from "@/lib/member-auth";
import {
  createTeklif,
  findTeklifByIdOrSayi,
  isTeklifDurum,
  resendTeklif,
  teklifToAdmin,
  teklifToAdminListe,
  updateTeklifRevize,
} from "@/lib/teklif";
import { kaynakUploadsByTeklifSayi } from "@/lib/pfos/liste-upload-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id?: string[] }> };

async function resolveSegments(ctx: Ctx): Promise<string[]> {
  const { id } = await ctx.params;
  return id ?? [];
}

async function resolveTeklifId(idOrSayi: string): Promise<string | null> {
  const row = await findTeklifByIdOrSayi(idOrSayi);
  return row?.id ?? null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const segments = await resolveSegments(ctx);

  if (segments.length === 2 && segments[1] === "excel") {
    const denied = assertAdminBearer(req);
    if (denied) return denied;
    const { generateTeklifV14ExcelBuffer } = await import(
      "@/lib/pfos/teklif/export-teklif-v14.server"
    );
    const { resolveTeklifV14ForTeklifId } = await import(
      "@/lib/pfos/teklif/resolve-usage-teklif-v14"
    );
    try {
      const teklifId = await resolveTeklifId(segments[0]);
      if (!teklifId) return adminErr("Teklif bulunamadı", 404);
      const model = await resolveTeklifV14ForTeklifId(teklifId);
      if (!model || !model.satirlar.length) {
        return adminErr(
          "Bu teklifin kalem kaydı yok. Yeni üretilen teklifler Excel olarak iner.",
          404,
        );
      }
      const buffer = await generateTeklifV14ExcelBuffer(model);
      const safe = (model.ust.sayi || segments[0])
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-");
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="equsto-teklif-${safe || "export"}.xlsx"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Excel oluşturulamadı";
      return adminErr(msg, 503);
    }
  }

  if (segments.length === 2 && segments[1] === "pdf") {
    const denied = assertAdminBearer(req);
    if (denied) return denied;
    const { generateTeklifV14PdfBuffer } = await import(
      "@/lib/pfos/teklif/export-teklif-v14-pdf.server"
    );
    const { resolveTeklifV14ForTeklifId } = await import(
      "@/lib/pfos/teklif/resolve-usage-teklif-v14"
    );
    const { teklifPdfFilename } = await import("@/lib/teklif/parse-v14");
    try {
      const teklifId = await resolveTeklifId(segments[0]);
      if (!teklifId) return adminErr("Teklif bulunamadı", 404);
      const model = await resolveTeklifV14ForTeklifId(teklifId);
      if (!model || !model.satirlar.length) {
        return adminErr("Bu teklifin kalem kaydı yok.", 404);
      }
      const buffer = await generateTeklifV14PdfBuffer(model);
      const filename = teklifPdfFilename(model, segments[0]);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "PDF oluşturulamadı";
      return adminErr(msg, 503);
    }
  }

  if (segments.length === 1) {
    const denied = assertAdminBearer(req);
    if (denied) return denied;
    try {
      const row = await findTeklifByIdOrSayi(segments[0]);
      if (!row) return adminErr("Teklif bulunamadı", 404);
      const admin = teklifToAdmin(row);
      const uploads = await kaynakUploadsByTeklifSayi([admin.teklif_sayi]);
      const up = uploads.get(admin.teklif_sayi.trim());
      const { resolveTeklifV14ForTeklifId } = await import(
        "@/lib/pfos/teklif/resolve-usage-teklif-v14"
      );
      const teklif_v14 = await resolveTeklifV14ForTeklifId(row.id);
      return adminOk({
        data: {
          ...admin,
          kaynak_yukleme_id: up?.id ?? null,
          kaynak_dosya: up?.original_name ?? null,
          teklif_v14,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Detay alınamadı";
      return adminErr(msg, 503);
    }
  }

  if (segments.length > 0) {
    return adminErr("Geçersiz yol", 404);
  }

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const rows = await db.teklif.findMany({
      orderBy: { createdAt: "desc" },
      take: 800,
      select: {
        id: true,
        refNo: true,
        musteriAd: true,
        konsept: true,
        toplamTl: true,
        gecerlilikBitis: true,
        durum: true,
        kaynak: true,
        musteriId: true,
        createdAt: true,
        updatedAt: true,
        payload: true,
      },
    });
    const mapped = rows.map(teklifToAdminListe);
    const uploads = await kaynakUploadsByTeklifSayi(
      mapped.map((r) => r.teklif_sayi),
    );
    const data = mapped.map((r) => {
      const up = r.teklif_sayi.trim() ? uploads.get(r.teklif_sayi.trim()) : null;
      return {
        ...r,
        kaynak_yukleme_id: up?.id ?? null,
        kaynak_dosya: up?.original_name ?? null,
      };
    });
    return adminOk({ data, count: data.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Liste alınamadı";
    return adminErr(msg, 503);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const segments = await resolveSegments(ctx);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (segments.length === 2 && segments[1] === "gonder") {
    const denied = assertAdminBearer(req);
    if (denied) return denied;
    const kanalRaw = String(body.gonderim_kanali ?? body.kanal ?? "email")
      .trim()
      .toLowerCase();
    const kanal = kanalRaw === "whatsapp" ? "whatsapp" : "email";
    try {
      const teklifId = await resolveTeklifId(segments[0]);
      if (!teklifId) return adminErr("Teklif bulunamadı", 404);
      const result = await resendTeklif(teklifId, kanal, body);
      const delivery =
        kanal === "whatsapp" ? result.customerWhatsApp : result.customerEmail;
      if (delivery.attempted && !delivery.sent) {
        return adminErr(delivery.error || "Gönderilemedi", 502);
      }
      return adminOk({
        data: result.teklif,
        customer_email: result.customerEmail,
        customer_whatsapp: result.customerWhatsApp,
        gonderim_kanali: kanal,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gönderilemedi";
      return adminErr(msg, 400);
    }
  }

  if (segments.length > 0) return adminErr("POST yalnızca /api/teklifler", 400);

  if (assertAdminBearer(req)) {
    const memberCheck = await requireMemberSession(req, body);
    if (memberCheck instanceof Response) return memberCheck;
  }

  try {
    const result = await createTeklif(body);
    return adminOk(
      {
        data: result.teklif,
        customer_email: result.customerEmail,
        customer_whatsapp: result.customerWhatsApp,
        gonderim_kanali: String(body.gonderim_kanali ?? body.kanal ?? "email"),
      },
      201,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız";
    return adminErr(msg, 400);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const segments = await resolveSegments(ctx);
  if (segments.length === 2 && segments[1] === "durum") {
    const teklifId = await resolveTeklifId(segments[0]);
    if (!teklifId) return adminErr("Teklif bulunamadı", 404);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const durum = String(body.durum ?? "").trim();
    if (!isTeklifDurum(durum)) {
      return adminErr("Geçersiz durum", 400);
    }

    try {
      const row = await db.teklif.update({
        where: { id: teklifId },
        data: { durum },
      });
      return adminOk({ data: teklifToAdmin(row) });
    } catch {
      return adminErr("Teklif bulunamadı", 404);
    }
  }

  if (segments.length !== 1) {
    return adminErr("PATCH /api/teklifler/:id veya :id/durum", 400);
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const teklifId = await resolveTeklifId(segments[0]);
    if (!teklifId) return adminErr("Teklif bulunamadı", 404);
    const row = await updateTeklifRevize(teklifId, body);
    return adminOk({ data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız";
    return adminErr(msg, 400);
  }
}
