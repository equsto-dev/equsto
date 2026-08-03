/**
 * Öztiryakiler — PDF + fiyat listesi → vitrin alanları (specs, keywords, ölçüler).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSetUstuTipContext, mapSetUstuTip } from "./ozti-set-ustu-tip.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const OZTI_BRAND = "Öztiryakiler Endüstriyel Mutfak";
export const OZTI_BRAND_ID = "oztiryakiler-endustriyel-mutfak";

export function foldTr(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

export function slugify(s) {
  return foldTr(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

export function normKod(k) {
  return String(k || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

/** Liste ↔ katalog kod farkları (O/0, baştaki sıfır, tire). */
export function kodSoftKey(k) {
  return normKod(k)
    .split(".")
    .map((seg) => {
      let p = seg.replace(/O/g, "0");
      if (/^\d+$/.test(p)) return String(parseInt(p, 10));
      return p.replace(/^0+([A-Z])/, "$1");
    })
    .join(".");
}

/** TEMİZLİK / 8899 — fiyatsız kimyasallar sitede yok. */
export function isOztiKimyasalExcluded(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  if (/^8899\./i.test(kod)) return true;
  const hay = foldTr(
    [...(row.kategori_yolu || []), row.kategori, row.urun_tanimi, row.name].join(" "),
  );
  if (/temizlik\s*ve\s*hijyen|yardimci\s*yikama\s*kimyasal/i.test(hay)) return true;
  return false;
}

export function loadPdfByKod() {
  const p = path.join(ROOT, "scripts/data/ozti-katalog-pdf-2026.json");
  if (!fs.existsSync(p)) return new Map();
  const list = JSON.parse(fs.readFileSync(p, "utf8"));
  const map = new Map();
  for (const e of list) {
    const k = normKod(e.urun_kodu_norm || e.urun_kodu);
    if (!k) continue;
    map.set(k, e);
    const soft = kodSoftKey(k);
    if (soft && soft !== k && !map.has(soft)) map.set(soft, e);
  }
  return map;
}

/** G/D/Y tablo satırı — Öztiryakiler PDF (KOD altında satır satır mm, lt, W, V, kg). */
export function parseOztiGdyTable(hay, kod) {
  const kodEsc = normKod(kod).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!kodEsc) return null;
  const re = new RegExp(
    kodEsc +
      "[\\s\\S]{0,80}?" +
      "(\\d{2,4})\\s*[\\r\\n]+" +
      "(\\d{2,4})\\s*[\\r\\n]+" +
      "(\\d{2,4})\\s*[\\r\\n]+" +
      "(\\d+(?:[.,]\\d+)?)\\s*lt\\.?\\s*[\\r\\n]+" +
      "(\\d+(?:[.,]\\d+)?)\\s*W\\b\\s*[\\r\\n]+" +
      "([^\\r\\n]+?)\\s*[\\r\\n]+" +
      "(\\d+(?:[.,]\\d+)?)\\s*kg",
    "i",
  );
  const m = String(hay || "").match(re);
  if (!m) return null;
  const gucW = String(m[5]).replace(",", ".");
  return {
    genislik_mm: Number(m[1]),
    derinlik_mm: Number(m[2]),
    yukseklik_mm: Number(m[3]),
    kapasite_lt: String(m[4]).replace(",", "."),
    guc_w: gucW,
    guc_kw: String(Math.round((Number(gucW) / 1000) * 100) / 100),
    gerilim: m[6].trim().replace(/\.$/, ""),
    agirlik_kg: String(m[7]).replace(",", "."),
  };
}

/** Ürün kodundan sonraki PDF tablo bloğundaki toplam güç (kW) — brülör başı değil. */
export function parseOztiToplamGucKw(hay, kod) {
  const kodEsc = normKod(kod).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!kodEsc) return null;
  const parts = String(hay).split(new RegExp(kodEsc, "i"));
  if (parts.length < 2) return null;
  const chunk = parts[1].slice(0, 700);
  const nextKod = chunk.match(/\n\s*78\d{2}\.[A-Z0-9][A-Z0-9.\-]{4,}/i);
  const slice = nextKod?.index ? chunk.slice(0, nextKod.index) : chunk;
  const hits = [];
  for (const m of slice.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:k\s*w|kw)\b/gi)) {
    const n = Number(String(m[1]).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n > 200) continue;
    const lineStart = slice.lastIndexOf("\n", m.index ?? 0) + 1;
    const lineEnd = slice.indexOf("\n", m.index ?? 0);
    const line = slice.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
    if (/pompa|pump|basinc|basınç/i.test(line) && n > 15) continue;
    hits.push(n);
  }
  if (!hits.length) return null;
  return String(Math.max(...hits));
}

/** oztiryakiler.com.tr specs — Elektrik Gücü (kW). */
export function parseWebElektrikGucuKw(specs) {
  if (!Array.isArray(specs)) return null;
  for (const line of specs) {
    const m = String(line).match(/^Elektrik\s*G[uü]c[uü]:\s*(\d+(?:[.,]\d+)?)/i);
    if (m) return String(m[1]).replace(",", ".");
  }
  return null;
}

function syncRowGucKw(row, gucKw) {
  if (!gucKw) return;
  row.olculer = { ...(row.olculer || {}), guc_kw: gucKw };
  const gucLine = `Güç: ${gucKw} kW`;
  const tech = [...(row.teknik_ozellikler || [])];
  const idx = tech.findIndex((t) => /^G[uü]ç:\s*[\d.,]+\s*kW/i.test(String(t)));
  if (idx >= 0) tech[idx] = gucLine;
  else tech.unshift(gucLine);
  row.teknik_ozellikler = tech;
  if (row.specs) {
    row.specs = String(row.specs).replace(/(^|\n)G[uü]ç:\s*[\d.,]+\s*kW/gi, `$1${gucLine}`);
  }
}

function isOztiElectricProduct(row) {
  const hay = foldTr(
    [row.name, row.urun_tanimi, row.kategori, ...(row.kategori_yolu || [])].join(" "),
  );
  if (/elektrik|elektrikli|\belekt\b/i.test(hay)) return true;
  if (/\bgazl[ıi]\b|\bgaz\b/i.test(hay)) return false;
  return /elektrik|elektrikli|\belekt\b/i.test(
    foldTr((row.teknik_ozellikler || []).join(" ")),
  );
}

function isOztiYikamaProduct(row) {
  const hay = foldTr(
    [row.name, row.urun_tanimi, row.kategori, row.dept, ...(row.kategori_yolu || [])].join(" "),
  );
  return /yikama|bula[sş]ik|bardak\s*yikama|obf\b|obs\b/i.test(hay);
}

/** Ürün adındaki 4x6 kW / 2x6kW+2x7,5kW → toplam brülör gücü (katalog Güç satırı brülör başı). */
export function parseBrulorToplamKwFromText(text) {
  let best = null;
  for (const line of String(text ?? "").split("\n")) {
    const terms = [...line.matchAll(/(\d+)\s*[x×]\s*([\d.,]+)\s*k?\s*w/gi)];
    if (!terms.length) continue;
    let sum = 0;
    for (const m of terms) {
      const count = Number(m[1]);
      const kw = Number(String(m[2]).replace(",", "."));
      if (!Number.isFinite(count) || !Number.isFinite(kw)) continue;
      if (count <= 0 || count > 12 || kw <= 0 || kw > 50) continue;
      sum += count * kw;
    }
    if (sum > 0 && sum <= 200 && (best == null || sum > best)) best = sum;
  }
  return best == null ? null : String(Math.round(best * 100) / 100);
}

/** PDF + web kaynaklarından doğru toplam kW. */
export function resolveOztiGucKw(row, pdfEntry, webPayload) {
  const kod = normKod(row.urun_kodu || row.sku);
  const nameHay = [
    row.name,
    row.urun_tanimi,
    ...(row.teknik_ozellikler || []),
  ]
    .filter(Boolean)
    .join("\n");
  const brulorToplam = parseBrulorToplamKwFromText(nameHay);
  if (brulorToplam && !isOztiElectricProduct(row)) return brulorToplam;

  const pdfText = (pdfEntry?.pdf_metin_parcalari || []).join("\n");
  const hay = `${row.urun_tanimi || ""}\n${pdfText}`;
  const pdfToplam = pdfText ? parseOztiToplamGucKw(hay, kod) : null;
  if (pdfToplam) return pdfToplam;

  const webKw =
    webPayload && isOztiElectricProduct(row) && !isOztiYikamaProduct(row)
      ? parseWebElektrikGucuKw(webPayload.specs)
      : null;
  if (webKw) return webKw;

  if (pdfText) return parseOlculer(hay, kod)?.guc_kw || null;
  return null;
}

export function loadWebByKod() {
  const p = path.join(ROOT, "scripts/data/ozti-web-index.json");
  if (!fs.existsSync(p)) return new Map();
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const map = new Map();
  const list = raw.byKod ? Object.values(raw.byKod) : Array.isArray(raw) ? raw : [];
  for (const e of list) {
    const k = normKod(e.kod || e.urun_kodu);
    if (!k) continue;
    map.set(k, e);
    const soft = kodSoftKey(k);
    if (soft && !map.has(soft)) map.set(soft, e);
  }
  if (raw.byKodSoft) {
    for (const [soft, e] of Object.entries(raw.byKodSoft)) {
      if (!map.has(soft)) map.set(soft, e);
    }
  }
  return map;
}

