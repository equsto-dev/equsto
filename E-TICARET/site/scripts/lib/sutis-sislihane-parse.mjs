/** Sütiş Şişhane 2017-006-2.xlsx → kalemler */
import ExcelJS from "exceljs";

const POZ_RE = /^[\d]+(?:\.[\d]+)?$/;

export function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}

export function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function olcuFromRow(row) {
  const w = cellStr(row.getCell(6).value);
  const d = cellStr(row.getCell(7).value);
  const h = cellStr(row.getCell(8).value);
  const parts = [w, d, h].filter((x) => x && x !== "0");
  return parts.length ? `${parts.join(" × ")} mm` : "—";
}

/** col1=poz, col2=adet, col3=marka, col4=kod, col9=tanım, col6-8=mm */
export function parseSutisSislihaneWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 10) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(9).value);
    if (!poz && !ad) return;
    if (/^poz|adet|marka|no$/i.test(poz)) return;

    const isSection =
      !POZ_RE.test(poz) &&
      ad.length > 3 &&
      (/^\d{2}-/i.test(ad) || !poz);
    if (isSection) {
      bolumAd = ad;
      bolum = ad.replace(/\s+/g, "-").slice(0, 28).toLowerCase() || "bolum";
      return;
    }
    if (POZ_RE.test(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz,
        ad,
        marka: cellStr(row.getCell(3).value) || undefined,
        kod: cellStr(row.getCell(4).value) || undefined,
        olcu: olcuFromRow(row),
        adet: parseAdet(row.getCell(2).value),
      });
    }
  });
  return rows;
}

export async function parseSutisSislihaneXlsx(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  return parseSutisSislihaneWs(wb.worksheets[0]);
}
