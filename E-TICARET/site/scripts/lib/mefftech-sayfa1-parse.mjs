/**
 * Mefftech xlsx (2017 legacy) — Tek sheet: "Sayfa1"
 * Gözlenen kolonlar:
 *  - col2: poz (A4, A8.1, C2...)
 *  - col3: marka
 *  - col4: ürün adı / bölüm başlığı
 *  - col5: ölçü
 *  - col6: adet
 *
 * Bölüm başlıkları çoğunlukla "F- DERİN DONDURUCU ODA" gibi görünüyor.
 */
import ExcelJS from "exceljs";

const POZ_RE = /^[A-Z]\d+(?:\.\d+)?$/i;

function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}

function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function normalizeOlcu(raw) {
  const s = cellStr(raw);
  if (!s || /^-+$/.test(s)) return "—";
  return s.replace(/\*/g, "×");
}

function bolumFromSection(ad) {
  const s = cellStr(ad);
  const m = s.match(/^([A-ZÇĞİÖŞÜ])\s*[-–]/i);
  if (m) return { bolum: m[1].toUpperCase(), bolumAd: s };
  const m2 = s.match(/^([A-ZÇĞİÖŞÜ])/i);
  return { bolum: m2 ? m2[1].toUpperCase() : "?", bolumAd: s };
}

export function parseMefftechSayfa1Ws(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 15) return;
    const poz = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcuRaw = row.getCell(5).value;
    const adetRaw = row.getCell(6).value;

    if (!poz && !ad && !marka) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;
    if (/^toplam$/i.test(poz) || /^toplam$/i.test(ad)) return;

    const hasAdet = adetRaw != null && adetRaw !== "";

    // Bölüm başlığı: poz yok, marka yok, adet yok; ad dolu
    if (!poz && ad && !marka && !hasAdet && !POZ_RE.test(ad)) {
      const sec = bolumFromSection(ad);
      bolum = sec.bolum;
      bolumAd = sec.bolumAd;
      return;
    }

    if (POZ_RE.test(poz) && ad) {
      const fromPoz = poz.charAt(0).toUpperCase();
      rows.push({
        bolum: bolum || fromPoz,
        bolumAd: bolumAd || ad,
        poz: poz.toUpperCase(),
        marka: marka || "—",
        ad,
        olcu: normalizeOlcu(olcuRaw),
        adet: parseAdet(adetRaw),
      });
    }
  });

  return rows;
}

export async function loadMefftechSayfa1Kalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.getWorksheet("Sayfa1") ?? wb.worksheets[0];
  return parseMefftechSayfa1Ws(ws);
}