/** Katalog satırında güç alanlarını PDF/web ile senkronize et. */
export function applyOztiGucKwFix(row, pdfByKod, webByKod, opts = {}) {
  if (!isOztiBrand(row)) return false;
  const kod = normKod(row.urun_kodu || row.sku);
  if (!kod) return false;
  const pdfEntry = pdfByKod?.get(kod) || pdfByKod?.get(kodSoftKey(kod));
  const webPayload = webByKod?.get(kod) || webByKod?.get(kodSoftKey(kod));
  const nextKw = resolveOztiGucKw(row, pdfEntry, webPayload);
  if (!nextKw) return false;
  const prev = String(row.olculer?.guc_kw ?? "").replace(",", ".");
  const next = String(nextKw).replace(",", ".");
  if (prev === next) return false;
  if (!opts.fillMissing) {
    // Yalnızca mevcut değeri düzelt veya PDF'de ürün koduna özel toplam güç varsa yaz.
    const pdfText = (pdfEntry?.pdf_metin_parcalari || []).join("\n");
    const pdfToplam = pdfText
      ? parseOztiToplamGucKw(`${row.urun_tanimi || ""}\n${pdfText}`, kod)
      : null;
    if (!prev && !pdfToplam) return false;
  }
  syncRowGucKw(row, nextKw);
  return true;
}

/** Eksik kW — PDF/web/brülör kaynaklarından doldur. */
export function applyOztiGucKwFill(row, pdfByKod, webByKod) {
  return applyOztiGucKwFix(row, pdfByKod, webByKod, { fillMissing: true });
}

/** G×D×Y veya 80*90*85 gibi ölçüleri ürün adı / PDF metninden çıkar. */
export function parseOlculer(text, kod) {
  const hay = String(text || "");
  const out = parseOztiGdyTable(hay, kod) || {};
  const kodEsc = kod ? kod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

  if (kodEsc && !out.genislik_mm) {
    const after = hay.split(new RegExp(kodEsc, "i"))[1] || "";
    const trip = after.match(
      /(\d{2,4})\s*(?:mm)?\s*[x×*]\s*(\d{2,4})\s*(?:mm)?\s*[x×*]\s*(\d{2,4})\s*(?:mm)?/i,
    );
    if (trip) {
      let g = Number(trip[1]);
      let d = Number(trip[2]);
      let y = Number(trip[3]);
      const hasMm = /mm/i.test(trip[0]);
      if (!hasMm && Math.max(g, d, y) <= 500) {
        g *= 10;
        d *= 10;
        y *= 10;
      }
      out.genislik_mm = g;
      out.derinlik_mm = d;
      out.yukseklik_mm = y;
    }
  }

  const dim = hay.match(
    /(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*(mm|cm)?/i,
  );
  if (dim && !out.genislik_mm) {
    let g = Number(dim[1]);
    let d = Number(dim[2]);
    let y = Number(dim[3]);
    const unit = String(dim[4] || "").toLowerCase();
    if (unit === "cm" || (!unit && Math.max(g, d, y) <= 500 && /\*/.test(hay))) {
      g *= 10;
      d *= 10;
      y *= 10;
    }
    out.genislik_mm = g;
    out.derinlik_mm = d;
    out.yukseklik_mm = y;
  }

  const cap = hay.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|l\.?t\.?|litre)/i);
  if (cap) out.kapasite_lt = String(cap[1]).replace(",", ".");

  const toplamKw = parseOztiToplamGucKw(hay, kod);
  if (toplamKw) out.guc_kw = toplamKw;
  else {
    const kw = hay.match(/(\d+(?:[.,]\d+)?)\s*k\s*w\b/i);
    if (kw) out.guc_kw = String(kw[1]).replace(",", ".");
  }

  return Object.keys(out).length ? out : null;
}

/** PDF metnindeki madde işaretli satırlar. */
export function pdfBulletLines(pdfEntry, kod) {
  if (!pdfEntry?.pdf_metin_parcalari?.length) return [];
  const kodU = normKod(kod);
  const lines = [];
  for (const chunk of pdfEntry.pdf_metin_parcalari) {
    for (const ln of String(chunk).split(/\r?\n/)) {
      const t = ln.trim();
      if (!t || t.length < 12) continue;
      if (/^kod$/i.test(t) || /^fiyat$/i.test(t) || /^Ø$/i.test(t)) continue;
      if (normKod(t) === kodU) continue;
      if (/^[0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{4,}$/i.test(t)) continue;
      if (/^[•\-–—*·]\s/.test(t) || t.length > 40) {
        lines.push(t.replace(/^[•\-–—*·]+\s*/, ""));
      }
    }
  }
  return [...new Set(lines)].slice(0, 8);
}

export function buildKeywords(row, olculer, category) {
  const parts = [
    OZTI_BRAND,
    "Öztiryakiler",
    row.urun_kodu,
    row.kategori,
    ...(row.kategori_yolu || []),
    category,
    row.barkod,
    row.urun_tanimi,
  ];
  if (olculer) {
    if (olculer.genislik_mm) parts.push(`${olculer.genislik_mm} mm`);
    if (olculer.derinlik_mm && olculer.yukseklik_mm) {
      parts.push(`${olculer.genislik_mm}×${olculer.derinlik_mm}×${olculer.yukseklik_mm} mm`);
    }
    if (olculer.kapasite_lt) parts.push(`${olculer.kapasite_lt} litre`);
    if (olculer.guc_kw) parts.push(`${olculer.guc_kw} kW`);
    if (olculer.agirlik_kg) parts.push(`${olculer.agirlik_kg} kg`);
  }
  const seen = new Set();
  const kw = [];
  for (const p of parts) {
    const t = String(p || "").trim();
    if (!t || t.length < 2) continue;
    const key = foldTr(t);
    if (seen.has(key)) continue;
    seen.add(key);
    kw.push(t);
  }
  return kw.slice(0, 24);
}

/** PDF tablo bloğundan model satırı (ör. APPIA LIFE … ÜÇ GRUP TAM OTOMATİK). */
export function pdfModelCaption(pdfEntry, kod) {
  if (!pdfEntry?.pdf_metin_parcalari?.length || !kod) return "";
  const hay = pdfEntry.pdf_metin_parcalari.join("\n");
  const kodU = normKod(kod);
  const lines = hay.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const start = lines.findIndex((l) => normKod(l) === kodU);
  if (start < 0) return "";
  for (let i = start + 1; i < lines.length && i < start + 12; i++) {
    const ln = lines[i];
    if (/^kod$|^g$|^d$|^y$|^kapasite$|^güç$|^gerilim$|^ağırlık$|^fiyat$/i.test(ln)) continue;
    if (/^\d{2,4}$/.test(ln)) continue;
    if (/^\d+(?:[.,]\d+)?\s*(?:lt\.?|w|kg\.?)$/i.test(ln)) continue;
    if (/^\d[\d/\-]*v/i.test(ln)) continue;
    if (/^[0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{4,}$/i.test(ln)) break;
    if (ln.length >= 12 && /[A-Za-zÇĞİÖŞÜçğıöşü]{4,}/.test(ln)) {
      let caption = ln;
      if (i + 1 < lines.length && i + 1 < start + 12) {
        const next = lines[i + 1];
        if (
          next.length >= 6 &&
          !/^[0-9]{2,4}\.[A-Z0-9]/i.test(next) &&
          !/^kod$/i.test(next) &&
          caption.length < 48
        ) {
          caption = `${caption} ${next}`;
        }
      }
      return caption.replace(/\s+/g, " ").trim();
    }
  }
  return "";
}

export function buildAciklama(row, pdfEntry, bullets) {
  const parts = [];
  const caption = pdfModelCaption(pdfEntry, row.urun_kodu || row.sku);
  if (caption) parts.push(caption);
  if (bullets.length) parts.push(bullets.join("\n"));
  else if (row.urun_tanimi) parts.push(String(row.urun_tanimi).trim());
  const pathStr = (row.kategori_yolu || []).filter(Boolean).join(" › ");
  if (pathStr) parts.push(`Kategori: ${pathStr}`);
  return parts.join("\n\n").trim();
}

export function buildTeknikOzellikler(row, pdfEntry, olculer, bullets) {
  const lines = [];
  if (olculer?.genislik_mm) {
    lines.push(`Genişlik: ${olculer.genislik_mm} mm`);
    lines.push(`Derinlik: ${olculer.derinlik_mm} mm`);
    lines.push(`Yükseklik: ${olculer.yukseklik_mm} mm`);
  }
  if (olculer?.kapasite_lt) lines.push(`Kapasite (kazan): ${olculer.kapasite_lt} lt`);
  if (olculer?.guc_w) lines.push(`Güç: ${olculer.guc_w} W`);
  else if (olculer?.guc_kw) lines.push(`Güç: ${olculer.guc_kw} kW`);
  if (olculer?.gerilim) lines.push(`Gerilim: ${olculer.gerilim}`);
  if (olculer?.agirlik_kg) lines.push(`Ağırlık: ${olculer.agirlik_kg} kg`);
  if (row.barkod) lines.push(`Barkod: ${row.barkod}`);
  if (pdfEntry?.pdf_sayfalar?.length) {
    lines.push(`Katalog sayfası: ${pdfEntry.pdf_sayfalar.join(", ")}`);
  }
  for (const b of bullets) {
    if (/genişlik|derinlik|yükseklik|güç|voltaj|kapasite|ağırlık|mm|kw|lt/i.test(b)) {
      lines.push(b);
    }
  }
  return [...new Set(lines)];
}

export function buildSpecs(row, pdfEntry, category, pricingLines) {
  const kod = row.urun_kodu;
  const pdfText = (pdfEntry?.pdf_metin_parcalari || []).join("\n");
  const olculer = parseOlculer(`${row.urun_tanimi}\n${pdfText}`, kod);
  const bullets = pdfBulletLines(pdfEntry, kod);
  const teknik = buildTeknikOzellikler(row, pdfEntry, olculer, bullets);
  const aciklama = buildAciklama(row, pdfEntry, bullets);

  const blocks = [String(row.urun_tanimi || kod).trim()];
  if (aciklama && !blocks[0].includes(aciklama.slice(0, 40))) {
    blocks.push("", "Açıklama:", aciklama);
  }
  blocks.push("", ...pricingLines);
  if (teknik.length) {
    blocks.push("", "Teknik Özellikler", ...teknik);
  }
  return {
    specs: blocks.join("\n").trim(),
    aciklama,
    teknik_ozellikler: teknik,
    olculer,
    keywords: buildKeywords(row, olculer, category),
  };
}

/** PDF-only / kod önekli bulaşık makinesi adı */
export function pdfYikamaProductName(kod, pdfEntry) {
  const k = normKod(kod);
  const known = {
    "9710.FX10A.00": "OKY FX10A Setaltı Bulaşık Yıkama Makinesi",
    "9710.UX10N.00": "OKY UX10N Setaltı Bulaşık Yıkama Makinesi",
    "9710.AMX10.00": "AMX-10 Bulaşık Yıkama Makinesi",
    "9710.00CSA.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CSA-D",
    "9710.0CSAE.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CS-E-A-D",
    "9710.CNAE0.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CN-E-A-CDS",
    "9710.0CNAL.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CN-L-A-CDS",
    "9710.0CNAS.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CN-S-A-CDS",
  };
  if (known[k]) return known[k];
  const text = (pdfEntry?.pdf_metin_parcalari || []).join(" ");
  if (/KONVEYÖRLÜ|KONVEYORLU|OTOMATİK\s*YIKAMA/i.test(text))
    return `Konveyörlü Otomatik Bulaşık Yıkama Makinesi ${k}`;
  if (/AMX/i.test(k) || /AMX-?\d+/i.test(text)) return `AMX Bulaşık Yıkama Makinesi ${k}`;
  if (/OKY|UX10|FX10/i.test(k)) return `OKY Bulaşık Yıkama Makinesi ${k.replace(/^9710\./, "")}`;
  return `Bulaşık Yıkama Makinesi ${k}`;
}

/** Yıkama dept vitrin kategorisi (?tip= eşlemesi) */
export function mapOztiYikamaCategory(name, kod, kategori) {
  const hay = foldTr(`${name || ""} ${kod || ""} ${kategori || ""}`);
  if (/bardak\s*yikama|^073m\.|^074m\./i.test(hay)) return "bardak-yikama";
  if (/flight\s*tip|07[aelr][lr]\./i.test(hay)) return "flight-bulasik";
  if (/^9710\./.test(String(kod || ""))) {
    if (/csa|cnal|cnas|cnae|konveyor|otomatik/.test(hay)) return "konveyorlu-bulasik";
    if (/amx[-.\d]|oky|ux10|fx10/.test(hay)) return "setalti-bulasik";
    return "bulasik-makineleri";
  }
  if (/giyotin|hood\s*type/i.test(hay)) return "giyotin-bulasik";
  if (/konveyor|tunel|tunnel/i.test(hay)) return "konveyorlu-bulasik";
  if (/tirnakli|tırnaklı|rack/i.test(hay)) return "tirnakli-bulasik";
  if (/kazan\s*yikama|kettle\s*wash/i.test(hay)) return "kazan-yikama";
  if (/set\s*alti|setalti|tezgah\s*alti|undercounter/i.test(hay)) return "setalti-bulasik";
  if (/^b\.y\.m\b|b\.y\.m\s|giris.*tezgah|cikis.*tezgah/i.test(hay))
    return "bulasik-makinesi-giris-ve-cikis-tezgahlari";
  if (/el\s*yikama|yikama\s*evye/i.test(hay)) return "el-yikama-evyeleri";
  if (/hunili|siyirma|alma\s*tezgah/i.test(hay))
    return "calisma-tezgahlari-siyirma-hunili-bulasik-alma-tezgahi";
  if (/bulasik\s*makinesi\s*ustu|makinesi\s*ustu\s*evyeli|calisma\s*tezgah/i.test(hay))
    return "calisma-tezgahlari-bulasik-makinesi-tezgahlari";
  if (/göz\s*evye|goz\s*evye|küresel\s*evye|yuvarlak\s*evye|vanety\s*evye/i.test(hay))
    return "el-yikama-evyeleri";
  if (/tezgah|evyeli/i.test(hay)) return "calisma-tezgahlari-bulasik-makinesi-tezgahlari";
  if (/sebze\s*yikama|kazan\s*yikama\s*evye|fircali\s*kazan/i.test(hay)) return "kazan-yikama";
  return "bulasik-makineleri";
}

/** Çay makinası (8574.CM*) ve çay kazanı (8573.CDE* vb.) — kahve PLP değil. 8574.FM = filtre kahve. */
export function isOztiCayEquipment(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/^8574\.CM/i.test(kod) || (/^8574\./.test(kod) && /ÇAY\s*MAKİN|ÇAY\s*MAKIN|CAY\s*MAKIN/i.test(name)))
    return true;
  if (/^8573\./.test(kod) && !/^8573\.000/.test(kod)) return true;
  if (/ÇAY\s*MAKİN|ÇAY\s*MAKIN|CAY\s*MAKIN/i.test(name)) return true;
  if (/ÇAY\s*KAZANI|CAY\s*KAZANI/i.test(name)) return true;
  return false;
}

/** Kahveci demlik (8573.000*) — çay/sunum aksesuarı, kahve PLP değil. */
export function isOztiKahveciDemlik(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/^8573\.000/.test(kod)) return true;
  if (/KAHVECI\s*DEML|DEMLİĞİ|DEMLIK\s*NO\b/i.test(name)) return true;
  return false;
}

