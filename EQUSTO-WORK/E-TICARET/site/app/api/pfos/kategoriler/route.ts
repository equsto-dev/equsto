import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { findBantTanim, findKategoriTanim } from "@/lib/pfos/kategoriler/registry";
import { parseEkipmanWorksheet, toplamAdet } from "@/lib/pfos/kategoriler/parse-ekipman-xlsx";
import {
  readListeKayit,
  readManifest,
  refreshManifestFile,
  saveUploadedListe,
} from "@/lib/pfos/kategoriler/store";

export const runtime = "nodejs";

/** GET /api/pfos/kategoriler — manifest (+ ?kategori=&bant= ile liste detayı) */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const kategoriId = req.nextUrl.searchParams.get("kategori")?.trim();
  const bantId = req.nextUrl.searchParams.get("bant")?.trim();

  if (kategoriId && bantId) {
    if (!findKategoriBant(kategoriId, bantId)) {
      return adminErr("Geçersiz kategori veya bant", 400);
    }
    const liste = await readListeKayit(kategoriId, bantId);
    return adminOk({ liste });
  }

  const manifest = await readManifest();
  return adminOk({ manifest });
}

function findKategoriBant(kategoriId: string, bantId: string) {
  return findKategoriTanim(kategoriId) && findBantTanim(kategoriId, bantId);
}

/** POST /api/pfos/kategoriler — multipart: kategoriId, bantId, file (.xlsx) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  if (!form) return adminErr("multipart/form-data gerekli", 400);

  const kategoriId = String(form.get("kategoriId") || "").trim();
  const bantId = String(form.get("bantId") || "").trim();
  const file = form.get("file");

  if (!kategoriId || !bantId) {
    return adminErr("kategoriId ve bantId zorunlu", 400);
  }
  if (!findKategoriBant(kategoriId, bantId)) {
    return adminErr("Geçersiz kategori veya m² bantı", 400);
  }
  if (!file || !(file instanceof Blob)) {
    return adminErr("Excel dosyası (file) gerekli", 400);
  }

  const name =
    file instanceof File && file.name ? file.name : "yukleme.xlsx";
  if (!/\.xlsx?$/i.test(name)) {
    return adminErr("Yalnızca .xlsx desteklenir", 400);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return adminErr("Excel sayfası bulunamadı", 400);

  const kalemler = parseEkipmanWorksheet(ws);
  if (!kalemler.length) {
    return adminErr("Listeden kalem okunamadı — sütun başlıklarını kontrol edin", 400);
  }

  const manifest = await saveUploadedListe(kategoriId, bantId, kalemler, name);
  return adminOk({
    kalemSayisi: kalemler.length,
    toplamAdet: toplamAdet(kalemler),
    kaynakDosya: name,
    manifest,
  });
}

/** DELETE /api/pfos/kategoriler?kategori=&bant= — liste dosyasını kaldır (meta yenile) */
export async function DELETE(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const kategoriId = req.nextUrl.searchParams.get("kategori")?.trim() || "";
  const bantId = req.nextUrl.searchParams.get("bant")?.trim() || "";
  if (!findKategoriBant(kategoriId, bantId)) {
    return adminErr("Geçersiz kategori veya bant", 400);
  }

  const fs = await import("node:fs/promises");
  const { referansListePath } = await import("@/lib/pfos/kategoriler/store");
  try {
    await fs.unlink(referansListePath(kategoriId, bantId));
  } catch {
    /* yoksa sorun değil */
  }
  const manifest = await refreshManifestFile();
  return adminOk({ manifest });
}
