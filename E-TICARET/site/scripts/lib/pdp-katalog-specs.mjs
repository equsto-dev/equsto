/**
 * Ürün sayfası: katalog metninden açıklama, ölçü (mm) ve elektrik/gaz satırları.
 * Değer uydurulmaz; yalnızca katalog metninde veya yapılandırılmış alanda olanlar yazılır.
 */

const PRICE_LINE =
  /^(liste fiyat|bayi |equsto |kur\b|kdv\b|iskonto|havale|kaynak fiyat|kaynak:|cafemarkt|hesap:|stok:|pdf eşleşme|pdf eslesme|mutbex stok|ürün kodu:|urun kodu:|model\s*:|model\s*\/|kategori|marka:|eşleşme:|eslesme:|sayfa:|katalog sayfa)|liste fiyatı|equsto satış|bayi net|₺\s?\d|\bEUR\b|\bUSD\b/i;

const PACK_LINE =
  /ambalaj|paket ölçü|paket olcu|koli ölçü|koli olcu|brüt ölçü|brut olcu|shipping|packed/i;

const IC_LINE = /\biç ölçü|\bic olcu|iç boyut|ic boyut|internal dim/i;

export function decodeCatalogText(s) {
  return String(s || "")
    .replace(/&deg;/gi, "°")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&ouml;/gi, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&uuml;/gi, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => {
      const c = Number(n);
      return c > 0 && c < 65536 ? String.fromCharCode(c) : "";
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function normSku(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function productSkuKeys(row) {
  const keys = [];
  for (const v of [row.sku, row.model, row.urun_kodu, row.marka_urun_kodu, row.stok_no]) {
    const k = normSku(v);
    if (k.length >= 3) keys.push(k);
  }
  return keys;
}

function axisOk(n) {
  return Number.isFinite(n) && n >= 40 && n <= 8000;
}

function toMm(n, unit) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  const u = String(unit || "").toLowerCase();
  if (u === "cm") return Math.round(v * 10);
  if (u === "m") return Math.round(v * 1000);
  if (u === "mm") return Math.round(v);
  return null;
}

/** Birimi yazılmamış üçlü. 30x60x30 → cm, 400x630x280 → mm. Aradaki belirsizler elenir. */
function inferUnitlessMm(a, b, c) {
  const nums = [a, b, c];
  if (nums.some((n) => !Number.isFinite(n) || n < 8)) return null;
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  if (max <= 160 && min >= 8) {
    return nums.map((n) => Math.round(n * 10));
  }
  if (min >= 180 && max <= 8000) {
    return nums.map((n) => Math.round(n));
  }
  return null;
}

function prepLine(line) {
  return String(line || "")
    .replace(/(\d)\s*m\s+m\b/gi, "$1 mm")
    .replace(/(\d)mm\b/gi, "$1 mm");
}

function tripleFromMatch(m, unitHint) {
  const a = Number(String(m[1]).replace(",", "."));
  const b = Number(String(m[2]).replace(",", "."));
  const c = Number(String(m[3]).replace(",", "."));
  let unit = (m[4] || unitHint || "").toLowerCase();
  if (unit === "m" && Math.max(a, b, c) >= 20) unit = "mm";
  if (unit === "cm" && Math.min(a, b, c) >= 200) unit = "mm";
  if (unit === "cm" && Math.max(a, b, c) >= 300 && Math.min(a, b, c) < 100) {
    const mixed = [a, b, c].map((n) => (n >= 300 ? Math.round(n) : Math.round(n * 10)));
    if (mixed.every(axisOk)) return { g: mixed[0], d: mixed[1], y: mixed[2] };
  }
  let dims = null;
  if (unit === "mm" || unit === "cm" || unit === "m") dims = [a, b, c].map((n) => toMm(n, unit));
  else dims = inferUnitlessMm(a, b, c);
  if (!dims || dims.some((n) => !axisOk(n))) return null;
  return { g: dims[0], d: dims[1], y: dims[2] };
}

const TRIPLE_RE =
  /(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)(?:\s*(mm|cm|m)\b)?/gi;

function lineUnitHint(line) {
  if (/\(mm\)|\bmm\b/i.test(line)) return "mm";
  if (/\(cm\)|\bcm\b/i.test(line)) return "cm";
  return "";
}

function collectTriples(line) {
  const src = prepLine(line);
  const out = [];
  const re = new RegExp(TRIPLE_RE.source, "gi");
  let m;
  while ((m = re.exec(src))) {
    const hit = tripleFromMatch(m, "");
    if (hit) out.push(hit);
  }
  return out;
}

function labeledAxis(line) {
  const m = line.match(
    /^(?:dış boyutlar,\s*|dis boyutlar,\s*|iç boyutlar,\s*)?(genişlik|genislik|derinlik|yükseklik|yukseklik|uzunluk|en|boy)\s*(?:\(mm\)|\(cm\))?\s*:\s*(.+)$/i,
  );
  if (!m) return null;
  const keyRaw = m[1].toLocaleLowerCase("tr-TR");
  const rest = m[2].trim();
  const num = rest.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
  if (!num) return null;
  let unit = (num[2] || "").toLowerCase();
  if (!unit && /\(mm\)/i.test(m[0])) unit = "mm";
  else if (!unit && /\(cm\)/i.test(m[0])) unit = "cm";
  else if (!unit && Number(String(num[1]).replace(",", ".")) >= 180) unit = "mm";
  const rawN = Number(String(num[1]).replace(",", "."));
  if (unit === "cm" && rawN >= 300) unit = "mm";
  if (!unit) return null;
  const mm = toMm(Number(num[1].replace(",", ".")), unit === "m" ? "m" : unit);
  if (!axisOk(mm)) return null;
  let key = keyRaw;
  if (key === "genişlik" || key === "genislik" || key === "en") key = "g";
  else if (key === "derinlik" || key === "boy") key = "d";
  else if (key === "yükseklik" || key === "yukseklik") key = "y";
  else if (key === "uzunluk") key = "u";
  else return null;
  return { key, mm };
}

function existingDims(row) {
  let o = row.olculer;
  if (typeof o === "string") {
    const triples = collectTriples(o.includes("x") || o.includes("*") || o.includes("×") ? o : `${o} mm`);
    if (triples[0]) return { ...triples[0], guc_kw: null, from: "olculer-str" };
    return null;
  }
  if (!o || typeof o !== "object") return null;
  if (o.olculer && typeof o.olculer === "object") {
    o = { ...o.olculer, guc_kw: o.guc_kw };
  }
  const g = Number(o.genislik_mm) || 0;
  const d = Number(o.derinlik_mm) || 0;
  const y = Number(o.yukseklik_mm) || 0;
  const u = Number(o.uzunluk_mm) || 0;
  const axes = [g, d, y, u].filter((n) => n > 0);
  if (axes.length >= 2 && axes.every(axisOk)) {
    return {
      g: g || u || null,
      d: d || null,
      y: y || null,
      u: u && g ? u : null,
      guc_kw: Number(o.guc_kw) || null,
      from: "olculer",
    };
  }
  return null;
}

function dimLines(row) {
  const chunks = [];
  const push = (text, weight) => {
    const raw = decodeCatalogText(text);
    if (!raw) return;
    for (const line of raw.split(/\r?\n/)) {
      const ln = line.trim();
      if (!ln) continue;
      chunks.push({ ln, weight });
    }
  };
  push(row.olcu_etiket, 5);
  for (const ln of row.teknik_ozellikler || []) push(ln, 4);
  push(row.specs, 3);
  push(row.aciklama, 2);
  push(row.description, 2);
  push(row.inoksan_shop_description, 2);
  push(row.ozti_web_description, 2);
  push(row.atalay_web_description, 2);
  push(row.pimak_web_description, 2);
  push(row.name, 1);
  return chunks;
}

function nameHasDims(name, dims) {
  if (!dims || !dims.g || !dims.d || !dims.y) return false;
  return collectTriples(name).some((t) => t.g === dims.g && t.d === dims.d && t.y === dims.y);
}

/**
 * @returns {{g:number|null,d:number|null,y:number|null,u:number|null,guc_kw:number|null,from:string}|null}
 */
export function parseProductDims(row, extraText) {
  const have = existingDims(row);
  if (have && have.from === "olculer") return have;

  const labeled = { g: null, d: null, y: null, u: null };
  let labeledScore = 0;
  const triples = [];

  const lines = dimLines(row);
  if (extraText) {
    for (const line of String(extraText).split(/\r?\n/)) {
      lines.push({ ln: line.trim(), weight: 6 });
    }
  }

  for (const { ln, weight } of lines) {
    if (!ln || PACK_LINE.test(ln)) continue;
    const axis = labeledAxis(ln);
    if (axis && !IC_LINE.test(ln)) {
      if (!labeled[axis.key]) {
        labeled[axis.key] = axis.mm;
        labeledScore += weight;
      }
      continue;
    }
    if (!/ölçü|olcu|ebat|boyut|\d\s*[x×*]\s*\d/i.test(ln) && weight < 5) continue;
    const found = collectTriples(ln);
    if (!found.length) continue;
    const dis = /dış boyut|dis boyut|net ölçü|net olcu|ürün ölçü|urun olcu|^ölçü|^olcu|^ebat/i.test(ln);
    const nameHit = found.filter((dims) => nameHasDims(row.name, dims));
    const use = nameHit[0] || found[0];
    triples.push({ dims: use, weight: weight + (dis ? 2 : 0) + (IC_LINE.test(ln) ? -3 : 0) + (nameHit.length ? 8 : 0) });
  }

  for (const k of ["g", "d", "y", "u"]) {
    const v = labeled[k];
    if (v > 4000 && v % 10 === 0 && new RegExp("(?:^|\\D)" + v / 10 + "(?:\\D|$)").test(String(row.name || ""))) {
      labeled[k] = null;
    }
  }

  const labeledCount = ["g", "d", "y", "u"].filter((k) => labeled[k]).length;
  if (labeledCount >= 2) {
    return {
      g: labeled.g,
      d: labeled.d,
      y: labeled.y,
      u: labeled.u && labeled.g ? labeled.u : labeled.u && !labeled.g ? labeled.u : null,
      guc_kw: Number(row.olculer && row.olculer.guc_kw) || null,
      from: "etiket",
    };
  }

  triples.sort((a, b) => b.weight - a.weight);
  const best = triples.find((t) => t.weight > 0);
  if (!best) return have;
  return {
    g: best.dims.g,
    d: best.dims.d,
    y: best.dims.y,
    u: null,
    guc_kw: Number(row.olculer && row.olculer.guc_kw) || Number(row.el_guc) || null,
    from: "metin",
  };
}

export function dimEtiket(dims) {
  if (!dims) return "";
  const parts = [];
  if (dims.u && dims.g) parts.push(dims.u, dims.g);
  else {
    if (dims.g) parts.push(dims.g);
    if (dims.d) parts.push(dims.d);
  }
  if (dims.y) parts.push(dims.y);
  if (parts.length < 2) return "";
  return parts.join("×") + " mm";
}

export function applyDimsToRow(row, dims) {
  if (!dims) return false;
  const prev = row.olculer && typeof row.olculer === "object" && !Array.isArray(row.olculer) ? { ...row.olculer } : {};
  if (prev.olculer && typeof prev.olculer === "object") {
    const nested = prev.olculer;
    delete prev.olculer;
    if (!prev.genislik_mm && nested.genislik_mm) prev.genislik_mm = nested.genislik_mm;
    if (!prev.derinlik_mm && nested.derinlik_mm) prev.derinlik_mm = nested.derinlik_mm;
    if (!prev.yukseklik_mm && nested.yukseklik_mm) prev.yukseklik_mm = nested.yukseklik_mm;
  }
  const next = { ...prev };
  if (dims.g) next.genislik_mm = dims.g;
  if (dims.d) next.derinlik_mm = dims.d;
  if (dims.y) next.yukseklik_mm = dims.y;
  if (dims.u && dims.g) next.uzunluk_mm = dims.u;
  const guc = Number(prev.guc_kw);
  if (guc > 0) next.guc_kw = guc;
  else if (!(Number(next.guc_kw) > 0) && Number(dims.guc_kw) > 0 && Number(dims.guc_kw) < 500) {
    next.guc_kw = Number(dims.guc_kw);
  }

  const n0 = (v) => Number(v || 0);
  const same =
    n0(prev.genislik_mm) === n0(next.genislik_mm) &&
    n0(prev.derinlik_mm) === n0(next.derinlik_mm) &&
    n0(prev.yukseklik_mm) === n0(next.yukseklik_mm) &&
    n0(prev.uzunluk_mm) === n0(next.uzunluk_mm) &&
    n0(prev.guc_kw) === n0(next.guc_kw);
  const etiket = dimEtiket(dims);
  const needEtiket = Boolean(etiket) && !String(row.olcu_etiket || "").trim();
  if (same && !needEtiket && row.olculer && typeof row.olculer === "object" && !Array.isArray(row.olculer)) {
    return false;
  }
  row.olculer = next;
  if (needEtiket) row.olcu_etiket = etiket;
  return true;
}

function weakDescription(row) {
  const name = decodeCatalogText(row.name);
  const desc = decodeCatalogText(row.description);
  if (!desc) return true;
  if (desc === name) return true;
  if (desc.length < name.length + 24 && desc.startsWith(name)) return true;
  return false;
}

function proseFrom(text, name) {
  let raw = decodeCatalogText(text);
  if (!raw) return "";
  raw = raw.split(/\n(?=Liste fiyatı|Ürün kodu:|Bayi |Equsto satış|Kur:|Kaynak:|Kaynak fiyat|Cafemarkt:|Hesap:)/i)[0];
  raw = raw.replace(/^açıklama:\s*/i, "");
  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[•·\-–—*]\s*/, "").trim())
    .filter((l) => l.length > 2 && !PRICE_LINE.test(l));
  const nameNorm = name.toLocaleLowerCase("tr-TR");
  const kept = lines.filter((l) => l.toLocaleLowerCase("tr-TR") !== nameNorm);
  const joined = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (joined.length < 40) return "";
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]{4,}/.test(joined)) return "";
  return joined.slice(0, 1800);
}