/** Filtre kahve makinesi, kahve süt potu → kahve PLP (demlik hariç). */
export function isOztiKahveAccessory(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/^8574\.FM/i.test(kod) || /FILTRE\s*KAHVE|FTL\d/i.test(name)) return true;
  if (/^8534\./.test(kod) || /KAHVE\s*SÜT\s*POTU|KAHVE\s*SUT\s*POTU/i.test(name)) return true;
  return false;
}

/**
 * Aynı Excel/PDF satırı «Çay ocakları ve kahve» altında; çay → icecek, kahve aksesuar → kahve.
 */
export function mapOztiDeptAccessory(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");

  if (isOztiKahveAccessory(row)) return "kahve";
  if (isOztiKahveciDemlik(row)) return "icecek";
  if (isOztiCayEquipment(row)) return "icecek";
  if (/^8577\.|^0466\.|^0469\.|^0585\.|^8497\./.test(kod)) return "icecek";
  if (/^8593\./.test(kod)) return "icecek";
  if (/^8317\.ZCP/i.test(kod)) return "icecek";
  if (/KONİK\s*BARDAK|KAPAKSIZ\s*SÜRAHİ|KAPAKLI\s*SÜRAHİ|\bSÜRAHİ\b/i.test(name)) return "icecek";
  if (/ÇAY\s*TOPU|ÇAY\s*TABAĞ|MAKASLI\s*ÇAY/i.test(name)) return "icecek";
  if (/SU\s*OTOMATI/i.test(name)) return "icecek";
  if (/POŞET\s*ÇAY\s*STANDI|ÇAY\s*STANDI/i.test(name)) return "icecek";

  /** Fritöz teli / sepet — aksesuar; «FRITOZ» pişirme kuralına düşmesin */
  if (/^8150\./.test(kod) || /FR[İI]T[OÖ]Z\s*TEL/i.test(name)) return "set-ustu-mutfak";

  return null;
}

/** Döner ocakları / döner makineleri → pişirme (set üstü değil) */
export function isOztiDonerOcak(row) {
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^8859\./i.test(kod)) return true;
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  const path = foldTr((row.kategori_yolu || []).join(" "));
  if (/doner\s*ocag|doner\s*ocagi|doner\s*makin|doner\s*kebap/i.test(name)) return true;
  if (/doner\s*makin|doner\s*ocak/i.test(kat) || /doner\s*makin/i.test(path)) return true;
  return false;
}

/**
 * Meyve suyu / ayran / şerbet soğutucu, slush (8477.*) — içecek PLP.
 * «MEYVE SUYU SOĞUTUCULARI» soğutma kuralındaki SOĞUTUCU ile karışmasın.
 */
/**
 * NTV cihazaltı / havuzlu dolaplar (7919.*NTV.*) — dolap PLP.
 * Öztiryakiler «tezgah altı soğutucu» sınıfında; buz dolabı vitrini değil.
 */
export function isOztiCihazaltiDolap(row) {
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/BUZDOLAB|DERİN\s*DONDURUCU|ŞOK\s*SO[GĞ]UT|SOĞUK\s*ODA/i.test(name)) return false;
  if (/CİHAZALTI\s*DOLAP|CIHAZALTI\s*DOLAP/i.test(name)) return true;
  if (/CİHAZALTI\s*\d+\s*KAPILI\s*DOLAP|CIHAZALTI\s*\d+\s*KAPILI\s*DOLAP/i.test(name)) return true;
  if (/T\s+TİP\s+HAVUZLU\s*DOLAP|T\s+TIP\s+HUVUZLU\s*DOLAP|T\s+TIP\s+HAVUZLU\s*DOLAP/i.test(name)) return true;
  if (/\bNTV\b/.test(name) && /\bDOLAP\b/.test(name) && !/BUZDOLAB/i.test(name)) return true;
  return false;
}

/** Vitrifrigo süt soğutucu / bardak ısıtıcı (9868.FG10*) — bar içecek PLP. */
export function isOztiIcecekMilkBar(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/^9868\.(0?FG10)/i.test(kod)) return true;
  if (/VITRIFRIGO/i.test(name) && /SÜT\s*SOGUTUCU|SUT\s*SOGUTUCU|BARDAK\s*ISIT/i.test(name)) return true;
  return false;
}

