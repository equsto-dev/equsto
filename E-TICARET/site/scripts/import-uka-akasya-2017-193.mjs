/**
 * 2017-193 UKA AKASYA → pfos-referans + pfos-kategoriler.json
 * Kaynak: c:\D Disk\2017\2017-193 UKA AKASYA\2017-193.xlsx (Mefftech TEKLİF FORMATI)
 * Kullanım: node scripts/import-uka-akasya-2017-193.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMefftechSayfa1Kalemler } from "./lib/mefftech-sayfa1-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");

const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "uka-akasya";
const BANT_ID = "500-1000";
const REFERANS_M2 = 500;
const SRC_XLSX = path.normalize("c:/D Disk/2017/2017-193 UKA AKASYA/2017-193.xlsx");

async function resolveSource() {
  try {
    await fs.access(SRC_XLSX);
    return SRC_XLSX;
  } catch {
    throw new Error(`Kaynak xlsx bulunamadı: ${SRC_XLSX}`);
  }
}

async function main() {
  const src = await resolveSource();
  const kalemler = await loadMefftechSayfa1Kalemler(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );

  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "UKA Akasya 500 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017/2017-193 UKA AKASYA/2017-193.xlsx",
    not: "Fine Dining · Dünya Mutfağı · 500 m²",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem", "kaynak:", src);

  let manifest = {
    version: "1",
    updated_at: new Date().toISOString(),
    kategoriler: [],
  };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }

  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
  };

  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "UKA Akasya",
    ustKategori: "Restoran",
    bantlar: [
      {
        id: BANT_ID,
        label: "500–1000 m²",
        referansM2: REFERANS_M2,
        meta,
      },
    ],
  };

  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

