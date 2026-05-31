/** Lainox PROFORMA: col1=poz, col2=ürün, col6=ölçü, col8=adet */
const POZ_RE = /^[A-Z]\d{1,2}A?$/i;

export function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}

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

export function parseLainoxProformaWs(ws, minRow = 12) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < minRow) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcu = row.getCell(6).value;
    const adetRaw = row.getCell(8).value;
    if (!poz && !ad) return;
    if (/^ürün adı/i.test(ad) || /banka|iban|lainox/i.test(ad + poz)) return;
    if (!poz && ad && /^[A-Z]\s*-/.test(ad)) {
      bolumAd = ad;
      bolum = ad.split("-")[0]?.trim() || ad.charAt(0);
      return;
    }
    if (poz && isPoz(poz) && ad && !/^malin/i.test(ad)) {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

/** Lainox (marka+fiyat): col1=poz, col2=ürün, col7=ölçü, col9=adet */
export function parseLainoxProformaMarkaWs(ws, minRow = 12) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < minRow) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcu = row.getCell(7).value;
    const adetRaw = row.getCell(9).value;
    if (!poz && !ad) return;
    if (/^ürün adı/i.test(ad) || /banka|iban|lainox/i.test(ad + poz)) return;
    if (!poz && ad) {
      bolumAd = ad;
      bolum = ad.charAt(0) || "";
      return;
    }
    if (poz && isPoz(poz) && ad && !/^malin/i.test(ad)) {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

/** Lainox PROFORMA (fiyatlı): col1=poz, col2=ürün, col6=ölçü, col9=adet */
export function parseLainoxProformaFiyatWs(ws, minRow = 12) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < minRow) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcu = row.getCell(6).value;
    const adetRaw = row.getCell(9).value;
    if (!poz && !ad) return;
    if (/^ürün adı/i.test(ad) || /banka|iban|lainox/i.test(ad + poz)) return;
    if (!poz && ad) {
      bolumAd = ad;
      bolum = ad.charAt(0) || "";
      return;
    }
    if (poz && isPoz(poz) && ad && !/^malin/i.test(ad)) {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}
