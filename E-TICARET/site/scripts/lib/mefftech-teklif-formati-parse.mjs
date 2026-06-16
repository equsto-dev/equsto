/**
 * Mefftech TEKLİF FORMATI — sayısal poz (1, 2, 3…)
 * Kolonlar: col1=poz, col2=ürün, col5=ölçü, col9=adet
 * Bölüm başlığı: poz boş, col2 dolu, adet yok
 */
import ExcelJS from "exceljs";

const POZ_RE = /^\d+(?:\.\d+)?[A-Z]?$/i;
const FOOTER_RE =
  /^(FİYAT|FIYAT|FATURA|TEKLİF|TEKLIF|TEKLİFİMİZ|TEKLIFIMIZ|ÖDEME|ODEME|GARANTİ|GARANTI|YAPI KREDİ|IBAN|OPSİYON)/i;

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

function bolumFromSection(name) {
  const s = cellStr(name);
  const words = s.split(/\s+/);
  const bolum = words[0]?.charAt(0)?.toUpperCase() || "?";
  return { bolum, bolumAd: s };
}

export function parseMefftechTeklifFormatiWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 24) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcuRaw = row.getCell(5).value;
    const adetRaw = row.getCell(9).value;

    if (!poz && !ad) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;
    if (/^toplam$/i.test(poz) || /^toplam$/i.test(ad)) return;

    const hasAdet = adetRaw != null && adetRaw !== "";

    if (!poz && ad && !hasAdet && !POZ_RE.test(ad)) {
      if (FOOTER_RE.test(ad)) return;
      const sec = bolumFromSection(ad);
      bolum = sec.bolum;
      bolumAd = sec.bolumAd;
      return;
    }

    if (POZ_RE.test(poz) && ad) {
      rows.push({
        bolum: bolum || "?",
        bolumAd: bolumAd || ad,
        poz,
        ad,
        olcu: normalizeOlcu(olcuRaw),
        adet: parseAdet(adetRaw),
      });
    }
  });

  return rows;
}

export async function loadMefftechTeklifFormatiKalemler(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws =
    wb.getWorksheet("TEKLİF FORMATI") ??
    wb.getWorksheet("TEKLIF FORMATI") ??
    wb.worksheets[0];
  return parseMefftechTeklifFormatiWs(ws);
}