export function catalogDescription(row) {
  const name = decodeCatalogText(row.name);
  const rich = [
    row.inoksan_shop_description,
    row.ozti_web_description,
    row.atalay_web_description,
    row.pimak_web_description,
  ]
    .map((t) => proseFrom(t, name))
    .find(Boolean);
  if (rich) return rich;
  if (!weakDescription(row)) return "";
  return proseFrom(row.aciklama, name) || proseFrom(row.specs, name) || proseFrom(row.description, name) || "";
}

export function applyDescription(row) {
  const next = catalogDescription(row);
  if (!next) return false;
  if (decodeCatalogText(row.description) === next) return false;
  if (!weakDescription(row)) return false;
  row.description = next;
  if (!decodeCatalogText(row.aciklama) || weakDescription({ name: row.name, description: row.aciklama })) {
    row.aciklama = next;
  }
  return true;
}

function hasLine(lines, re) {
  return lines.some((l) => re.test(String(l || "")));
}

function fuelOf(row) {
  const blob = decodeCatalogText(
    [row.name, row.model, row.sku, ...(row.teknik_ozellikler || []), row.description, row.aciklama]
      .filter(Boolean)
      .join(" "),
  ).toLocaleLowerCase("tr-TR");
  let gas = /gazl[ıi]|\blpg\b|doğalgaz|dogalgaz|brülör|brulor|kcal\/h/.test(blob);
  let electric = /elektrikli|elektrik\s|voltaj|gerilim|\b220\b|\b230\b|\b380\b|\b50\s*hz/.test(blob);
  if (/gazl[ıi]/.test(blob) && !/elektrikli|voltaj|gerilim|\d+\s*v\b/.test(blob)) electric = false;
  if (/elektrikli/.test(blob) && !/gazl[ıi]|lpg|doğalgaz|dogalgaz|kcal/.test(blob)) gas = false;
  if (/buzdolab|derin dondur|soğutma dolab|sogutma dolab|chiller|freezer/.test(blob)) {
    electric = true;
    gas = false;
  }
  return { gas, electric };
}