export function isOztiIcecekBeverageDispenser(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  const path = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  if (/^8477\./.test(kod)) return true;
  if (/MEYVE\s*SUYU\s*SO[GĞ]UTUCU/i.test(kat) || /MEYVE\s*SUYU\s*SO[GĞ]UTUCU/i.test(path)) return true;
  if (/AYRAN\s*MAK|KÖPÜKLÜ\s*AYRAN|KOPUKLU\s*AYRAN/i.test(name)) return true;
  if (/MEYVE\s*SUYU\s*SO[GĞ]UTMA|MEYVE\s*SUYU\s*SOGUTMA/i.test(name)) return true;
  if (/SLUSH|GRANITA|KARBUZ\s*SO[GĞ]UTUCU/i.test(name)) return true;
  return false;
}

/**
 * Soğuk hazırlık / pizza hazırlık üniteleri (79E3.PZC*, SOĞUK HAZIRLIK ÜNİTELERİ).
 * «PIZZA HAZIRLIK» adı hazirlik dept kuralına düşmesin — soğutma ekipmanı.
 */
export function isOztiSogukHazirlikUnitesi(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  const path = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  if (/^79E3\.PZC/i.test(kod)) return true;
  if (/SOĞUK\s*HAZIRLIK\s*ÜNİTELERİ|SOGUK\s*HAZIRLIK\s*UNITELERI/i.test(`${path} ${kat}`)) {
    return true;
  }
  if (/\bPZC\s*\d{2}\b/.test(name) && /PIZZA\s*HAZIRLIK/i.test(name)) return true;
  return false;
}

/**
 * Sebze doğrama makineleri (Robot Coupe CL/R, SEBZE DOĞRAMA MAKİNELERİ).
 * Set üstü veya soğutma değil — hazırlık PLP.
 */
export function isOztiSebzeDograma(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  const path = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  const hay = `${path} ${kat} ${name}`;
  if (/SEBZE\s*DO[GĞ]RAMA|SEBZE\s*DOĞRAMA\s*VE\s*HUMUS/i.test(hay)) return true;
  if (/^9840\.(CL|R\d)/i.test(kod)) return true;
  if (/^0830\./i.test(kod) && /SEBZE\s*DO[GĞ]RAMA/i.test(name)) return true;
  if (/^5R1X\./i.test(kod) && /ROBOT\s*COUPE/i.test(name)) return true;
  if (/ROBOT\s*COUPE/i.test(name) && /SEBZE\s*DO[GĞ]RAMA|CL\d{2}|R\s*\d{3}/i.test(name)) return true;
  return false;
}

/** Buz konteyneri (BK-125 vb.) — soğutma / buz makineleri; araba veya taşıma değil */
export function isOztiBuzKonteyner(row) {
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^8959\.BK|^7506\.0B390/i.test(kod)) return true;
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  if (/buz\s*konteyner|izolasyonlu\s*125\s*litre/i.test(name)) return true;
  if (/buz\s*makin/i.test(kat) && /konteyner/i.test(name)) return true;
  return false;
}

/** Servis / et askı arabaları — set üstü değil, taşıma PLP */
export function isOztiTasimaAraba(row) {
  if (isOztiBuzKonteyner(row)) return false;
  if (isOztiDonerOcak(row)) return false;
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^7270\./i.test(kod)) return true;
  const kat = foldTr(row.kategori || "");
  const path = foldTr((row.kategori_yolu || []).join(" "));
  if (kat === "arabalar" || /\barabalar\b/.test(path)) return true;
  if (/banket\s*arab/i.test(kat) || /banket\s*arab/i.test(path)) return true;
  const name = foldTr(row.urun_tanimi || row.name || "");
  if (/et\s*aski\s*arab|tabak\s*tasima\s*arab|yuk\s*tasima\s*arab|servis\s*arab/i.test(name)) return true;
  return false;
}

/** Taşıma dept vitrin kategorisi */
export function mapOztiTasimaCategory(row) {
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  if (/et\s*aski\s*arab/i.test(name) || /^7270\./i.test(String(row.urun_kodu || ""))) {
    return "et-aski-arabasi";
  }
  if (/banket\s*arab/i.test(name) || /banket\s*arab/i.test(kat)) return "banket-arabalari";
  if (kat === "arabalar" || /\barabalar\b/.test(kat)) return "servis-arabalar";
  return slugify(row.kategori) || "diger";
}

/** Bain marie çelik kap/küvet (set üstü) — makine değil */
export function isOztiBainMarieKap(row) {
  const name = foldTr(`${row.urun_tanimi || row.name || ""} ${row.kategori || ""}`);
  if (/bain\s*marie\s*(kapak|kuvet|küvet)/i.test(name)) return true;
  if (/celik\s*saklama/i.test(name) && /bain\s*marie/i.test(name)) return true;
  return false;
}

/** Set üstü / hareketli bain marie üniteleri (GN kaplar hariç) → pişirme PLP */
export function isOztiBainMarieMachine(row) {
  if (isOztiBainMarieKap(row)) return false;
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  const path = foldTr((row.kategori_yolu || []).join(" "));
  const hay = `${name} ${kat} ${path}`;
  if (/kaplar\s*haric/i.test(name) && /bain\s*marie/i.test(name)) return true;
  if (/set\s*ustu\s*bain\s*marie/i.test(name)) return true;
  if (/hareketli\s*bain\s*marie/i.test(name)) return true;
  if (/elektrikli\s*bain|gazli.*bain\s*marie|hareketli\s*bain/i.test(kat)) return true;
  return false;
}

/** Pişirme dept vitrin kategorisi */
export function mapOztiPisirmeCategory(row) {
  if (isOztiBainMarieMachine(row)) {
    const name = foldTr(row.urun_tanimi || row.name || "");
    if (/hareketli/i.test(name)) return "hareketli-bain-marie";
    return "setustu-bain-marie";
  }
  if (isOztiDonerOcak(row)) return "doner-ocaklari-";
  if (/SALAMANDER/.test(String(row.urun_tanimi || row.name || row.kategori || "").toLocaleUpperCase("tr")))
    return "salamander";
  const kod = normKod(row.urun_kodu || row.sku);
  const hay = `${row.urun_tanimi || row.name || ""} ${row.kategori || ""}`.toLocaleUpperCase("tr");
  if (/^9890\.IC(CLS|PRO)/i.test(kod) || /ICOMB|COMBI\s*MASTER|SELF\s*COOKING|KOMBI\s*FIRIN|KOMBİ\s*FIRIN/i.test(hay))
    return "kombi-firin";
  return slugify(row.kategori) || "diger";
}

/** GN küvet / gastronorm kap — küvetler PLP ve set üstü alt kategori */
export function isOztiGnKuvetRow(row) {
  if (isOztiBainMarieKap(row)) return true;
  const hay = foldTr(
    [row.kategori, row.urun_tanimi, row.name, ...(row.kategori_yolu || [])].join(" "),
  );
  if (
    /gastronorm|gn\s*kuvet|gn\s*küvet|standart\s*gn|kose\s*desenli|yapismaz\s*kaplamali|polipropilen.*kuvet|polikarbonat.*kuvet|delikli.*kuvet|sapli.*kuvet|gastronorm\s*kapak|gn\s*servis\s*tepsi|karistirma\s*kap|suzgec|süzgeç/i.test(
      hay,
    )
  ) {
    return true;
  }
  return /\bgn\s*\d{1,2}\s*\/\s*\d{1,2}/.test(hay);
}

/** GN küvet — vitrin category slug (küvetler PLP filtresi) */
export function mapOztiGnKuvetCategory(row) {
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  if (kat) {
    const slug = slugify(row.kategori);
    if (
      /kuvet|gastronorm-kapak|bain-marie-celik|polipropilen-gastronorm|polikarbonat-gastronorm|karistirma-kaplari|gn-servis-tepsi|delikli-gastronom|kose-desenli|yapismaz-kaplamali|sapli-gastronorm/.test(
        slug,
      )
    ) {
      return slug;
    }
  }
  const hay = foldTr(`${row.urun_tanimi || row.name || ""} ${kat}`);
  if (/yapismaz|yapışmaz/.test(hay)) return "gn-kuvetler-yapismaz-kaplamali";
  if (/delikli.*kose|kose.*delikli/.test(hay)) return "delikli-kose-desenli-gastronorm-kuvetler";
  if (/delikli/.test(hay)) return "delikli-gastronom-kuvetler";
  if (/kose|köşe/.test(hay)) return "kose-desenli-gastronorm-kuvetler";
  if (/sapli|saplı/.test(hay)) return "sapli-gastronorm-kuvetler";
  if (/polipropilen|\bpp\b/.test(hay)) return "polipropilen-gastronorm-kuvetler";
  if (/polikarbonat|\bpc\b/.test(hay)) return "polikarbonat-gastronorm-kuvetler";
  if (/kapak/.test(hay)) return "gastronorm-kapaklar";
  if (/servis\s*tepsi/.test(hay)) return "gn-servis-tepsileri";
  if (/karistirma|suzgec|süzgeç/.test(hay)) return "karistirma-kaplari-ve-suzgecler";
  return "standart-gastronorm-kuvetler";
}

/** Set üstü dept vitrin kategorisi */
export function mapOztiSetUstuCategory(row) {
  if (isOztiBainMarieKap(row)) return "bain-marie-celik-saklama-kaplari";
  if (isOztiGnKuvetRow(row)) return mapOztiGnKuvetCategory(row);
  const kat =
    row.kategori ||
    (Array.isArray(row.kategori_yolu) ? row.kategori_yolu[row.kategori_yolu.length - 1] : null);
  const ctx = getSetUstuTipContext();
  return mapSetUstuTip(kat, ctx.index, ctx.nav);
}

