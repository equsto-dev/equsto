/**
 * Atalay — atalay.com.tr açıklama / teknik özellik → katalog satırı
 */
import { formatAtalayDescription } from "./atalay-pdp-parse.mjs";

export const ATALAY_BRAND = "Atalay Endüstriyel Mutfak Ekipmanları";
export const ATALAY_BRAND_ID = "atalay-endustriyel-mutfak-ekipmanlari";

export function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

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

export function isAtalayBrand(row) {
  const b = String(row?.brand || "");
  const id = String(row?.id || "");
  return /atalay/i.test(b) || id.startsWith(ATALAY_BRAND_ID + "__");
}

/** PDF "AEI - 673 / ND CR" → "AEI-673-ND" */
export function pdfGrillAliases(model) {
  const m = String(model || "").trim();
  const out = [];
  const slash = m.match(/^(AEI|AGI)\s*-\s*(\d+)\s*\/\s*(ND|N|D)(?:\s*(CR))?$/i);
  if (slash) {
    const p = slash[1].toUpperCase();
    const sz = slash[2];
    const plate = slash[3].toUpperCase();
    if (plate === "ND") out.push(`${p}-${sz}-ND`, `${p}${sz}ND`);
    else if (plate === "N") {
      out.push(`${p}-${sz}-N`);
      if (slash[4]) out.push(`${p}-${sz}-N-CR`, `${p}${sz}NCR`);
      else out.push(`${p}${sz}N`);
    } else {
      out.push(`${p}-${sz}`);
      if (slash[4]) out.push(`${p}-${sz}-CR`);
    }
  }
  const hyphenGrill = m.match(/^(AEI|AGI)[-\s]*(\d+)\s*\/\s*(N|ND|D)(?:\s*(CR))?$/i);
  if (hyphenGrill) {
    const p = hyphenGrill[1].toUpperCase();
    const sz = hyphenGrill[2];
    const plate = hyphenGrill[3].toUpperCase();
    out.push(`${p}-${sz}`);
    if (plate === "N") out.push(`${p}-${sz}-N`);
    if (plate === "ND") out.push(`${p}-${sz}-ND`);
    if (hyphenGrill[4]) out.push(`${p}-${sz}-CR`, `${p}-${sz}-N-CR`);
  }
  return out;
}

