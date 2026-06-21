import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { readJsonFile } from "@/lib/legacy-data";
import { dataPath, writeJsonFile } from "@/lib/legacy-data-fs";
import { getTcmbEurEfektifSatis, kurToApiPayload } from "@/lib/tcmb-kur";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIYATLAR_FILE = () => dataPath("fiyatlar.json");
const REVALIDATE_SEC = Number(process.env.TCMB_KUR_REVALIDATE_SEC ?? "60") || 60;

/** GET /api/market?kind=kur|fiyatlar — eski /api/kur ve /api/fiyatlar */
export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind")?.trim() || "kur";

  if (kind === "fiyatlar") {
    const denied = assertAdminBearer(req);
    if (denied) return denied;

    const file = await readJsonFile<{
      success?: boolean;
      data?: Record<string, number>;
    }>("fiyatlar.json");

    if (file && typeof file === "object" && "data" in file) {
      const inner = (file as { data?: Record<string, number> }).data;
      if (inner && typeof inner === "object") {
        return adminOk({ data: inner });
      }
    }
    if (file?.success && file.data && typeof file.data === "object") {
      return adminOk({ data: file.data });
    }
    if (file && typeof file === "object" && !("success" in file) && !("version" in file)) {
      return adminOk({ data: file as Record<string, number> });
    }
    return adminOk({ data: {} });
  }

  const kur = await getTcmbEurEfektifSatis();
  const isRaw = req.nextUrl.searchParams.get("format") === "raw" || req.nextUrl.searchParams.get("raw") === "true";
  if (isRaw) {
    return new Response(String(kur.rate), {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      },
    });
  }
  const body = kurToApiPayload(kur);
  const maxAge = REVALIDATE_SEC > 0 ? REVALIDATE_SEC : 0;
  return Response.json(body, {
    headers: {
      "Cache-Control":
        maxAge > 0
          ? `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 10}`
          : "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind")?.trim() || "fiyatlar";
  if (kind !== "fiyatlar") {
    return adminErr("POST yalnızca kind=fiyatlar için", 400);
  }

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    fiyatlar?: Record<string, number>;
  };
  const fiyatlar = body.fiyatlar;
  if (!fiyatlar || typeof fiyatlar !== "object") {
    return adminErr("fiyatlar nesnesi zorunlu", 400);
  }

  try {
    await writeJsonFile(FIYATLAR_FILE(), {
      success: true,
      data: fiyatlar,
      updated_at: new Date().toISOString(),
    });
    return adminOk({ count: Object.keys(fiyatlar).length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yazma hatası";
    return adminErr(msg, 500);
  }
}