/** Hazırlık dept vitrin kategorisi (?tip= eşlemesi) */
export function mapOztiHazirlikCategory(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "");
  const kat = String(
    row.kategori ||
      (Array.isArray(row.kategori_yolu) ? row.kategori_yolu[row.kategori_yolu.length - 1] : "") ||
      "",
  );
  const hay = foldTr(`${name} ${kod} ${kat}`);
  const katU = kat.toLocaleUpperCase("tr");

  if (/^RC\.|robot\s*coupe/i.test(kod) || /robot\s*coupe/i.test(name)) {
    if (/disk|bıçak|bicak|aksesuar|yedek|parça|parca|tabak|kase|kep|kapak/i.test(hay))
      return "robot-coupe-aksesuarlari";
    if (/el\s*blender|el\s*mikser|micromix|mp\d|cmp/i.test(hay)) return "robot-coupe-el-mikserleri";
    if (/sebze|dograma|dograma|blixer|mutfak\s*robot/i.test(hay)) return "sebze-dograma-makineleri";
    return "robot-coupe-aksesuarlari";
  }
  if (/vakum/i.test(hay) || /VAKUM/i.test(katU)) return "vakum-makinesi";
  if (/sous\s*vide/i.test(hay)) return "sous-vide";
  if (/kıyma|kiyma|et\s*kıyma/i.test(hay) || /KIYMA/i.test(katU)) return "kiyma_makinesi";
  if (/kemik\s*testere/i.test(hay)) return "et_kemik_testeresi";
  if (/kütük|kutuk/i.test(hay)) return "et_kutugu";
  if (/hamur|spiral|planet|tulumba|şekillendir|sekillendir|köfte\s*şekil/i.test(hay) || /HAMUR/i.test(katU))
    return "hamur-hazirlik";
  if (/sebze|doğrama|dograma|patates\s*soyma|dilimleme/i.test(hay) || /SEBZE|DOĞRAMA|DILIMLEME/i.test(katU))
    return "sebze-dograma";
  if (/et\s*hazırlık|kasap/i.test(hay) || /ET\s*HAZIRLIK/i.test(katU)) return "et-hazirlik";
  const slug = slugify(kat);
  return slug && slug !== "diger" ? slug : "diger";
}

/** Soğutma dept vitrin kategorisi */
export function mapOztiSogutmaCategory(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "");
  const kat = String(row.kategori || "");
  const hay = foldTr(`${name} ${kod} ${kat}`);
  if (/^9805\.|buz\s*mak|ice\s*maker|hoshizaki|simag/i.test(hay)) return "buz-makinesi";
  if (/tezgah\s*tip|tezgahalt|counter\s*top/i.test(hay)) return "tezgah-tipi-buzdolabi";
  if (/make\s*up|makyaj/i.test(hay)) return "make-up-dolabi";
  if (/dik\s*tip|upright/i.test(hay)) return "dik-tip-buzdolap";
  if (/derin\s*dondur|freezer/i.test(hay)) return "derin-dondurucu";
  if (/blast|şok\s*so[gğ]ut|sok\s*sogut|chiller/i.test(hay)) return "blast-chiller";
  if (/so[gğ]uk\s*oda|cold\s*room/i.test(hay)) return "soguk-oda";
  if (/şarap|sarap|wine/i.test(hay)) return "sarap-dolabi";
  if (/dry\s*age|olgunlaştır/i.test(hay)) return "dry_age_dolabi";
  if (/buzdolab|buz\s*dolab/i.test(hay)) return "dik-tip-buzdolap";
  const slug = slugify(kat);
  if (slug === "buz-makineleri") return "buz-makinesi";
  return slug && slug !== "diger" ? slug : "sogutma-ekipmanlari";
}

/** Tezgah dept vitrin kategorisi */
export function mapOztiTezgahCategory(row) {
  const kat = String(
    row.kategori ||
      (Array.isArray(row.kategori_yolu) ? row.kategori_yolu[row.kategori_yolu.length - 1] : "") ||
      "",
  ).toLocaleUpperCase("tr");
  if (/ARA\s*TEZGAH/i.test(kat)) return "taban-ve-ara-rafli";
  if (/DOLAP/i.test(kat)) return "dolapli-tezgah";
  return "taban-rafli";
}

/** Set üstü vitrininde yanlış dept’te kalan Öztiryakiler satırları */
export function correctOztiMisplacedDept(row, dept) {
  const katU = String(
    row.kategori ||
      (Array.isArray(row.kategori_yolu) ? row.kategori_yolu[row.kategori_yolu.length - 1] : "") ||
      row.urun_alt_kategori ||
      "",
  ).toLocaleUpperCase("tr");
  if (/PATATES|EKMEK\s*D[Iİ]L[Iİ]M|P[ÜU]RE\s*MAK|ET\s*KIYMA|D[Iİ]L[Iİ]MLE/i.test(katU)) return "hazirlik";
  if (/SU\s*SEB[Iİ]L|DE[GĞ][Iİ]RMEN|BAR\s*BLENDER/i.test(katU)) return "icecek";
  if (/ARA\s*TEZGAH|ARATEZGAH/i.test(katU)) return "tezgah";
  return dept;
}

/** İçecek dept alt kategori (facet) */
export function mapOztiIcecekCategory(name, kod) {
  const k = normKod(kod);
  const hay = String(name || "").toLocaleUpperCase("tr");
  if (/^8574\.CM/i.test(k) || (/^8574\./.test(k) && /ÇAY\s*MAKİN|ÇAY\s*MAKIN|CAY\s*MAKIN/i.test(hay)))
    return "cay-makinasi";
  if (
    /^8573\./.test(k) &&
    !/^8573\.000/.test(k) &&
    (/ÇAY\s*KAZANI|CAY\s*KAZANI|CAPPADOCIA|EFES\s*CAY/i.test(hay) || /CDE|CDGE|CSGE|EDE|ESE/i.test(k))
  ) {
    return "cay-kazanlari";
  }
  if (/^8573\.000/.test(k) || /KAHVECI\s*DEML/i.test(hay)) return "kahveci-demlik";
  if (/^8593\./.test(k) || /SU\s*OTOMATI/i.test(hay)) return "su-otomati";
  if (/^8577\.|ÇAY\s*TOPU/i.test(hay)) return "cay-servis-aksesuarlari";
  if (/^0466\.|BARDAK/i.test(hay)) return "icecek-bardaklari";
  if (/^0469\.|SÜRAHİ/i.test(hay)) return "surehi-ve-servis";
  if (/STAND|ZCP/i.test(hay)) return "cay-servis-aksesuarlari";
  if (/^8477\./.test(k)) {
    if (/AYRAN|KAM\d|KOPUKLU/i.test(hay)) return "ayran-makinesi";
    if (/SLUSH/i.test(hay)) return "granita-slush";
    if (/SERBET|ŞERBET/i.test(hay)) return "limonata-serbet";
    return "meyve-suyu-sogutuculari";
  }
  if (/^9868\.(0?FG10)/i.test(k) || (/VITRIFRIGO/i.test(hay) && /SÜT|SUT|BARDAK\s*ISIT/i.test(hay)))
    return "kahve-sunum";
  if (/AYRAN\s*MAK|KOPUKLU\s*AYRAN/i.test(hay)) return "ayran-makinesi";
  if (/MEYVE\s*SUYU\s*SO[GĞ]UTMA/i.test(hay)) return "meyve-suyu-sogutuculari";
  return "icecek-diger";
}

/** Kahve dept vitrin kategorisi (facet / PLP tip) */
export function mapOztiKahveCategory(name, kod) {
  const k = normKod(kod);
  const hay = String(name || "").toLocaleUpperCase("tr");
  if (/^8574\.FM/i.test(k) || /FILTRE\s*KAHVE|FTL\d/i.test(hay) || /BRAVILOR/i.test(hay))
    return "filtre-kahve-makineleri";
  if (/^8534\./.test(k) || /KAHVE\s*SÜT\s*POTU|KAHVE\s*SUT\s*POTU/i.test(hay)) return "kahve-sut-potlari";
  if (/WMF/i.test(hay) || /^9580\./i.test(k)) return "wmf-kahve-makinalari";
  if (/NUOVA|NUOSI|APPIA|ESPRESSO|OSCAR/i.test(hay)) return "espresso-makinesi";
  if (/DEĞİRMEN|DEGIRMEN|GRINDER|MDX/i.test(hay)) return "kahve-degirmeni";
  if (/OTOMATİK\s*KAHVE|OTOMATIK\s*KAHVE/i.test(hay)) return "espresso-makinesi";
  return "kahve-diger";
}

/** Öztiryakiler bayi satırında ürün adının başındaki distribütör etiketini kaldırır. */
export function stripOztiNameLead(name) {
  const n = String(name || "").trim();
  const m = n.match(
    /^(?:ÖZTİRYAKİLER|OZTIRYAKILER|Öztiryakiler|Oztiryakiler)(?:\s+(?:Endüstriyel\s+Mutfak|ENDÜSTRIYEL\s+MUTFAK|Endustriyel\s+Mutfak|ENDUSTRIYEL\s+MUTFAK))?\s+/i
  );
  if (m) return n.slice(m[0].length).trim();
  return n;
}

