/**
 * 2016-159 Zigana Otel Alaçatı → sehir-otel (50–80 oda; en küçük şehir oteli referansı)
 * Kaynak: PFOS/veri/zigana-sehir-otel-2016-159.xls
 * Kullanım: npm run pfos:sehir-otel-zigana:import
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
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");
const PY = path.join(__dirname, "lib", "parse-zigana-otel-xls.py");

const KATEGORI_ID = "sehir-otel";
const BANT_ID = "50-80-oda";
const XLS = "zigana-sehir-otel-2016-159.xls";
const REFERANS_M2 = 300;

function parseXls(src) {
  const raw = execFileSync("python", [PY, src], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
    },
  });
  return JSON.parse(raw);
}

async function upsertManifest(bantKayit) {
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
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bi = bantlar.findIndex((b) => b.id === bantKayit.id);
  if (bi >= 0) bantlar[bi] = bantKayit;
  else bantlar.unshift(bantKayit);
  kayit.bantlar = bantlar;
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
}

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const kalemler = parseXls(src);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const yukleme = new Date().toISOString();

  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Şehir Oteli (Business) 50–80 oda (Zigana Alaçatı)",
    referansM2: REFERANS_M2,
    kaynakDosya:
      "2016-159 ZİGANA OTEL LAINOX/MUTFAK MALZEME zigana resort hotel alaçatı - LAINOX FİYAT TEKLİFİ YERLİ EKİPMAN.xls",
    not: "Zigana Alaçatı · 50–80 oda · en küçük şehir oteli referansı (şehir otelleriyle kıyas için)",
    konseptSinif: "sehir-otel-oda-50-80",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  await upsertManifest({
    id: BANT_ID,
    label: "50–80 oda (Zigana Alaçatı)",
    referansM2: REFERANS_M2,
    meta: {
      listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
      kalemSayisi: liste.kalemSayisi,
      toplamAdet: liste.toplamAdet,
      kaynakDosya: liste.kaynakDosya,
      yukleme,
      konseptSinif: liste.konseptSinif,
    },
  });
  console.log("Manifest güncellendi:", KATEGORI_ID, BANT_ID);

  try {
    execFileSync("node", [KORPUS_SCRIPT], { stdio: "inherit", cwd: SITE });
  } catch (e) {
    console.warn("Korpus güncellenemedi:", e?.message ?? String(e));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

