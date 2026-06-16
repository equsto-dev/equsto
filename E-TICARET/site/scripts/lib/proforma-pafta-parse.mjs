/** Mefftech PROFORMA pafta formatı (col3=alan, col5=poz, col7/8=ürün, col11=ölçü, col15=ad) */
import ExcelJS from "exceljs";

const POZ_RE = /^[A-Z]\d{1,2}[A-Z]?$/i;

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

export function bolumFromAlan(alan) {
  const raw = String(alan || "").trim();
  const prefix = raw.match(/^([a-z])\s*-/i);
  if (prefix) {
    return { bolum: prefix[1].toUpperCase(), bolumAd: raw };
  }
  const u = raw.toLowerCase();
  if (u.includes("depo")) return { bolum: "B", bolumAd: raw || "DEPO" };
  if (u.includes("cafe") || u.includes("kafe")) return { bolum: "A", bolumAd: raw || "CAFE" };
  if (u.includes("bulaş") || u.includes("bulas")) return { bolum: "H", bolumAd: raw || "BULAŞIK" };
  if (u.includes("patis") || u.includes("pastane")) return { bolum: "P", bolumAd: raw || "PATİSSERİE" };
  if (u.includes("mutfak")) return { bolum: "M", bolumAd: raw || "MUTFAK" };
  if (u.includes("ızgara") || u.includes("izgara")) return { bolum: "Y", bolumAd: raw || "YER IZGARASI" };
  const m = raw.match(/^([A-Z])/i);
  return { bolum: m ? m[1].toUpperCase() : "?", bolumAd: raw || "GENEL" };
}

export function parseProformaPaftaWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  let currentAlan = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 21) return;
    const alan = cellStr(row.getCell(3).value);
    const poz = cellStr(row.getCell(5).value);
    const ad = cellStr(row.getCell(7).value) || cellStr(row.getCell(8).value);
    const olcuRaw = row.getCell(11).value;
    const adetRaw = row.getCell(15).value;
    if (alan && !POZ_RE.test(poz)) {
      currentAlan = alan;
      const sec = bolumFromAlan(alan);
      bolum = sec.bolum;
      bolumAd = sec.bolumAd;
      return;
    }
    if (!POZ_RE.test(poz) || !ad) return;
    const fromPoz = poz.charAt(0).toUpperCase();
    rows.push({
      bolum: bolum || fromPoz,
      bolumAd: bolumAd || currentAlan || ad,
      poz: poz.toUpperCase(),
      ad,
      olcu: normalizeOlcu(olcuRaw),
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

export async function loadProformaPaftaKalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws =
    wb.getWorksheet("PROFORMA") ??
    wb.getWorksheet("TEKLİF FORMATI") ??
    wb.worksheets[0];
  return parseProformaPaftaWs(ws);
}
