import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";
import { normalizeEticaretIcerik } from "@/lib/pro/eticaret-normalize";

export const runtime = "nodejs";

const ETICARET_FILE = () => dataPath("eticaret-icerik.json");

// Default structure for e-ticaret content
const EMPTY_ETICARET = {
  k: [] as Array<{
    ad: string;
    desc?: string;
    start?: string;
    end?: string;
    active: boolean;
  }>,
  kp: [] as Array<{
    kod: string;
    tutar?: number;
    yuzde?: number;
    aktif: boolean;
  }>,
  b: [] as Array<{
    url: string;
    aciklama?: string;
    baslik?: string;
    konum?: string;
    image?: string;
    icon?: string;
    aktif?: boolean;
  }>,
  dy: [] as unknown[], // Dinamik Yonler
  r: [] as unknown[], // Reklamlar
  a: {} as Record<string, unknown>, // Ayarlar
};

/**
 * GET /api/eticaret-icerik
 * Load campaigns, coupons, banners (public read).
 */
export async function GET(req: NextRequest) {
  try {
    const file = await readJsonFile<typeof EMPTY_ETICARET>(ETICARET_FILE());
    if (file && typeof file === "object" && file.k) {
      return adminOk({ data: file });
    }
    return adminOk({ data: EMPTY_ETICARET });
  } catch (err) {
    console.error("Failed to load eticaret-icerik:", err);
    return adminOk({ data: EMPTY_ETICARET });
  }
}

/**
 * POST /api/eticaret-icerik
 * Save campaigns, coupons, banners, etc.
 *
 * Body:
 * {
 *   k: [{ad, desc, start, end, active}],
 *   kp: [{kod, tutar/yuzde, aktif}],
 *   b: [{url, aciklama}],
 *   dy: [],
 *   r: [],
 *   a: {}
 * }
 */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const payload = await req.json();

    const data = normalizeEticaretIcerik({
      k: Array.isArray(payload.k) ? payload.k : [],
      kp: Array.isArray(payload.kp) ? payload.kp : [],
      b: Array.isArray(payload.b) ? payload.b : [],
      dy: Array.isArray(payload.dy) ? payload.dy : [],
      r: Array.isArray(payload.r) ? payload.r : [],
      a: typeof payload.a === "object" && payload.a ? payload.a : {},
    });

    // Save to disk
    await writeJsonFile(ETICARET_FILE(), data);

    return adminOk({
      data,
      message: "E-ticaret içeriği kaydedildi",
    });
  } catch (err) {
    console.error("Failed to save eticaret-icerik:", err);
    return adminErr(
      `Kaydetme hatası: ${err instanceof Error ? err.message : "Unknown"}`,
      500,
    );
  }
}

/**
 * PUT /api/eticaret-icerik
 * Update a specific campaign or coupon
 */
export async function PUT(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const { type, index, data: itemData } = await req.json();

    // Load current data
    const current =
      (await readJsonFile<typeof EMPTY_ETICARET>(ETICARET_FILE())) || EMPTY_ETICARET;

    // Update based on type
    if (type === "kampanya" && Array.isArray(current.k) && typeof index === "number") {
      if (index >= 0 && index < current.k.length) {
        current.k[index] = { ...current.k[index], ...itemData };
      }
    } else if (type === "kupon" && Array.isArray(current.kp) && typeof index === "number") {
      if (index >= 0 && index < current.kp.length) {
        current.kp[index] = { ...current.kp[index], ...itemData };
      }
    }

    // Save
    await writeJsonFile(ETICARET_FILE(), current);

    return adminOk({
      data: current,
      message: `${type === "kampanya" ? "Kampanya" : "Kupon"} güncellendi`,
    });
  } catch (err) {
    console.error("Failed to update eticaret-icerik:", err);
    return adminErr(
      `Güncelleme hatası: ${err instanceof Error ? err.message : "Unknown"}`,
      500,
    );
  }
}

/**
 * DELETE /api/eticaret-icerik?type=kampanya&index=0
 * Delete a campaign or coupon
 */
export async function DELETE(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const type = req.nextUrl.searchParams.get("type"); // "kampanya" or "kupon"
    const index = parseInt(req.nextUrl.searchParams.get("index") || "-1", 10);

    if (index < 0) {
      return adminErr("Geçerli index gerekli", 400);
    }

    // Load current data
    const current =
      (await readJsonFile<typeof EMPTY_ETICARET>(ETICARET_FILE())) || EMPTY_ETICARET;

    // Delete based on type
    if (type === "kampanya" && Array.isArray(current.k)) {
      current.k.splice(index, 1);
    } else if (type === "kupon" && Array.isArray(current.kp)) {
      current.kp.splice(index, 1);
    } else {
      return adminErr("Geçerli type gerekli (kampanya|kupon)", 400);
    }

    // Save
    await writeJsonFile(ETICARET_FILE(), current);

    return adminOk({
      data: current,
      message: `${type === "kampanya" ? "Kampanya" : "Kupon"} silindi`,
    });
  } catch (err) {
    console.error("Failed to delete eticaret-icerik:", err);
    return adminErr(
      `Silme hatası: ${err instanceof Error ? err.message : "Unknown"}`,
      500,
    );
  }
}
