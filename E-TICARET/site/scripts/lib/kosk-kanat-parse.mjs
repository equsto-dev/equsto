/** Mefftech teklif formatı — 2024-107 KÖŞK KANAT (col1=poz, col2=ürün, col5=ölçü, col9=adet) */
import ExcelJS from "exceljs";

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;

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

function normalizeOlcu(raw) {
  const s = cellStr(raw);
  if (!s || /^-+$/.test(s)) return "—";
  return s.replace(/\*/g, "×");
}

function bolumFromSection(name) {
  const u = String(name || "").toUpperCase();
  if (u.includes("HAZIRLIK")) return { bolum: "M", bolumAd: name };
  if (u.includes("IZGARA") && u.includes("YER")) return { bolum: "Y", bolumAd: name };
  if (u.includes("IZGARA")) return { bolum: "P", bolumAd: name };
  if (u.includes("BULAŞIK") || u.includes("BULASIK")) return { bolum: "H", bolumAd: name };
  if (u.includes("BAR")) return { bolum: "B", bolumAd: name };
  const m = u.match(/^([A-Z])/);
  return { bolum: m ? m[1] : "?", bolumAd: name };
}

export function parseKoskKanatWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 23) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcuRaw = row.getCell(5).value ?? row.getCell(3).value;
    const adetRaw = row.getCell(9).value ?? row.getCell(4).value;
    if (!poz && !ad) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;
    if (/^toplam$/i.test(poz) || /^toplam$/i.test(ad)) return;

    const hasAdet = adetRaw != null && adetRaw !== "";
    if (!poz && ad && !POZ_RE.test(ad) && !hasAdet) {
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
        ad,
        olcu: normalizeOlcu(olcuRaw),
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

export async function loadKoskKanatKalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws =
    wb.getWorksheet("TEKLİF FORMATI") ??
    wb.getWorksheet("TEKLIF FORMATI") ??
    wb.worksheets[0];
  return parseKoskKanatWs(ws);
}
