/** DoubleTree Hilton Topkapı 2017-050.xlsx → kalemler (col2=poz, col4=ürün, col5=ölçü, col6=adet) */
import ExcelJS from "exceljs";

const POZ_RE = /^[A-Z]\d{1,3}$/i;

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

function zoneKey(ad) {
  const letters = ad.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "");
  return letters.charAt(0).toUpperCase() || "?";
}

export function parseDoubletreeTopkapiWs(ws) {
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

    const hasAdet = adetRaw != null && adetRaw !== "";
    if (!poz && ad.length > 2 && !hasAdet) {
      bolumAd = ad;
      bolum = zoneKey(ad);
      return;
    }
    if (poz && POZ_RE.test(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu:
          olcuRaw != null && String(olcuRaw).trim() && String(olcuRaw).trim() !== "-"
            ? String(olcuRaw).trim()
            : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

export async function loadDoubletreeTopkapiKalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  return parseDoubletreeTopkapiWs(wb.worksheets[0]);
}
