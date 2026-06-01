/** Beykent Şifa Cafe 2017-026.xlsx → kalemler (col2=poz, col4=ürün, col5=ölçü, col6=adet) */
import ExcelJS from "exceljs";

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;

export function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}

export function parseAdet(raw, row) {
  const temini = cellStr(row.getCell(8).value);
  if (/m\.?\s*temini/i.test(temini)) return "—";
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : "—";
}

function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}

export function parseBeykentSifaCafeWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 16) return;
    const poz = cellStr(row.getCell(2).value);
    const ad = cellStr(row.getCell(4).value);
    const olcuRaw = row.getCell(5).value;
    const adetRaw = row.getCell(6).value;
    if (!poz && !ad) return;
    if (/^poz\.?$/i.test(poz) || /^ürün/i.test(ad)) return;
    if (!poz && ad && /^[A-Z]\s*-/.test(ad)) {
      bolumAd = ad;
      bolum = ad.split("-")[0]?.trim() || ad.charAt(0);
      return;
    }
    if (poz && isPoz(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu:
          olcuRaw != null && String(olcuRaw).trim() && String(olcuRaw).trim() !== "-"
            ? String(olcuRaw).trim()
            : "—",
        adet: parseAdet(adetRaw, row),
      });
    }
  });
  return rows;
}

export async function loadBeykentSifaCafeKalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  return parseBeykentSifaCafeWs(wb.worksheets[0]);
}
