import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { loadTipSozluguEntries, upsertTipEntry } from "@/lib/tip-sozlugu/store";

export const runtime = "nodejs";

/** POST /api/import/kaydet — PDF import onaylı tipleri sözlüğe yazar */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  let body: { ekipmanlar?: Array<{ tip_kodu?: string; ham_isim?: string; kategori?: string }> };
  try {
    body = await req.json();
  } catch {
    return adminErr("Geçersiz JSON", 400);
  }

  const rows = body.ekipmanlar;
  if (!Array.isArray(rows)) return adminErr("ekipmanlar[] gerekli", 400);

  let eklendi = 0;
  let guncellendi = 0;

  for (const row of rows) {
    const tipKodu = String(row.tip_kodu || "").trim();
    if (!tipKodu) continue;
    const existing = await loadTipSozluguEntries();
    const had = existing.some((t) => t.tip_kodu === tipKodu);
    await upsertTipEntry(tipKodu, {
      aciklama: row.ham_isim || tipKodu,
      kategori: row.kategori || "diger",
      kaynak: "import",
    });
    if (had) guncellendi++;
    else eklendi++;
  }

  return adminOk({ success: true, eklendi, guncellendi });
}
