/**
 * 2024-107 KÖŞK KANAT → pfos-referans + pfos-kategoriler.json
 * Kaynak: PFOS/veri/kosk-kanat-2024-107.xlsx
 * Kullanım: npm run pfos:kanatci-kebapci:import
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadKoskKanatKalemler } from "./lib/kosk-kanat-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "kanatci-kebapci";
const BANT_ID = "100-250";
const XLSX = "kosk-kanat-2024-107.xlsx";
const REFERANS_M2 = 175;

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const kalemler = await loadKoskKanatKalemler(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Kanatçı-Kebapçı 100–250 m² (KÖŞK KANAT)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2024-107 KÖŞK KANAT/2024-107.XLSX",
    not: "KÖŞK KANAT Fenerbahçe · hazırlık · ızgara · bulaşıkhane · bar · yer ızgarası",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
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
    label: "Kanatçı-Kebapçı",
    ustKategori: "Restoran",
    bantlar: [
      {
        id: BANT_ID,
        label: "100–250 m²",
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