function kwText(n) {
  if (!Number.isFinite(n) || n <= 0 || n > 500) return "";
  const s = n >= 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n * 100) / 100);
  return s.replace(".", ",") + " kW";
}

function parseKw(text) {
  const s = decodeCatalogText(text);
  const kw = s.match(/(\d+(?:[.,]\d+)?)\s*k\s*w\b/i);
  if (kw) {
    const n = Number(kw[1].replace(",", "."));
    if (n > 0 && n <= 500) return n;
  }
  const w = s.match(/(?:güç|guc)\s*:\s*(\d+(?:[.,]\d+)?)\s*w\b/i);
  if (w) {
    const n = Number(w[1].replace(",", ".")) / 1000;
    if (n > 0 && n <= 80) return n;
  }
  return null;
}

const VOLT_NUM = "(?:110|115|120|127|208|220|230|240|380|400|415|440|480)";
const VOLT_RE = new RegExp(
  `(?<![\\d.,])(${VOLT_NUM}(?:\\s*[-–/]\\s*${VOLT_NUM})?)\\s*(?:v|volt|vac)(?![a-zçğıöşü])`,
  "i",
);

function parseVolt(text) {
  const m = decodeCatalogText(text).match(VOLT_RE);
  return m ? m[1].replace(/\s+/g, "") + " V" : "";
}

