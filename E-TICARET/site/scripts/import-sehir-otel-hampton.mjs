/**
 * 2016-088 Hampton By Hilton Bolu → pfos-referans (şehir oteli)
 * Kaynak: PFOS/veri/hampton-sehir-otel-2016-088.xls
 * Kullanım: node scripts/import-sehir-otel-hampton.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const PY = path.join(__dirname, "lib", "parse-hampton-xls.py");

const KATEGORI_ID = "sehir-otel";
const BANT_HAMPTON = "500-2000";
const BANT_KOCAELI = "500-2000-kocaeli";
const XLS = "hampton-sehir-otel-2016-088.xls";
const REFERANS_M2 = 1000;

function parseXls(src) {
  const raw = execFileSync("python", [PY, src], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(raw);
}

async function upsertManifest(bantlar) {
  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Şehir Oteli (Business)",
    ustKategori: "Otel F&B",
    bantlar,
  };
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
}

async function writeListe(bantId, kalemler, meta) {
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId,
    label: meta.label,
    referansM2: meta.referansM2,
    kaynakDosya: meta.kaynakDosya,
    not: meta.not,
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet: kalemler.reduce((t, r) => t + (typeof r.adet === "number" ? r.adet : 0), 0),
    kalemler,
  };
  const dest = path.join(OUT, `${KATEGORI_ID}-${bantId}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");
  return {
    id: bantId,
    label: meta.bantLabel,
    referansM2: meta.referansM2,
    meta: {
      listeDosya: `${KATEGORI_ID}-${bantId}.json`,
      kalemSayisi: liste.kalemSayisi,
      toplamAdet: liste.toplamAdet,
      kaynakDosya: liste.kaynakDosya,
      yukleme: liste.yukleme,
    },
  };
}

async function archiveKocaeli() {
  const primary = path.join(OUT, `${KATEGORI_ID}-${BANT_HAMPTON}.json`);
  const kocaeliDest = path.join(OUT, `${KATEGORI_ID}-${BANT_KOCAELI}.json`);
  try {
    const existing = JSON.parse(await fs.readFile(primary, "utf8"));
    if (existing.kaynakDosya?.includes("077") && !(await fs.stat(kocaeliDest).catch(() => null))) {
      existing.bantId = BANT_KOCAELI;
      await fs.writeFile(kocaeliDest, JSON.stringify(existing, null, 2), "utf8");
      console.log("Archived Kocaeli →", kocaeliDest);
      return {
        id: BANT_KOCAELI,
        label: "500–2000 m² (Kocaeli)",
        referansM2: existing.referansM2 ?? 1000,
        meta: {
          listeDosya: `${KATEGORI_ID}-${BANT_KOCAELI}.json`,
          kalemSayisi: existing.kalemSayisi,
          toplamAdet: existing.toplamAdet,
          kaynakDosya: existing.kaynakDosya,
          yukleme: existing.yukleme,
        },
      };
    }
  } catch {
    /* */
  }
  try {
    await fs.access(kocaeliDest);
    const k = JSON.parse(await fs.readFile(kocaeliDest, "utf8"));
    return {
      id: BANT_KOCAELI,
      label: "500–2000 m² (Kocaeli)",
      referansM2: k.referansM2 ?? 1000,
      meta: {
        listeDosya: `${KATEGORI_ID}-${BANT_KOCAELI}.json`,
        kalemSayisi: k.kalemSayisi,
        toplamAdet: k.toplamAdet,
        kaynakDosya: k.kaynakDosya,
        yukleme: k.yukleme,
      },
    };
  } catch {
    return null;
  }
}

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const kalemler = parseXls(src);
  await fs.mkdir(OUT, { recursive: true });

  const kocaeliBant = await archiveKocaeli();
  const hamptonBant = await writeListe(BANT_HAMPTON, kalemler, {
    label: "Şehir Oteli (Business) 500–2000 m²",
    bantLabel: "500–2000 m² (Hampton Bolu)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-088 HAMPTON BY HILTON BOLU/Hampton By Hilton.xls",
    not: "Hampton By Hilton Bolu · şehir/business otel F&B",
  });

  const bantlar = [hamptonBant];
  if (kocaeliBant) bantlar.push(kocaeliBant);
  await upsertManifest(bantlar);
  console.log("Manifest güncellendi:", KATEGORI_ID, bantlar.length, "bant");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
