/**
 * 2024-122 Sheraton Hotel Arnavutköy → pfos-referans + pfos-kategoriler.json
 * Kaynak: PFOS/veri/sheraton-arnavutkoy-2024-122.xlsx
 * Kullanım: npm run pfos:sehir-otel-sheraton:import
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSheratonArnavutkoyKalemler } from "./lib/sheraton-arnavutkoy-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "sehir-otel";
const BANT_ID = "500-2000-arnavutkoy";
const XLSX = "sheraton-arnavutkoy-2024-122.xlsx";
const REFERANS_M2 = 1000;

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const kalemler = await loadSheratonArnavutkoyKalemler(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Şehir Oteli (Business) 500–2000 m² (Sheraton Arnavutköy)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2024-122 SHERATON ARNAVUTKÖY/2024-122-1.XLSX",
    not: "Sheraton Arnavutköy · ana mutfak · bulaşıkhane · soğuk hava · show mutfağı · açık büfe · bar",
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
    label: "500–2000 m² (Sheraton Arnavutköy · 2024-122)",
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