export function modelNeedles(model) {
  const m = String(model || "").trim();
  if (!m) return [];
  const out = new Set();
  const add = (s) => {
    const n = norm(s);
    if (n.length >= 3) out.add(n);
  };
  add(m);
  add(m.replace(/\s+/g, ""));
  add(m.replace(/\s*-\s*/g, "-"));
  add(m.replace(/\//g, "-"));
  add(m.replace(/\s+/g, "-"));
  if (/^E\s+/i.test(m)) add(m.replace(/^E\s+/i, ""));
  for (const a of pdfGrillAliases(m)) add(a);
  return [...out].sort((a, b) => b.length - a.length);
}

export function aliasModels(model) {
  const m = String(model || "").trim();
  const out = [m];
  const add = (s) => {
    const t = String(s || "").trim();
    if (t && !out.includes(t)) out.push(t);
  };

  const adrE = m.match(/^ADR-C1-(\d+)E(-GK)?$/i);
  if (adrE && !["4", "5"].includes(adrE[1])) {
    add(`ADR-C1-5E${adrE[2] || ""}`);
    add(`ADR-C1-4E${adrE[2] || ""}`);
  }
  const adrG = m.match(/^ADR-C1-(\d+)G(-GK)?$/i);
  if (adrG && !["4", "5"].includes(adrG[1])) {
    add(`ADR-C1-5G${adrG[2] || ""}`);
    add(`ADR-C1-4G${adrG[2] || ""}`);
    add(`ADR-C1-5E${adrG[2] || ""}`);
  }
  if (/^GN\s/i.test(m)) {
    add("EAPD-360");
    add("E APD - 360");
  }
  if (/^ADSA-\d+$/i.test(m)) add("ADSA-01");
  const east = m.match(/^E\s*AST\s*-\s*(\d+)/i);
  if (east) {
    const w = Number(east[1]);
    if (w <= 46) add("E-AST-46");
    else add("E-AST-86");
  }
  const apfm = m.match(/^APFM\s*-?\s*(\d+)/i);
  if (apfm) {
    add(`APF-${apfm[1]}-1`);
    add(`APF-${apfm[1]}-2`);
  }
  if (/^AEI[-\s]*670/i.test(m)) add("AEI-670");
  if (/^AEI[-\s]*470/i.test(m)) add("AEI-470");
  if (/^AEI[-\s]*870/i.test(m)) add("AEI-870-N", "AEI-870-CR");
  return out;
}

function plateHints(row) {
  const hay = foldTr([row.name, row.model, row.specs].filter(Boolean).join(" "));
  return {
    duz: /\bdüz\b|\bduz\b|düz pleyt|duz pleyt/.test(hay),
    nerv: /nervürlü|nervurlu|oluklu/.test(hay),
    cr: /\bcr\b|krom/.test(hay),
    nd: /\bnd\b|n\/d|n\+d/.test(hay),
    elektrik: /elektrikli|elektrik/.test(hay),
    gaz: /gazlı|gazli|doğalgaz|dogalgaz|lpg/.test(hay),
  };
}

function scoreEntry(row, entry) {
  const titleHay = norm(entry.title);
  const slugHay = norm(entry.slug || entry.url || "");
  let score = 0;
  for (const cand of aliasModels(row.model || row.sku)) {
    for (const needle of modelNeedles(cand)) {
      if (needle.length < 4) continue;
      if (titleHay.includes(needle) || slugHay.includes(needle)) {
        score += needle.length;
      }
    }
  }
  const hints = plateHints(row);
  if (hints.duz && !hints.nerv && /-N-|-NCR|-ND/.test(entry.slug || "")) score -= 40;
  if (hints.duz && !hints.nerv && !/-N|-CR|-ND/.test(entry.slug || "")) score += 15;
  if (hints.nerv && /-N-|-NCR|n-elektrikli/.test(entry.slug || "")) score += 20;
  if (hints.cr && /-CR|cr-/.test(entry.slug || "")) score += 25;
  if (hints.nd && /-ND|nd-/.test(entry.slug || "")) score += 25;
  if (hints.elektrik && /elektrikli|elektrik/.test(entry.slug || "")) score += 10;
  if (hints.gaz && /gazli|dogalgaz|lpg|ng-/.test(entry.slug || "")) score += 10;
  if (hints.elektrik && hints.gaz) {
    /* hybrid — no penalty */
  } else if (hints.elektrik && /gazli|dogalgaz/.test(entry.slug || "")) score -= 30;
  else if (hints.gaz && /elektrikli/.test(entry.slug || "")) score -= 30;
  return score;
}

/** En iyi atalay.com.tr kaydını seç */
export function matchAtalayEntry(index, row) {
  const entries = index?.entries || [];
  if (!entries.length) return null;
  let best = null;
  let bestScore = 0;
  for (const entry of entries) {
    const s = scoreEntry(row, entry);
    if (s > bestScore) {
      bestScore = s;
      best = entry;
    }
  }
  return bestScore >= 8 ? best : null;
}

export function applyAtalayWebDescription(row, payload) {
  if (!payload?.description && !payload?.bullets?.length) return false;

  const bullets = Array.isArray(payload.bullets) ? payload.bullets : [];
  const specs = Array.isArray(payload.specs) ? payload.specs : [];
  const description =
    String(payload.description || "").trim() || formatAtalayDescription(bullets);
  if (!description) return false;

  const tech = [...(row.teknik_ozellikler || [])];
  for (const line of specs) {
    const t = String(line || "").trim();
    if (!t) continue;
    if (!tech.some((x) => String(x).trim() === t)) tech.push(t);
  }
  row.teknik_ozellikler = tech;

  row.description = description;
  row.atalay_web_description = description;
  if (payload.url) row.atalay_web_url = payload.url;
  if (payload.id) row.atalay_web_id = payload.id;
  if (payload.slug) row.atalay_web_slug = payload.slug;
  if (payload.title) row.atalay_web_title = payload.title;
  row.atalay_description_source = payload.source || "atalay.com.tr";
  row.atalay_description_at = new Date().toISOString().slice(0, 10);

  const marker = `\n\nÜrün açıklaması (${row.atalay_description_source})\n`;
  const baseSpecs = String(row.specs || "").split("\n\nÜrün açıklaması")[0].trim();
  if (!baseSpecs.includes(description.slice(0, 40))) {
    row.specs = `${baseSpecs}${marker}${description}`.trim();
  }

  const lead = bullets[0] || description.replace(/^\*\s*/, "").split("\n")[0];
  if (lead) {
    row.aciklama = `${row.name}\n\n${lead.replace(/^\*\s*/, "")}\n\nKategori: ${row.category || ""}`.trim();
  }

  return true;
}