function parseHz(text) {
  const m = decodeCatalogText(text).match(/(?<![\d.,])((?:50|60)(?:\s*[-–/]\s*(?:50|60)|\s+(?:50|60))?)\s*hz\b/i);
  return m ? m[1].trim().replace(/\s*[-–/]\s*|\s+/g, "-") + " Hz" : "";
}

export function isPlausibleVoltLine(line) {
  const m = String(line || "").match(/^elektrik voltaj:\s*(.+)$/i);
  if (!m) return true;
  return VOLT_RE.test(m[1]) || /monofaz|trifaz/i.test(m[1]);
}

function parseMbar(text) {
  const m = decodeCatalogText(text).match(/(\d+(?:[.,]\d+)?)\s*mbar\b/i);
  return m ? m[0].replace(/\s+/g, " ") : "";
}

export function cleanMixedEnergy(row) {
  const lines = Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler.map((l) => String(l)) : [];
  if (lines.length < 2) return false;
  const kw = Number(row.olculer && row.olculer.guc_kw) || Number(row.el_guc) || Number(row.gaz_guc) || 0;
  const drop = new Set();
  if (kw > 0) {
    const guc = [];
    lines.forEach((l, i) => {
      const m = l.match(/^g[uü][çc]\s*(?:ocak)?\s*:\s*(\d+(?:[.,]\d+)?)/i);
      if (!m) return;
      guc.push({ i, n: Number(m[1].replace(",", ".")) });
    });
    if (guc.length >= 2) {
      const keep = guc.find((g) => Math.abs(g.n - kw) < 0.08) || guc[0];
      for (const g of guc) {
        if (g.i === keep.i) continue;
        drop.add(g.i);
        if (g.i > 0 && /gerilim|voltaj|frekans/i.test(lines[g.i - 1])) drop.add(g.i - 1);
        if (g.i + 1 < lines.length && /^ölçü|^olcu/i.test(lines[g.i + 1])) drop.add(g.i + 1);
      }
    }
  }
  lines.forEach((l, i) => {
    if (/^ölçüler?\s*:/i.test(l) && row.olculer && (row.olculer.genislik_mm || row.olculer.uzunluk_mm)) drop.add(i);
  });
  if (!drop.size) return false;
  row.teknik_ozellikler = lines.filter((_, i) => !drop.has(i));
  return true;
}

