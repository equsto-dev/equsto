/**
 * 2024-054 İKİNCİPLAN KAFE → coffee-shop ikinciplan bandı
 * Kaynak: PFOS/veri/ikinciplan-kafe-2024-054.xlsx
 * Kullanım: npm run pfos:ikinciplan-coffee-shop:import
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadIkinciplanKalemler } from "./lib/ikinciplan-proforma-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "coffee-shop";
const BANT_ID = "ikinciplan";
const XLSX = "ikinciplan-kafe-2024-054.xlsx";
const REFERANS_M2 = 100;

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const kalemler = await loadIkinciplanKalemler(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "İKİNCİPLAN Kafe · Coffee Shop",
    referansM2: REFERANS_M2,
    kaynakDosya: "2024-054 İKİNCİPLAN/2024-054.xlsx",
    not: "İKİNCİPLAN Kafe · pasta/içecek dolabı · espresso · filtre kahve · jet fırın · depo · yer ızgarası",
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
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const existing = idx >= 0 ? kategoriler[idx] : null;
  const bantlar = Array.isArray(existing?.bantlar) ? [...existing.bantlar] : [];
  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
  };
  const bIdx = bantlar.findIndex((b) => b.id === BANT_ID);
  const kayitBant = {
    id: BANT_ID,
    label: "İKİNCİPLAN Kafe (2024-054)",
    referansM2: REFERANS_M2,
    meta,
  };
  if (bIdx >= 0) bantlar[bIdx] = kayitBant;
  else bantlar.push(kayitBant);

  const kayit = {
    id: KATEGORI_ID,
    label: "Coffee Shop",
    ustKategori: "Kafe / Coffee Shop",
    bantlar,
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
