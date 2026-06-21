/**
 * 2018-199-3.xlsx → PFOS referans + GEO tablolar
 * Hedef: Dünya Mutfağı, İtalyan Restoran, All Day Dining Cafe
 *
 * Kullanım: node scripts/import-2018-199-3.mjs [xlsx-yolu]
 */
import { execFileSync } from "node:child_process";
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const OUT_REF = path.join(SITE, "public", "data", "pfos-referans");
const OUT_GEO = path.join(SITE, "public", "data", "geo");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");
const DEFAULT_XLSX = path.join(process.env.USERPROFILE || "", "Desktop", "2018-199-3.xlsx");

const BAND_ID = "2018-199";
const REFERANS_M2 = 275;
const KAYNAK = "2018-199-3.xlsx";

const ZONE_PREFIX = {
  mutfak: "A",
  bulaşıkhane: "B",
  "sebze soğuk oda": "C",
  "et soğuk oda": "D",
  "et derin dondurucu oda": "E",
  "hazırlık & kuru depo": "F",
};

const TARGETS = [
  {
    kategoriId: "dunya-mutfagi",
    label: "Dünya Mutfağı 150–300 m² (2018-199-3)",
    ustKategori: "Restoran",
    kategoriLabel: "Dünya Mutfağı",
    bantLabel: "2018-199 · 150–300 m²",
    geoFile: "dunya-mutfak-2018-199-3-table.json",
    geoLabel: "Dünya mutfağı referans proforma (2018-199-3)",
  },
  {
    kategoriId: "italyan",
    label: "İtalyan Restoran 150–300 m² (2018-199-3)",
    ustKategori: "Restaurant",
    kategoriLabel: "İtalyan Restoran",
    bantLabel: "2018-199 · 150–300 m²",
    geoFile: "italyan-2018-199-3-table.json",
    geoLabel: "İtalyan restoran referans proforma (2018-199-3)",
  },
  {
    kategoriId: "all-day-dining-cafe",
    label: "All Day Dining Cafe 150–300 m² (2018-199-3)",
    ustKategori: "Restoran",
    kategoriLabel: "All Day Dining Cafe",
    bantLabel: "2018-199 · 150–300 m²",
    geoFile: "allday-cafe-2018-199-3-table.json",
    geoLabel: "All day dining cafe referans proforma (2018-199-3)",
  },
];

function norm(s) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function titleZone(z) {
  const t = String(z || "").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseSayfa1(ws) {
  const queues = new Map();
  const allRows = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 2) return;
    const ad = String(row.getCell(2).value ?? "").trim();
    const olcuRaw = row.getCell(6).value;
    const adetRaw = row.getCell(7).value;
    if (!ad || typeof olcuRaw !== "number" && typeof adetRaw !== "number" && !olcuRaw && !adetRaw) {
      if (!ad) return;
    }
    if (!ad) return;

    const olcu =
      olcuRaw != null && String(olcuRaw).trim() ? String(olcuRaw).trim() : "—";
    const adet = parseAdet(adetRaw);
    const listeBirimEur = cellNum(row.getCell(8).value);
    const listeTutarEur = cellNum(row.getCell(9).value);
    const satisBirimEur = cellNum(row.getCell(11).value);
    const satisTutarEur = cellNum(row.getCell(12).value);

    const item = {
      ad,
      olcu: olcu === "—" ? null : olcu,
      adet,
      listeBirimEur,
      listeTutarEur,
      satisBirimEur,
      satisTutarEur,
      n: norm(ad),
    };
    allRows.push(item);
    if (!queues.has(item.n)) queues.set(item.n, []);
    queues.get(item.n).push(item);
  });

  return { queues, allRows };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function cellNum(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return round2(value);
  if (typeof value === "object" && value && "result" in value && typeof value.result === "number") {
    return round2(value.result);
  }
  return null;
}

function pickItem(queues, name) {
  const key = norm(name);
  const list = queues.get(key);
  if (!list?.length) return null;
  return list.shift();
}

function toGeoItem(row) {
  const out = { ad: row.ad, adet: row.adet };
  if (row.olcu) out.olcu = row.olcu;
  if (row.listeBirimEur != null) out.listeBirimEur = row.listeBirimEur;
  if (row.listeTutarEur != null) out.listeTutarEur = row.listeTutarEur;
  if (row.satisBirimEur != null) out.satisBirimEur = row.satisBirimEur;
  if (row.satisTutarEur != null) out.satisTutarEur = row.satisTutarEur;
  return out;
}

