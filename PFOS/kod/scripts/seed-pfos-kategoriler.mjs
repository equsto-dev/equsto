/**
 * PFOS veri/proje-veri → public/data/pfos-referans (ilk kurulum)
 * Kullanım: node scripts/seed-pfos-kategoriler.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_VERI = path.join(SITE, "..", "..", "PFOS", "veri", "proje-veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");

const JOBS = [
  {
    kategoriId: "steakhouse",
    bantId: "80-150",
    label: "Steakhouse 80–150 m²",
    referansM2: 115,
    xlsx: "STEAKHOUSE/80-150 m2-steakhouse-ekipman-listesi.xlsx",
  },
  {
    kategoriId: "steakhouse",
    bantId: "150-250",
    label: "Steakhouse 150–250 m²",
    referansM2: 200,
    xlsx: "STEAKHOUSE/150-250 M2-steakhouse-ekipman-listesi.xlsx",
  },
  {
    kategoriId: "balikci",
    bantId: "80-150",
    label: "Balıkçı 80–150 m²",
    referansM2: 115,
    xlsx: "BALIKCI/80-150 m2 BALIKCI-ekipman-listesi.xlsx",
  },
  {
    kategoriId: "balikci",
    bantId: "150-250",
    label: "Balıkçı 150–250 m²",
    referansM2: 200,
    xlsx: "BALIKCI/150-250 m2 BALIKCI-ekipman-listesi.xlsx",
  },
  {
    kategoriId: "balikci",
    bantId: "mahalle",
    label: "Mahalle balıkçı",
    referansM2: 80,
    xlsx: "BALIKCI/MAHALLE BALIKCI-ekipman-listesi.xlsx",
  },
  {
    kategoriId: "coffee-shop",
    bantId: "referans",
    label: "Coffee Shop referans",
    referansM2: 120,
    xlsx: "coffee-shop-ekipman-listesi.xlsx",
  },
];

const POZ_RE = /^[A-Z]\d{1,2}A?$|^\d{1,3}$/;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v) {
  if (v == null) return "";
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
    if (rowNumber < 4) return;
    const cells = row.values;
    const a = cellStr(cells[1]);
    const b = cellStr(cells[2]);
    const c = cellStr(cells[3]);
    const d = cells[4];
    const e = cells[5];
    if (!a && !b && !c) return;
    const au = a.toUpperCase();
    if (au === "TOPLAM ADET") return;
    if (au === "PNO" || au === "P.NO" || au === "BÖL.") return;
    if (a && !b && a.includes("-") && !isPoz(a)) {
      bolumAd = a;
      bolum = a.split("-")[0]?.trim() || a.charAt(0);
      return;
    }
    let poz = null,
      ad = null,
      olcu = null,
      adetRaw = null;
    if (b && c && isPoz(b)) {
      poz = b;
      ad = c;
      olcu = d;
      adetRaw = e;
    } else if (a && b && isPoz(a)) {
      poz = a;
      ad = b;
      olcu = c;
      adetRaw = d;
    }
    if (!poz || !ad) return;
    rows.push({
      bolum,
      bolumAd,
      poz,
      ad,
      olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  for (const job of JOBS) {
    const src = path.join(PROJE_VERI, job.xlsx);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(src);
    const kalemler = parseWs(wb.worksheets[0]);
    const toplamAdet = kalemler.reduce(
      (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
      0,
    );
    const out = {
      kategoriId: job.kategoriId,
      bantId: job.bantId,
      label: job.label,
      referansM2: job.referansM2,
      kaynakDosya: path.basename(job.xlsx),
      yukleme: new Date().toISOString(),
      kalemSayisi: kalemler.length,
      toplamAdet,
      kalemler,
    };
    const dest = path.join(OUT, `${job.kategoriId}-${job.bantId}.json`);
    await fs.writeFile(dest, JSON.stringify(out, null, 2), "utf8");
    console.log("OK", dest, kalemler.length, "kalem");
  }
  async function metaFor(kid, bid) {
    const raw = JSON.parse(
      await fs.readFile(path.join(OUT, `${kid}-${bid}.json`), "utf8"),
    );
    return {
      listeDosya: `${kid}-${bid}.json`,
      kalemSayisi: raw.kalemSayisi,
      toplamAdet: raw.toplamAdet,
      kaynakDosya: raw.kaynakDosya,
      yukleme: raw.yukleme,
    };
  }
  const kategoriler = [
    { id: "steakhouse", label: "Steakhouse", ustKategori: "Restaurant" },
    { id: "balikci", label: "Balıkçı", ustKategori: "Restaurant" },
    { id: "coffee-shop", label: "Coffee Shop", ustKategori: "Kafe" },
  ];
  const full = {
    version: "1",
    updated_at: new Date().toISOString(),
    kategoriler: [],
  };
  const bandLabel = (b) => {
    if (b === "80-150") return "80–150 m²";
    if (b === "150-250") return "150–250 m²";
    if (b === "mahalle") return "Mahalle balıkçı";
    if (b === "referans") return "Referans liste";
    return b;
  };
  const bandsFor = (kid) => {
    if (kid === "balikci") return ["mahalle", "80-150", "150-250"];
    if (kid === "coffee-shop") return ["referans"];
    return ["80-150", "150-250"];
  };
  for (const k of kategoriler) {
    const bantlar = [];
    for (const b of bandsFor(k.id)) {
      const j = JOBS.find((x) => x.kategoriId === k.id && x.bantId === b);
      if (!j) continue;
      bantlar.push({
        id: b,
        label: bandLabel(b),
        referansM2: j.referansM2,
        meta: await metaFor(k.id, b),
      });
    }
    full.kategoriler.push({ ...k, bantlar });
  }
  const manifestPath = path.join(SITE, "public", "data", "pfos-kategoriler.json");
  await fs.writeFile(manifestPath, JSON.stringify(full, null, 2), "utf8");
  console.log("Manifest:", manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
