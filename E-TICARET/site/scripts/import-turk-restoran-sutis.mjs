/**
 * 2017-006 Sütiş Şişhane → turk-restoran 200–5000 m² referans
 * Kaynak: PFOS/veri/sutis-sislihane-2017-006.xlsx
 * Kullanım: node scripts/import-turk-restoran-sutis.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSutisSislihaneXlsx } from "./lib/sutis-sislihane-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "turk-restoran";
const BANT_ID = "200-5000";
const XLS = "sutis-sislihane-2017-006.xlsx";
const REFERANS_M2 = 500;

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const kalemler = await parseSutisSislihaneXlsx(src);
  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Türk restoranı 200–5000 m² (Sütiş Şişhane)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-006 SÜTİŞ ŞİŞHANE/2017-006-2.xlsx",
    not: "Sütiş Şişhane · pide + sıcak servis + bar + bulaşıkhane · Concept teklif 2017-006",
    konseptSinif: "turk-restoran-sutis",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* */
  }
  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
    konseptSinif: liste.konseptSinif,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const sutisBant = {
    id: BANT_ID,
    label: "200–5000 m² (Sütiş Şişhane)",
    referansM2: REFERANS_M2,
    meta,
  };
  const s13Bant = {
    id: "150-300",
    label: "150–300 m² (S13-388)",
    referansM2: 220,
    meta: {
      listeDosya: "lib/pfos/data/pfos-s13-388-referanslar.json",
      konseptSinif: "s13-388-turk",
      kaynakDosya: "S13-388-2-Model.pdf",
      not: "Gömülü referans — silinmez",
    },
  };
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const prev = idx >= 0 ? kategoriler[idx] : null;
  const bantlar = Array.isArray(prev?.bantlar) ? [...prev.bantlar] : [];
  const bi = bantlar.findIndex((b) => b.id === BANT_ID);
  if (bi >= 0) bantlar[bi] = sutisBant;
  else bantlar.push(sutisBant);
  if (!bantlar.some((b) => b.id === "150-300")) bantlar.unshift(s13Bant);
  const kayit = {
    id: KATEGORI_ID,
    label: "Türk Restoranı",
    ustKategori: "Restoran",
    bantlar,
  };
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest güncellendi");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