export function applyEnergyLines(row) {
  const lines = Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler.map((l) => String(l)) : [];
  const blob = [row.specs, row.aciklama, row.description, row.name, lines.join("\n")].filter(Boolean).join("\n");
  const fuel = fuelOf(row);
  const added = [];

  const kw =
    parseKw(blob) ||
    (Number(row.el_guc) > 0 ? Number(row.el_guc) : null) ||
    (Number(row.gaz_guc) > 0 ? Number(row.gaz_guc) : null) ||
    (Number(row.olculer && row.olculer.guc_kw) > 0 ? Number(row.olculer.guc_kw) : null);
  const kwLabel = kwText(kw);
  const hasGuc = lines.some((l) => /g[uü][çc]|\bpower\b|\bkw\b/i.test(String(l).split(":")[0]));
  if (kwLabel && !hasGuc) {
    if (fuel.gas && !fuel.electric) added.push("Gaz gücü: " + kwLabel);
    else if (fuel.electric && !fuel.gas) added.push("Elektrik gücü: " + kwLabel);
    else if (Number(row.gaz_guc) > 0 && !(Number(row.el_guc) > 0)) added.push("Gaz gücü: " + kwLabel);
    else if (Number(row.el_guc) > 0) added.push("Elektrik gücü: " + kwLabel);
  }

  const volt = parseVolt(blob);
  if (volt && !lines.some((l) => VOLT_RE.test(String(l)) || /volt|gerilim/.test(String(l).split(":")[0].toLocaleLowerCase("tr-TR")))) {
    added.push("Elektrik voltaj: " + volt);
  }
  const hz = parseHz(blob);
  if (hz && !lines.some((l) => /frekans|hz\b|elektrik (türü|turu|bağlant|baglant)/i.test(String(l)))) {
    added.push("Elektrik frekans: " + hz);
  }
  const mbar = parseMbar(blob);
  if (mbar && fuel.gas && !hasLine(lines, /mbar|gaz bas/i)) {
    added.push("Gaz basıncı: " + mbar);
  }

  if (!added.length) return false;
  row.teknik_ozellikler = lines.concat(added);
  return added.length;
}

export function isCompetitorSource(row) {
  const k = String(row.kaynak_fiyat_listesi || row.kaynak || "");
  return k === "cafemarkt-plp";
}