/** Öztiryakiler bayi kataloğunda ürün adından OEM marka (filtre / vitrin). */
export function detectOztiOemBrand(name, category, kod) {
  const full = String(name || "").trim();
  const hay = stripOztiNameLead(full);
  const cat = String(category || "").toLocaleLowerCase("tr");
  const k = normKod(kod);
  const up = hay.toLocaleUpperCase("tr");
  const fullUp = full.toLocaleUpperCase("tr");

  if (
    /^ATS\b/.test(up) ||
    /\bATS\s+(?:CAPPADOCIA|EFES)\b/.test(fullUp) ||
    /^8573\.(?:CD|ED|ES)[A-Z0-9.]+$/i.test(k)
  ) {
    return "Ateşe";
  }
  if (/^WMF\b/.test(up) || (/^9580\./.test(k) && /WMF/.test(fullUp))) return "WMF";
  if (/^NUOVA\s+SIMONELLI/.test(up) || /^NUOSI\b/.test(up)) return "Nuova Simonelli";
  if (/^BRAVILOR/.test(up) || /^9574\.B/.test(k)) return "Bravilor Bonamat";
  if (/^UNOX\b/.test(up) || /\bUNOX\b/i.test(fullUp)) return "Unox";
  if (/^RATIONAL\b/i.test(up) || /\bRATIONAL\b/i.test(fullUp)) return "Rational";
  if (/^5RRX\./i.test(k)) return "Rational";
  if (/^ROBOT\s+COUPE/.test(up)) return "Robot Coupe";
  /** Robot Coupe — bayi SKU: 5R1X.*, 9840.*, 9860.*, 0830.* */
  if (/^5R1X\.|^9840\.|^9860\.|^0830\./i.test(k) && /ROBOT\s*COUPE|CL\d|R\s*\d{3}/i.test(fullUp)) {
    return "Robot Coupe";
  }
  /** SIMAG buz makinesi — 9805.* SKU Hoshizaki ile paylaşılır; ad önce */
  if (/^SIMAG\b/i.test(up) || /\bSIMAG\b/i.test(fullUp)) return "SIMAG";
  if (/^9805\./i.test(k) || /^HOSHIZAKI\b/.test(up) || /\bHOSHIZAKI\b/i.test(fullUp)) return "Hoshizaki";
  if (/^WINTERHALTER\b/.test(up)) return "Winterhalter";
  if (/^HOBART\b/.test(up) || /\bHOBART\b/i.test(fullUp)) return "Hobart";
  if (/^9830\./i.test(k) || /^FAC\b/.test(up) || /\bFAC\b/i.test(fullUp)) return "FAC";
  if (/^9868\./i.test(k) || /^VITRIFRIGO\b/.test(up) || /\bVITRIFRIGO\b/i.test(fullUp)) return "Vitrifrigo";
  if (/^BARTSCHER\b/.test(up) || /\bBARTSCHER\b/i.test(fullUp)) return "Bartscher";
  if (/^SANTOS\b/.test(up)) return "Santos";
  if (/^ELECTROLUX(?:\s+PROFESSIONAL)?\b/.test(up)) {
    return up.startsWith("ELECTROLUX PROFESSIONAL") ? "Electrolux Professional" : "Electrolux";
  }
  if (/^İNOKSAN\b|^INOKSAN\b/.test(up)) return "İnoksan";
  if (/^ZANUSSI\b/.test(up)) return "Zanussi";
  if (/^MEIKO\b/.test(up) || /\bMEIKO\b/i.test(fullUp)) return "Meiko";

  /** Ad önekli bayi markaları — eq-dept-cm-facets OEM_PREFIXES ile uyumlu */
  const OEM_LEAD = [
    ["Hamilton Beach", /^HAMILTON\s+BEACH\b/i],
    ["Electrolux Professional", /^ELECTROLUX\s+PROFESSIONAL\b/i],
    ["Nuova Simonelli", /^NUOVA\s+SIMONELLI\b/i],
    ["Bravilor Bonamat", /^BRAVILOR(?:\s+BONAMAT)?\b/i],
    ["Robot Coupe", /^ROBOT\s+COUPE\b/i],
    ["MenuMaster", /^MENUMASTER\b/i],
    ["PlateMate", /^PLATEMATE\b/i],
    ["Imperia", /^IMPERIA\b/i],
    ["Swedlinghaus", /^SWEDLINGHAUS\b/i],
    ["Vitrifrigo", /^VITRIFRIGO\b/i],
    ["Bartscher", /^BARTSCHER\b/i],
    ["Hoshizaki", /^HOSHIZAKI\b/i],
    ["Alkan", /^ALKAN\b/i],
    ["Fantom", /^FANTOM\b/i],
    ["Tribeca", /^TRIBECA\b/i],
    ["Copmak", /^COPMAK\b/i],
    ["Blanco", /^BLANCO\b/i],
    ["Dualit", /^DUALIT\b/i],
    ["Vesta", /^VESTA\b/i],
    ["SIMAG", /^SIMAG\b/i],
    ["Berkel", /^BERKEL\b/i],
    ["Dito Sama", /^DITO\s+SAMA\b/i],
    ["Sammic", /^SAMMIC\b/i],
    ["Smeg", /^SMEG\b/i],
    ["Fimar", /^FIMAR\b/i],
    ["Colged", /^COLGED\b/i],
    ["Miele", /^MIELE\b/i],
  ];
  for (const [label, re] of OEM_LEAD) {
    if (re.test(up) || re.test(fullUp)) return label;
  }

  if (cat.includes("wmf")) return "WMF";
  if (cat.includes("nuova-simonelli") || cat.includes("espresso")) {
    if (/BRAVILOR/.test(fullUp)) return "Bravilor Bonamat";
    if (/NUOVA|NUOSI|APPIA|OSCAR|MDX/.test(fullUp)) return "Nuova Simonelli";
  }
  if (cat.includes("degirmen") && /NUOVA|MDX/.test(fullUp)) return "Nuova Simonelli";
  if (/^9584\./.test(k) && /MDX|NUOVA/.test(fullUp)) return "Nuova Simonelli";
  if (cat.includes("cay-kazan") && /\bATS\b/.test(fullUp)) return "Ateşe";

  return "Öztiryakiler";
}

/**
 * Öztiryakiler paslanmaz tezgah vitrini kapalı (/shop/tezgah).
 * Dolap/set altı → dolap; ara tezgah modülü → set-ustu-mutfak; evye/çalışma hattı → vitrin dışı.
 */
export function mapOztiTezgahExcludedDept(hay) {
  const H = String(hay || "").toLocaleUpperCase("tr");
  if (/DOLAP|SET\s*ALTI/i.test(H)) return "dolap";
  if (/ARA\s*TEZGAH|ARATEZGAH/i.test(H)) return "set-ustu-mutfak";
  return null;
}

/** Excel kategori → mağaza dept */
export function mapOztiDept(row, setUstuAllow) {
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^9710\./i.test(kod)) return "yikama";
  if (/^07[0-9][A-Z]\./i.test(kod)) return "yikama";
  /** Izgara tablalı kazan yıkama evyesi (7771.*) — «IZGARA» pişirme kuralına düşmesin */
  if (/^7771\./i.test(kod)) return "yikama";
  if (isOztiBuzKonteyner(row)) return "sogutma";
  if (isOztiSogukHazirlikUnitesi(row)) return "sogutma";
  if (isOztiSebzeDograma(row)) return "hazirlik";
  if (isOztiIcecekBeverageDispenser(row)) return "icecek";
  if (isOztiIcecekMilkBar(row)) return "icecek";
  if (isOztiCihazaltiDolap(row)) return "dolap";

  const accessoryDept = mapOztiDeptAccessory(row);
  if (accessoryDept) return accessoryDept;

  if (isOztiBainMarieMachine(row)) return "pisirme";
  if (isOztiDonerOcak(row)) return "pisirme";
  if (isOztiTasimaAraba(row)) return "tasima";

  const pathHay = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  const hay = `${pathHay} ${kat} ${String(row.urun_tanimi || row.name || "")}`;

  if (/SALAMANDER/.test(hay)) return "pisirme";

  if (/SETÜSTÜ\s*MUTFAK|SETUSTU\s*MUTFAK/.test(hay)) return "set-ustu-mutfak";
  if (setUstuAllow?.length) {
    for (const a of setUstuAllow) {
      if (a && kat.indexOf(a) >= 0) return "set-ustu-mutfak";
    }
  }

  const rules = [
    [/SOĞUK\s*ODA|DERİN\s*DONDURUCU\s*ODA|BUZ\s*MAKİN|BUZ\s*MAKIN|SOĞUTUCU|BUZDOLAB|DONDURMA\s*MAKİN/i, "sogutma"],
    [/EL\s*YIKAMA/i, "yikama"],
    [
      /BARDAK\s*YIKAMA|FLIGHT\s*TİP\s*BULAŞIK|HOBART\s*BULAŞIK|SEBZE\s*YIKAMA|KAZAN\s*YIKAMA\s*MAK|KAZAN\s*YIKAMA\s*EVYE/i,
      "yikama",
    ],
    [
      /BULAŞIK\s*(MAKİNE|MAKINE|MAKİNASI)|YIKAMA\s*MAKİN|OB[YM]\b|OBY|AMX[-.\d]|OKY|UX10|FX10/i,
      "yikama",
    ],
    [/DAVLUMBAZ|YAĞ\s*TUTUCU/i, "davlumbaz"],
    [
      /KAHVE\s*MAKİN|KAHVE\s*MAKIN|FİLTRE\s*KAHVE|FILTRE\s*KAHVE|OTOMATİK\s*KAHVE|OTOMATIK\s*KAHVE|WMF\s|NUOVA\s*SIMONELLI|ESPRESSO|BARISTA/i,
      "kahve",
    ],
    [/İSTİF\s*RAF/i, "istif"],
    [/KUZİNE|OCAK|IZGARA|FRİTÖZ|FRITOZ|FIRIN|KAYNATMA|BENMARİ|BENMARI|WOK|İNDÜKSİYON|INDUKSIYON|900\s*SERİ|OPTIMUM|LAVATAŞ|D[OÖ]NER\s*OCA[GĞ]|DONER\s*OCAG|PİŞİRİCİ|PISIRICI/i, "pisirme"],
    [/ARABA(?!LI)|TAŞIMA|BANKET|SERVİS\s*ÜNİT/i, "tasima"],
    [/DOLAP|RAF(?!.*İSTİF)/i, "dolap"],
    [/HAZIRLIK|KESME\s*TAHTA|MİKSER|DOĞRAYICI|DO[GĞ]RAMA|HAMUR/i, "hazirlik"],
    [/İÇECEK|BAR\s*AKSESUAR|ÇAY\s*KAHVE\s*VE\s*BAR/i, "icecek"],
    [/SERVİS\s*GEREÇ|GASTRONORM|CHAFING|TENCERE|TAVA|GURMEAID|BAKIR\s*SUNUM|MASAÜSTÜ|MELAMİN|HELVA|SIĞ\s*TENCERE|SİLİNDİRİK|PRES\s*BASKI|KARIŞTIRMA|SÜZGEÇ|POLİETİLEN|POLİPROPİLEN|POLİKARBONAT|SİNEK/i, "set-ustu-mutfak"],
    [/BAIN\s*MARIE\s*(KAPAK|KÜVET|KUVET|ÇELİK|CELIK)/i, "set-ustu-mutfak"],
  ];

  for (const [re, dept] of rules) {
    if (re.test(hay)) return dept;
  }
  if (/TEZGAH|EVYE|EVYELİ|ÇALIŞMA\s*TEZGAH/i.test(hay)) {
    return mapOztiTezgahExcludedDept(hay);
  }
  return "set-ustu-mutfak";
}

