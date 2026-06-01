/**
 * 2017-050 DoubleTree Hilton Topkapı (140 oda şehir/business otel)
 * Kaynak: PFOS/veri/doubletree-hilton-topkapi-2017-050.xlsx
 * Kullanım: npm run pfos:sehir-otel-topkapi:import
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDoubletreeTopkapiKalemler } from "./lib/doubletree-topkapi-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "sehir-otel";
const BANT_ID = "500-2000-topkapi";
const XLSX = "doubletree-hilton-topkapi-2017-050.xlsx";
const REFERANS_M2 = 1000;

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const kalemler = await loadDoubletreeTopkapiKalemler(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Şehir Oteli (Business) 500–2000 m² (DoubleTree Topkapı)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-050 DOUBLETREE HILTON TOPKAPI/2017-050.xlsx",
    not: "140 odalı şehir/business otel · lounge · yer ızgarası · ana mutfak · banquet · bulaşıkhane",
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
    label: "Şehir Oteli (Business)",
    ustKategori: "Otel F&B",
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bi = bantlar.findIndex((b) => b.id === BANT_ID);
  const bantKayit = {
    id: BANT_ID,
    label: "500–2000 m² (DoubleTree Topkapı · 140 oda)",
    referansM2: REFERANS_M2,
    meta,
  };
  if (bi >= 0) bantlar[bi] = bantKayit;
  else bantlar.push(bantKayit);
  kayit.bantlar = bantlar;
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
