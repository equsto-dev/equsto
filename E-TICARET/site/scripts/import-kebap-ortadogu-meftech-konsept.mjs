/**
 * MEFTECH Orhangazi Kader → pfos-referans (kebap-ortadogu)
 * Kaynak: TEKLİF FORMATI — Mefftech (kosk-kanat-parse)
 *
 * Kullanım:
 *   npm run pfos:kebap-ortadogu:meftech:import          # 200-400 (016-3)
 *   npm run pfos:kebap-ortadogu:meftech:80-200:import  # 80-200 (016-4)
 *   node scripts/import-kebap-ortadogu-meftech-konsept.mjs 80-200
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

const KATEGORI_ID = "kebap-ortadogu";

const PROFILES = {
  "80-200": {
    xlsxName: "meftech-orhangazi-2025-016-4.xlsx",
    defaultSrc:
      "c:\\D Disk\\2025\\2025-016 MEFTECH ORHANGAZİ KADER\\2025-016-4 .XLSX",
    referansM2: 140,
    kaynakDosya: "2025-016 MEFTECH ORHANGAZİ KADER/2025-016-4.xlsx",
    label: "Kebapçı 80–200 m² (MEFTECH Orhangazi)",
    bandLabel: "80–200 m²",
    not: "MEFTECH Orhangazi Kader · kompakt kebapçı · 80–200 m² referans",
  },
  "200-400": {
    xlsxName: "meftech-orhangazi-2025-016.xlsx",
    defaultSrc:
      "c:\\D Disk\\2025\\2025-016 MEFTECH ORHANGAZİ KADER\\2025-016-3 - Kopya.XLSX",
    referansM2: 300,
    kaynakDosya: "2025-016 MEFTECH ORHANGAZİ KADER/2025-016-3.xlsx",
    label: "Kebapçı 200–400 m² (MEFTECH Orhangazi)",
    bandLabel: "200–400 m²",
    not: "MEFTECH Orhangazi Kader · kebap / ocakbaşı · kuru depo · soğuk oda · hazırlık · ızgara",
  },
};

async function main() {
  const bantId = process.argv[2] || process.env.PFOS_KEBAP_BANT || "200-400";
  const profile = PROFILES[bantId];
  if (!profile) {
    throw new Error(`Bilinmeyen bant: ${bantId} — ${Object.keys(PROFILES).join(", ")}`);
  }

  const envSrc = process.env.PFOS_MEFTECH_XLSX;
  const veriSrc = path.join(VERI_DIR, profile.xlsxName);
  let src = envSrc || veriSrc;
  try {
    await fs.access(src);
  } catch {
    src = profile.defaultSrc;
  }

  try {
    await fs.mkdir(VERI_DIR, { recursive: true });
    if (src !== veriSrc) {
      await fs.copyFile(src, veriSrc);
      console.log("Kopyalandı:", veriSrc);
    }
  } catch (e) {
    console.warn("veri kopyası atlandı:", e.message);
  }

  const kalemler = await loadKoskKanatKalemler(src);
  if (!kalemler.length) throw new Error("TEKLİF FORMATI sheet boş veya parse edilemedi");

  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId,
    label: profile.label,
    referansM2: profile.referansM2,
    kaynakDosya: profile.kaynakDosya,
    not: profile.not,
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${bantId}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* */
  }
  const meta = {
    listeDosya: `${KATEGORI_ID}-${bantId}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
  };
  const band = {
    id: bantId,
    label: profile.bandLabel,
    referansM2: profile.referansM2,
    meta,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Kebap & Ortadoğu Mutfağı",
    ustKategori: "Restoran",
    bantlar: [band],
  };
  if (idx >= 0) {
    const existing = kategoriler[idx];
    const bands = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
    const bi = bands.findIndex((b) => b.id === bantId);
    if (bi >= 0) bands[bi] = band;
    else bands.push(band);
    bands.sort((a, b) => {
      const lo = (id) => Number(String(id).split("-")[0]) || 0;
      return lo(a.id) - lo(b.id);
    });
    kategoriler[idx] = { ...existing, ...kayit, bantlar: bands };
  } else {
    kategoriler.push(kayit);
  }
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