/** Excel Sayfa1 — para sütunu TL ise liste zaten TRY; EUR kur ile çarpılmaz. */
export function isOztiListeTl(row) {
  const p = String(row?.para_birimi || row?.para || "")
    .trim()
    .toUpperCase();
  return p === "TL" || p === "TRY" || p === "₺";
}

/**
 * Excel «BAYİ İSKONTO» = indirim oranı (ondalık).
 * Örn. 0,73 → %73 iskonto, bayi net = liste × 0,27.
 */
export function oztiOdemeCarpani(bayiIsk) {
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return 1;
  return Math.round((1 - isk) * 10000) / 10000;
}

/** Bayi net alış = liste × (1 − iskonto oranı) */
export function oztiSatisEur(liste, bayiIsk) {
  const L = Number(liste);
  if (!(L > 0)) return null;
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return Math.round(L * 100) / 100;
  return Math.round(L * (1 - isk) * 100) / 100;
}

export function oztiIskontoYuzde(bayiIsk) {
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return 0;
  return Math.round(isk * 10000) / 100;
}

export const OZTI_KDV_ORAN = 20;
/**
 * Equsto satış: bayi net alış üzerine kar.
 * 2026-07-30: %8 → ×1,10 zam (0.188); ardından tüm satış %3 indirim
 * (1.188 × 0.97 = 1.15236 → kar oranı 0.15236)
 * 2026-08-03: site geneli ×1,0388 (+%6/−%2) → 0.15236×1.0388 = 0.15827
 */
export const OZTI_EQUSTO_KAR_ORAN = 0.15827;

export function oztiFmtTry(n) {
  const v = Math.round(Number(n));
  if (!(v > 0)) return "";
  return `₺${v.toLocaleString("tr-TR")},00`;
}

/** Mağaza etiketi — yalnızca KDV dahil TL (build + canlı kur güncellemesi). */
export function oztiPriceLabelTl(pricing) {
  const kdvDahil = Number(pricing?.fiyat_tl);
  if (kdvDahil > 0) return `${oztiFmtTry(kdvDahil)} KDV dahil`;
  return "";
}

/** Fiyat listesi 2025: bayi net = liste × (1 − iskonto); Equsto = bayi net × (1 + kar). */
export function oztiPricingFields(row, kurTry, opts) {
  const liste = Number(row.liste_fiyati_eur ?? row.liste_fiyati) || 0;
  const bayi = Number(row.bayi_iskonto);
  const tlListe = isOztiListeTl(row);
  const kalanOran = oztiOdemeCarpani(bayi);
  const iskPct = oztiIskontoYuzde(bayi);
  const karOran = Number(
    opts?.equstoKarOran != null ? opts.equstoKarOran : OZTI_EQUSTO_KAR_ORAN,
  );
  const bayiNet =
    oztiSatisEur(liste, bayi) ??
    (Number(row.alis_fiyati_eur ?? row.alis_fiyati) > 0
      ? Number(row.alis_fiyati_eur ?? row.alis_fiyati)
      : null) ??
    (Number(row.alis_fiyati_tl) > 0 ? Number(row.alis_fiyati_tl) : null);
  let equstoNet = bayiNet;
  if (bayiNet > 0 && karOran > 0) {
    equstoNet = Math.round(bayiNet * (1 + karOran) * 100) / 100;
  }

  const kur = Number(kurTry);
  let fiyat_tl_net = null;
  let fiyat_tl = null;
  let price = "";
  if (equstoNet > 0) {
    if (tlListe) {
      fiyat_tl_net = Math.round(equstoNet);
      fiyat_tl = Math.round(fiyat_tl_net * (1 + OZTI_KDV_ORAN / 100));
      price = oztiPriceLabelTl({ fiyat_tl });
    } else if (kur > 0) {
      fiyat_tl_net = Math.round(equstoNet * kur);
      fiyat_tl = Math.round(fiyat_tl_net * (1 + OZTI_KDV_ORAN / 100));
      price = oztiPriceLabelTl({ fiyat_tl });
    }
  }

  return {
    liste_fiyati: liste || null,
    liste_fiyati_eur: tlListe ? null : liste || null,
    liste_fiyati_tl: tlListe ? liste || null : null,
    alis_fiyati: bayiNet,
    alis_fiyati_eur: tlListe ? null : bayiNet,
    alis_fiyati_tl: tlListe ? bayiNet : null,
    satis_fiyati_eur: tlListe ? null : equstoNet,
    satis_fiyati_tl: tlListe ? equstoNet : null,
    satis_eur_indirimli: tlListe ? null : equstoNet,
    iskontolu_fiyat: equstoNet,
    equsto_kar_oran: karOran > 0 ? karOran : null,
    bayi_iskonto: Number.isFinite(bayi) ? bayi : null,
    odeme_carpani: kalanOran,
    kalan_oran: kalanOran,
    iskonto_yuzde: iskPct,
    iskonto_oran: iskPct,
    para_birimi: row.para_birimi || (tlListe ? "TL" : "EUR"),
    fiyat_kaynagi: "ozti-fiyat-listesi-2025",
    stok_no: row.urun_kodu,
    kur_eur_try: tlListe ? null : kur > 0 ? kur : null,
    fiyat_tl_net,
    fiyat_tl,
    kdv_oran: OZTI_KDV_ORAN,
    price,
  };
}

/** @deprecated Mağazada kullanılmaz — yalnızca specs satırı */
export function oztiPriceLabelEur(pricing) {
  return oztiPriceLabelTl(pricing);
}

export function oztiPricingLines(row, kurTry, opts) {
  const px = oztiPricingFields(row, kurTry, opts);
  const tlListe = isOztiListeTl(row);
  const liste = tlListe ? px.liste_fiyati_tl : px.liste_fiyati_eur;
  const bayiNet = tlListe ? px.alis_fiyati_tl : px.alis_fiyati_eur;
  const satis = tlListe ? px.satis_fiyati_tl : px.satis_fiyati_eur;
  const iskPct = px.iskonto_yuzde;
  const kalan = px.kalan_oran ?? px.odeme_carpani;
  const karPct = px.equsto_kar_oran != null ? Math.round(px.equsto_kar_oran * 10000) / 100 : 0;
  const birim = tlListe ? "TL" : "EUR";
  const lines = [
    `Ürün kodu: ${row.urun_kodu}`,
    `Liste fiyatı (${birim}): ${liste ?? "—"}`,
    `Bayi iskonto: %${iskPct || "—"} (kalan oran ${kalan})`,
    `Bayi net alış (${birim}): ${bayiNet ?? "—"}`,
    `Equsto satış (${birim}): ${satis ?? "—"}${karPct ? ` (+%${karPct} kar)` : ""}`,
    `Hesap: liste × (1 − bayi iskonto); Equsto = bayi net × ${1 + (px.equsto_kar_oran || 0)}`,
  ];
  if (px.fiyat_tl > 0) {
    lines.push(
      `Equsto satış (TL, KDV dahil): ${oztiFmtTry(px.fiyat_tl)}`,
      px.kur_eur_try
        ? `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${px.kdv_oran})`
        : tlListe
          ? `Para birimi: TL (kur çevrimi yok, KDV %${px.kdv_oran})`
          : "",
    );
  }
  lines.push(`Kategori: ${row.kategori || ""}`, "Kaynak: Öztiryakiler Fiyat Listesi 2025");
  return lines;
}

export function isOztiBrand(row) {
  return /öztiryaki|oztiryaki/i.test(String(row.brand || ""));
}

/** oztiryakiler.com.tr yok — PDF/katalog açıklaması yedek */
export function applyOztiCatalogFallbackDescription(row, pdfEntry) {
  if (row.ozti_web_description) return false;
  const src = {
    urun_kodu: row.urun_kodu || row.sku,
    urun_tanimi: row.urun_tanimi || row.name,
    kategori: row.kategori,
    kategori_yolu: row.kategori_yolu,
    barkod: row.barkod,
  };
  const bullets = pdfBulletLines(pdfEntry, src.urun_kodu);
  const aciklama = buildAciklama(src, pdfEntry, bullets);
  if (!aciklama || aciklama.length < 12) return false;

  row.description = aciklama;
  row.ozti_description_source = pdfEntry ? "katalog-pdf" : "fiyat-listesi";
  row.ozti_description_at = new Date().toISOString().slice(0, 10);
  if (!row.aciklama) row.aciklama = aciklama;

  const marker = `\n\nÜrün açıklaması (${row.ozti_description_source})\n`;
  const baseSpecs = String(row.specs || "").split("\n\nÜrün açıklaması")[0].trim();
  if (!baseSpecs.includes(aciklama.slice(0, 40))) {
    row.specs = `${baseSpecs}${marker}${aciklama}`.trim();
  }
  return true;
}

