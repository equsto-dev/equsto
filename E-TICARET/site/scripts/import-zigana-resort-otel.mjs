/**
 * 2016-159 Zigana Resort Hotel Alaçatı → resort-otel ölçekli otel referans
 * Kaynak: PFOS/veri/zigana-otel-2016-159.xls
 * Kullanım: node scripts/import-zigana-resort-otel.mjs
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
const PY = path.join(__dirname, "lib", "parse-zigana-otel-xls.py");

const KATEGORI_ID = "resort-otel";
const BANT_ID = "200-500";
const XLS = "zigana-otel-2016-159.xls";
const REFERANS_M2 = 300;

function parseXls(src) {
  const raw = execFileSync("python", [PY, src], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const kalemler = parseXls(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Resort otel 200–500 m² (Zigana Alaçatı)",
    referansM2: REFERANS_M2,
    kaynakDosya:
      "2016-159 ZİGANA OTEL LAINOX/MUTFAK MALZEME zigana resort hotel alaçatı.xls",
    not: "Zigana Resort Alaçatı · üst kat restaurant + personel mutfak · ölçekli otel (Lainox)",
    konseptSinif: "resort-otel-olcekli",
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
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Resort Otel (ölçekli)",
    ustKategori: "Otel F&B",
    bantlar: [
      {
        id: BANT_ID,
        label: "200–500 m² (Zigana Alaçatı)",
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
  console.log("Manifest güncellendi");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