function parseProforma(ws, queues, allRows) {
  const zonesOut = [];
  const matched = new Set();
  const pozCounter = {};
  const kalemler = [];

  let currentZone = "";
  let currentZoneKey = "";

  ws.eachRow({ includeEmpty: false }, (row) => {
    const zoneCell = row.getCell(3).value;
    const marker = String(row.getCell(5).value ?? "").trim();
    const nameCell = row.getCell(7).value;

    if (zoneCell && typeof zoneCell === "string" && zoneCell.trim() && !nameCell) {
      const zt = zoneCell.trim().toLowerCase();
      if (zt !== "p.no") {
        currentZone = titleZone(zoneCell.trim());
        currentZoneKey = zt;
        zonesOut.push({ zone: currentZone, items: [] });
      }
      return;
    }

    const name = nameCell ? String(nameCell).trim() : "";
    if (!name || name === "-" || name === "URUN ADI" || name === "ÜRÜN ADI") return;
    if (marker !== "-") return;

    const rowData = pickItem(queues, name);
    if (!rowData) return;
    matched.add(rowData);

    zonesOut.at(-1)?.items.push(toGeoItem(rowData));

    const prefix = ZONE_PREFIX[currentZoneKey] || currentZoneKey.charAt(0).toUpperCase() || "G";
    pozCounter[prefix] = (pozCounter[prefix] || 0) + 1;
    const poz = `${prefix}${pozCounter[prefix]}`;

    kalemler.push({
      bolum: prefix,
      bolumAd: currentZone.toUpperCase(),
      poz,
      ad: rowData.ad,
      olcu: rowData.olcu || "—",
      adet: rowData.adet,
    });
  });

  const extras = allRows.filter((r) => !matched.has(r));
  if (extras.length) {
    zonesOut.push({
      zone: "Ek kalemler",
      items: extras.map(toGeoItem),
    });
    for (const rowData of extras) {
      pozCounter.X = (pozCounter.X || 0) + 1;
      kalemler.push({
        bolum: "X",
        bolumAd: "EK KALEMLER",
        poz: `X${pozCounter.X}`,
        ad: rowData.ad,
        olcu: rowData.olcu || "—",
        adet: rowData.adet,
      });
    }
  }

  const ozet = {
    kalemSayisi: zonesOut.reduce((t, z) => t + z.items.length, 0),
    listeToplamEur: round2(
      zonesOut.flatMap((z) => z.items).reduce((s, x) => s + (x.listeTutarEur || 0), 0),
    ),
    satisToplamEur: round2(
      zonesOut.flatMap((z) => z.items).reduce((s, x) => s + (x.satisTutarEur || 0), 0),
    ),
  };

  return { zonesOut, kalemler, ozet };
}

function buildGeoTable(target, zones, ozet) {
  return {
    proformaNo: "2018-199-3",
    label: target.geoLabel,
    kaynakDosya: KAYNAK,
    yukleme: new Date().toISOString(),
    zones,
    ozet,
  };
}

async function writePfosListe(target, kalemler) {
  const toplamAdet = kalemler.reduce((t, r) => t + (typeof r.adet === "number" ? r.adet : 0), 0);
  const yukleme = new Date().toISOString();
  const liste = {
    kategoriId: target.kategoriId,
    bantId: BAND_ID,
    label: target.label,
    referansM2: REFERANS_M2,
    kaynakDosya: KAYNAK,
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };
  const dest = path.join(OUT_REF, `${target.kategoriId}-${BAND_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("PFOS", dest, liste.kalemSayisi, "kalem");

  return {
    id: BAND_ID,
    label: target.bantLabel,
    referansM2: REFERANS_M2,
    meta: {
      listeDosya: `${target.kategoriId}-${BAND_ID}.json`,
      kalemSayisi: liste.kalemSayisi,
      toplamAdet: liste.toplamAdet,
      kaynakDosya: KAYNAK,
      yukleme,
    },
  };
}

async function updateManifest(bandsByKategori) {
  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }

  const kategoriler = Array.isArray(manifest.kategoriler) ? [...manifest.kategoriler] : [];

  for (const [kategoriId, { target, bant }] of bandsByKategori) {
    const idx = kategoriler.findIndex((k) => k.id === kategoriId);
    const existing = idx >= 0 ? kategoriler[idx] : null;
    const otherBantlar = (existing?.bantlar ?? []).filter((b) => b.id !== BAND_ID);
    const kayit = {
      id: kategoriId,
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
  console.log("Manifest güncellendi:", MANIFEST);
}

async function main() {
  const src = process.argv[2] || DEFAULT_XLSX;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);

  const ws1 = wb.getWorksheet("Sayfa1") ?? wb.worksheets[1];
  const wsProforma = wb.getWorksheet("PROFORMA") ?? wb.worksheets[0];
  if (!ws1 || !wsProforma) throw new Error("Sayfa1 veya PROFORMA bulunamadı");

  const { queues, allRows } = parseSayfa1(ws1);
  const { zonesOut, kalemler, ozet } = parseProforma(wsProforma, queues, allRows);
  if (!kalemler.length) throw new Error("Kalem bulunamadı");

  await fs.mkdir(OUT_REF, { recursive: true });
  await fs.mkdir(OUT_GEO, { recursive: true });
  await fs.copyFile(src, path.join(OUT_GEO, KAYNAK));

  const bandsByKategori = new Map();

  for (const target of TARGETS) {
    const bant = await writePfosListe(target, kalemler);
    bandsByKategori.set(target.kategoriId, { target, bant });

    const geo = buildGeoTable(target, zonesOut, ozet);
    const geoPath = path.join(OUT_GEO, target.geoFile);
    await fs.writeFile(geoPath, JSON.stringify(geo, null, 2), "utf8");
    console.log(
      "GEO",
      target.geoFile,
      geo.ozet.kalemSayisi,
      "kalem,",
      geo.ozet.satisToplamEur,
      "€",
    );
  }

  await updateManifest(bandsByKategori);

  try {
    execFileSync("node", [KORPUS_SCRIPT], { stdio: "inherit", cwd: SITE });
  } catch (e) {
    console.warn("Korpus güncellenemedi:", e.message);
  }

  console.log("done — import-2018-199-3");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
