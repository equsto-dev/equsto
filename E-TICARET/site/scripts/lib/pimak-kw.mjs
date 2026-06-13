/** Pimak pimak.com — Güç (kW/hp) ve teknik satır normalizasyonu */

export function decodePimakHtml(raw) {
  return String(raw ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&times;/gi, "×")
    .replace(/&Oslash;/gi, "Ø")
    .replace(/&ordm;/gi, "°")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

/** "1,1-1,5-1,95 / 1,3-2-2,4" → 1.95 (kW tarafının en büyük değeri) */
export function parsePimakGucKwValue(raw) {
  const s = decodePimakHtml(raw);
  if (!s || /iletisim|contact/i.test(s)) return null;
  const kwPart = s.split("/")[0].trim();
  const nums = [];
  for (const m of kwPart.matchAll(/(\d+(?:[.,]\d+)?)/g)) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0 && n <= 200) nums.push(n);
  }
  return nums.length ? Math.max(...nums) : null;
}

export function formatPimakKwDisplay(kw) {
  if (kw == null || !Number.isFinite(kw)) return "";
  const s = String(kw);
  return (s.includes(".") ? s.replace(".", ",") : s) + " kW";
}

export function isPimakGasTeknikRow(row) {
  if (!row || typeof row !== "object") return false;
  const enerji = decodePimakHtml(row["Enerji Tipi"]).toLocaleLowerCase("tr-TR");
  if (/gaz|lpg|doğalgaz|dogalgaz|propane|propan/.test(enerji)) return true;
  const gorsel = String(row["Enerji Tipi_gorsel"] || "").toLowerCase();
  if (gorsel.includes("gaz")) return true;
  if (row["Gaz (Mbar,Volt)"] || row["Gaz (mbar,Volt)"] || row["Gaz (Mbar)"]) {
    const g = decodePimakHtml(row["Gaz (Mbar,Volt)"] || row["Gaz (mbar,Volt)"] || row["Gaz (Mbar)"]);
    if (g && !/^[-–—\s]*$/.test(g)) return true;
  }
  return false;
}

export function teknikLinesFromPimakPage(d) {
  const kod = String(d.urunKodu || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
  const rows = d.teknikDetaylar?.satirlar || [];
  let row = rows.find((r) => {
    const rk = String(r["Ürün Kodu"] || "")
      .replace(/\s+/g, "")
      .trim()
      .toUpperCase();
    return rk && kod && rk === kod;
  });
  if (!row && rows.length === 1) row = rows[0];

  const out = [];
  const seen = new Set();
  const push = (line) => {
    const t = String(line || "").trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  for (const t of d.temelOzellikler || []) {
    const s = decodePimakHtml(String(t).replace(/\s+/g, " ").trim());
    if (s && s.length > 2 && !/^tasar[iı]m:?$/i.test(s)) push(s);
  }

  let el_guc = null;
  let gaz_guc = null;
  const isGas = isPimakGasTeknikRow(row);

  if (row) {
    for (const [k, v] of Object.entries(row)) {
      if (k.endsWith("_gorsel") || k === "Fiyat" || k === "Ürün Kodu" || v == null) continue;
      const val = decodePimakHtml(String(v).replace(/\s+/g, " ").trim());
      if (!val || val.length >= 200) continue;
      const keyLow = String(k).toLowerCase();

      if (/g[uü][çc]\s*\(/.test(keyLow)) {
        const kw = parsePimakGucKwValue(val);
        if (kw != null) {
          if (isGas) gaz_guc = kw;
          else el_guc = kw;
          push(`Güç: ${formatPimakKwDisplay(kw)}`);
        }
        continue;
      }
      if (/^voltaj/.test(keyLow)) {
        push(`Voltaj: ${val}`);
        continue;
      }
      if (/^gaz\s*\(/.test(keyLow)) {
        push(`Gaz basıncı: ${val}`);
        continue;
      }
      if (/^motor\s*g[uü][çc]/.test(keyLow)) {
        push(`Motor gücü: ${val}`);
        continue;
      }
      if (/^enerji tipi$/i.test(String(k).trim())) {
        if (val) push(`Enerji tipi: ${val}`);
        continue;
      }
      const label = String(k)
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .trim();
      if (/^kapasite|^ebat|^a[gğ]ırlık|^en \(|^boy \(/i.test(label)) {
        push(`${label}: ${val}`);
      }
    }
  }

  return { lines: out, el_guc, gaz_guc, isGas };
}
