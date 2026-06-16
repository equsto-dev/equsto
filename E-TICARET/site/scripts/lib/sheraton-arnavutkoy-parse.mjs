/** Mefftech teklif formatı — 2024-122 Sheraton Arnavutköy (col1=poz, col2=ürün, col3=ölçü, col4=adet) */
import ExcelJS from "exceljs";

const POZ_RE = /^[A-Z]\d{1,3}$/i;
const BOLUM_RE = /^[A-Z]\s*-\s*.+/i;

export function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}

export function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function zoneKey(text) {
  const m = String(text || "").match(/^([A-Z])/i);
  return m ? m[1].toUpperCase() : "?";
}

function normalizeOlcu(raw) {
  const s = cellStr(raw);
  if (!s || /^-+$/.test(s)) return "—";
  return s.replace(/\*/g, "×");
}

export function parseSheratonArnavutkoyWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 22) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcuRaw = row.getCell(5).value ?? row.getCell(3).value;
    const adetRaw = row.getCell(9).value ?? row.getCell(4).value;
    if (!poz && !ad) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;
    if (/^toplam$/i.test(poz) || /^toplam$/i.test(ad)) return;

    const hasAdet = adetRaw != null && adetRaw !== "";
    if ((BOLUM_RE.test(poz) || (!POZ_RE.test(poz) && ad && BOLUM_RE.test(ad))) && !hasAdet) {
      bolumAd = BOLUM_RE.test(poz) ? poz : ad;
      bolum = zoneKey(bolumAd);
      return;
    }
    if (POZ_RE.test(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu: normalizeOlcu(olcuRaw),
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

export async function loadSheratonArnavutkoyKalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws =
    wb.getWorksheet("TEKLİF FORMATI") ??
    wb.getWorksheet("TEKLIF FORMATI") ??
    wb.worksheets[0];
  return parseSheratonArnavutkoyWs(ws);
}
