import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}
function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Rota/Doruk: col3=poz, col4=ürün, col5=ölçü, col6=adet */
export function parseKasapRotaWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 16) return;
    const poz = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = row.getCell(5).value;
    const adetRaw = row.getCell(6).value;
    if (!poz && !ad) return;
    if (/^poz|marka|ürün/i.test(poz) || /^ürün|malin/i.test(ad)) return;
    if (!isPoz(poz) && ad && typeof adetRaw !== "number") {
      bolumAd = ad;
      bolum = ad.replace(/[^A-ZÇĞİÖŞÜ]/gi, "").charAt(0) || "X";
      return;
    }
    if (isPoz(poz) && ad && typeof adetRaw === "number") {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

export async function upsertManifest(siteRoot, kayit) {
  const MANIFEST = path.join(siteRoot, "public", "data", "pfos-kategoriler.json");
  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === kayit.id);
  const entry = {
    id: kayit.id,
    label: kayit.label,
    ustKategori: kayit.ustKategori,
    bantlar: [
      {
        id: kayit.bantId,
        label: kayit.labelBant,
        referansM2: kayit.referansM2,
        meta: kayit.meta,
      },
    ],
  };
  if (idx >= 0) kategoriler[idx] = entry;
  else kategoriler.push(entry);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", kayit.id);
}