/** 7919.xxNTV.C1 — sitede PDP yok; aynı serinin C2 kardeşinden türet. */
export function oztiNtvC1SiblingKod(kod) {
  const k = normKod(kod);
  if (!/^7919\.\d{2}NTV\.C1$/i.test(k)) return null;
  return k.replace(/\.C1$/i, ".C2");
}

function oztiSpecValue(specs, label) {
  const re = new RegExp(`^${label}:\\s*(.+)$`, "i");
  for (const line of specs || []) {
    const m = String(line).match(re);
    if (m) return m[1].trim();
  }
  return "";
}

/** C2 web specs → C1 teklif/PDP açıklaması (2 kapılı varyant). */
export function buildOztiNtvC1PayloadFromC2(targetKod, c2Payload) {
  const kod = normKod(targetKod);
  const siblingKod = normKod(c2Payload?.kod || oztiNtvC1SiblingKod(kod));
  if (!siblingKod || !Array.isArray(c2Payload?.specs) || !c2Payload.specs.length) return null;

  const specs = c2Payload.specs.map((line) =>
    String(line)
      .replace(/\.C2\b/gi, ".C1")
      .replace(new RegExp(siblingKod.replace(/\./g, "\\."), "gi"), kod),
  );

  const en = oztiSpecValue(specs, "En \\(mm\\)");
  const boy = oztiSpecValue(specs, "Boy \\(mm\\)");
  const yuk = oztiSpecValue(specs, "Yükseklik \\(mm\\)");
  const kap = oztiSpecValue(specs, "Kapasite");
  const kwRaw = oztiSpecValue(specs, "Elektrik Gücü");
  const model = oztiSpecValue(specs, "Model Numarası");
  const kw = kwRaw
    ? String(kwRaw)
        .replace(",", ".")
        .replace(/\s*kW\s*$/i, "")
        .trim()
    : "";

  const bullets = [
    "GN 1/1 raflı çift kapılı cihazaltı buzdolabı",
    "İç ve dış gövde paslanmaz çelik",
    "Normal sıcaklıkta fanlı soğutma sistemi (NTV)",
  ];
  if (kap) bullets.push(`Kapasite ${kap}`);
  if (kw) bullets.push(`Elektrik gücü ${kw} kW — 230 V / 50 Hz`);
  bullets.push("Çalışma sıcaklığı -2 / +8 °C");
  if (en && boy && yuk) bullets.push(`Ölçü: ${en} x ${boy} x ${yuk} mm (G x D x Y)`);
  if (model) bullets.push(`Model ${model}`);

  const description = bullets.map((b) => `* ${b}`).join("\n");

  return {
    kod,
    kodSoft: kodSoftKey(kod),
    description,
    bullets,
    specs,
    url: c2Payload.url,
    source: "oztiryakiler.com.tr (NTV.C2 kardeş SKU)",
  };
}

/** oztiryakiler.com.tr WP REST / PDP açıklamasını katalog satırına yazar */
export function applyOztiWebDescription(row, payload) {
  if (!payload?.description) return false;

  const bullets = Array.isArray(payload.bullets) ? payload.bullets : [];
  const specs = Array.isArray(payload.specs) ? payload.specs : [];

  const tech = [...(row.teknik_ozellikler || [])];
  for (const line of specs) {
    const t = String(line || "").trim();
    if (!t) continue;
    if (!tech.some((x) => String(x).trim() === t)) tech.push(t);
  }
  for (const line of bullets) {
    const t = String(line || "").trim();
    if (!t || t.length < 8) continue;
    const norm = t.replace(/^•\s*/, "");
    if (/^(genişlik|derinlik|yükseklik|güç|en \(mm\)|boy \(mm\))/i.test(norm)) {
      if (!tech.some((x) => String(x).trim() === norm)) tech.push(norm);
    }
  }
  row.teknik_ozellikler = tech;

  const webKw = parseWebElektrikGucuKw(specs);
  if (webKw) syncRowGucKw(row, webKw);

  row.description = String(payload.description).trim();
  row.ozti_web_description = row.description;
  if (payload.url) row.ozti_web_url = payload.url;
  if (payload.wpId) row.ozti_web_id = payload.wpId;
  if (payload.slug) row.ozti_web_slug = payload.slug;
  row.ozti_description_source = payload.source || "oztiryakiler.com.tr";
  row.ozti_description_at = new Date().toISOString().slice(0, 10);

  const marker = `\n\nÜrün açıklaması (${row.ozti_description_source})\n`;
  const baseSpecs = String(row.specs || "").split("\n\nÜrün açıklaması")[0].trim();
  if (!baseSpecs.includes(row.description.slice(0, 40))) {
    row.specs = `${baseSpecs}${marker}${row.description}`.trim();
  }

  const lead = bullets[0] || row.description.replace(/^•\s*/, "").split("\n")[0];
  if (lead) {
    row.aciklama = `${row.name}\n\n${lead}\n\nKategori: ${row.category || ""}`.trim();
  }

  return true;
}

const OZTI_AX_BASE = "https://oztiryakiler.com.tr/ax-images/images";

/** Üretici CDN — dosya adı: {ÜRÜN_KODU}.jpg (NTV dolap proxy dahil). */
export function oztiAxImageUrl(kod) {
  const k = oztiAxProxyKod(kod);
  if (!/^[0-9A-Z]{2,8}\.[A-Z0-9.\-]{2,}$/i.test(k)) return "";
  return `${OZTI_AX_BASE}/${encodeURIComponent(k)}.jpg`;
}

/** `ozti-8574-cm080-00` → `8574.CM080.00` (fetch-ozti-web-images slugFile tersi). */
export function oztiKodFromWebSlug(slug) {
  const parts = String(slug || "")
    .replace(/^ozti-/i, "")
    .split("-")
    .filter(Boolean);
  if (parts.length < 2) return "";
  return parts.map((p) => p.toUpperCase()).join(".");
}

/**
 * Vitrin `images[]` — yalnızca repodaki yerel dosya yolları.
 */
export function oztiCatalogImageHref(_kod, localRel) {
  const rel = String(localRel || "").replace(/\\/g, "/");
  if (/^images\/catalog\/ozti\//i.test(rel)) return rel;
  if (rel && !/^https?:\/\//i.test(rel)) return rel;
  return "";
}

/** `images/catalog/ozti/web/ozti-8574-cm080-00.jpg` — canlıda eq-site-urls → ax-images CDN. */
export function oztiWebImageRel(kod) {
  const k = normKod(kod);
  if (!/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(k)) return "";
  const slug =
    "ozti-" +
    k
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "");
  return `images/catalog/ozti/web/${slug}.jpg`;
}

/** ax-images 404 / cafemarkt UNOX stub — NTV cihazaltı dolap aile fotoğrafı. */
export const OZTI_AX_PROXY = {
  "2919.0B390.AD01.00": "7506.0B390.00",
  "7919.47NTV.C2": "7919.37NTV.C2",
  "7919.46NTV.C2": "7919.37NTV.C2",
  "7919.47NTV.C1": "7919.37NTV.C1",
  "7919.46NTV.C1": "7919.37NTV.C1",
  "7919.36NTV.C2": "7919.36NTV.24",
  "7919.27NTV.C2": "7919.27NTV.24",
  "7919.26NTV.C2": "7919.26NTV.24",
  "7919.36NTV.C1": "7919.36NTV.24",
  "7919.27NTV.C1": "7919.27NTV.24",
  "7919.26NTV.C1": "7919.26NTV.24",
  "7919.47NTV.T1": "7919.27NTV.T1",
  "7919.37NTV.T1": "7919.27NTV.T1",
  "9805.IM240D.NHC": "9805.IM240X.NHC",
  "9805.00IMD.00": "9805.IM45N.EHC",
  /** OTKFGE 12090 — ax-images yok; G/E kardeş SKU fotoğrafı */
  "7890.12901.51": "7890.12901.55",
  "7890.12908.52": "7890.12908.54",
  "7865.N1.12708.12L": "7865.N1.12908.10",
};

export function oztiAxProxyKod(kod) {
  const k = normKod(kod);
  if (OZTI_AX_PROXY[k]) return OZTI_AX_PROXY[k];
  const m = k.match(/^7919\.(\d{2})NTV\.(C1|C2|T1)$/);
  if (!m) return k;
  if (m[2] === "T1" && m[1] === "27") return k;
  if (m[2] === "T1" && (m[1] === "37" || m[1] === "47" || m[1] === "46"))
    return "7919.27NTV.T1";
  const series = m[1];
  if (parseInt(series, 10) >= 46)
    return m[2] === "C1" ? "7919.37NTV.C1" : "7919.37NTV.C2";
  if (m[2] === "C1" || m[2] === "C2") return k;
  return `7919.${series}NTV.24`;
}

/** Yerel dosya → ax (8477 / NTV proxy) → web sentetik yol. */
export function oztiVitrinImageHref(kod, manifestRel) {
  const k = normKod(kod);
  const proxyAx = oztiAxImageUrl(kod);
  if (
    proxyAx &&
    (/^8477\./i.test(k) ||
      /^9868\.(0?FG10)/i.test(k) ||
      /^9805\./i.test(k) ||
      OZTI_AX_PROXY[k] ||
      /^7919\.\d{2}NTV\.(C1|C2|T1)$/i.test(k))
  ) {
    return proxyAx;
  }
  return oztiCatalogImageHref(kod, manifestRel) || oztiWebImageRel(kod);
}
