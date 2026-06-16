/**
 * 2017-128 HAVELKA (2017-128.xlsx) → all-day-dining-cafe + italyan (150–300 m²)
 *
 * Kaynak: c:\D Disk\2017\2017-128 HAVELKA\2017-128.xlsx
 * Çalışma kopyası: PFOS/veri/proje-veri/2017-128-havelka.xlsx
 *
 * Kullanım: npm run pfos:havelka:import
 */
import { execFileSync } from "node:child_process";
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_VERI = path.join(SITE, "..", "..", "PFOS", "veri", "proje-veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");

const BANT_ID = "150-300";
const REFERANS_M2 = 225;
const XLSX = "2017-128-havelka.xlsx";

const TARGETS = [
  {
    kategoriId: "all-day-dining-cafe",
    label: "All Day Dining Cafe 150–300 m² (Havelka)",
    ustKategori: "Restoran",
    kategoriLabel: "All Day Dining Cafe",
    bantLabel: "150–300 m² (Havelka)",
  },
  {
    kategoriId: "italyan",
    label: "İtalyan Restoran 150–300 m² (Havelka)",
    ustKategori: "Restaurant",
    kategoriLabel: "İtalyan Restoran",
    bantLabel: "150–300 m² (Havelka)",
  },
];

function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}

function parseAdet(raw) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : "—";
}

function parseWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 5) return;

    const a = cellStr(row.getCell(1).value); // NO / POZ
    const b = cellStr(row.getCell(2).value); // MALIN CİNSİ
    const olcu = cellStr(row.getCell(5).value);
    const adetRaw = row.getCell(9).value; // ADET

    if (!a && !b) return;
    const bu = b.toUpperCase();
    if (a === "NO" || bu === "MALIN CİNSİ" || bu === "MODEL") return;
    if (a.toUpperCase() === "TOPLAM" || bu === "TOPLAM") return;

    // Bölüm satırı: NO boş, MALIN CİNSİ dolu
    if (!a && b) {
      bolumAd = b;
      bolum = b.split(" ")[0]?.trim() || b.charAt(0);
      return;
    }

    if (!a || !b) return;
    rows.push({
      bolum,
      bolumAd,
      poz: a,
      ad: b,
      olcu: olcu || "—",
      adet: parseAdet(adetRaw),
    });
  });

  return rows;
}

async function writeListe(target, kalemler) {
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const yukleme = new Date().toISOString();
  const liste = {
    kategoriId: target.kategoriId,
    bantId: BANT_ID,
    label: target.label,
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-128 HAVELKA/2017-128.xlsx",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };
  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${target.kategoriId}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, liste.kalemSayisi, "kalem");

  return {
    id: BANT_ID,
    label: target.bantLabel,
    referansM2: REFERANS_M2,
    meta: {
      listeDosya: `${target.kategoriId}-${BANT_ID}.json`,
      kalemSayisi: liste.kalemSayisi,
      toplamAdet: liste.toplamAdet,
      kaynakDosya: liste.kaynakDosya,
      yukleme,
    },
  };
}

async function main() {
  const src = path.join(PROJE_VERI, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const ws = wb.getWorksheet("TEKLİF FORMATI") ?? wb.worksheets[0];
  const kalemler = parseWs(ws);
  if (!kalemler.length) throw new Error("Kalem bulunamadı (xlsx formatı değişmiş olabilir).");

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? [...manifest.kategoriler] : [];

  for (const target of TARGETS) {
    const bant = await writeListe(target, kalemler);
    const idx = kategoriler.findIndex((k) => k.id === target.kategoriId);
    const existing = idx >= 0 ? kategoriler[idx] : null;
    const otherBantlar = (existing?.bantlar ?? []).filter((b) => b.id !== BANT_ID);
    const kayit = {
      id: target.kategoriId,
      label: target.kategoriLabel,
      ustKategori: target.ustKategori,
      bantlar: [...otherBantlar, bant].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    };
    if (idx >= 0) kategoriler[idx] = kayit;
    else kategoriler.push(kayit);
  }

  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);

  try {
    execFileSync("node", [KORPUS_SCRIPT], { stdio: "inherit", cwd: SITE });
  } catch (e) {
    console.warn("Korpus güncellenemedi:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

