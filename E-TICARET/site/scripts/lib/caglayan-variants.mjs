/**
 * Çağlayan teknik tablolarından model varyantları (ölçü + model kodu).
 */
import path from "node:path";

const IMG_EXT = /\.(webp|jpe?g|png|gif)$/i;

function parseMm(cell) {
  const s = String(cell || "").trim();
  if (!s || !/\d/.test(s)) return null;
  const m = s.match(/^(\d{3,4})(?:[,.]\d+)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 400 || n > 4000) return null;
  return n;
}

function isDepthHeader(cell) {
  return /derinlik|depth/i.test(String(cell || ""));
}

function isModelCode(cell) {
  const s = String(cell || "").trim();
  if (!s || isDepthHeader(s)) return false;
  return /[A-Za-z]/.test(s) && /\d/.test(s) || /^[A-Z]{2,4}(\s*\([^)]+\))?$/i.test(s);
}

function cleanModelKod(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

function collectTables(urun) {
  const out = [];
  const push = (t) => {
    if (t?.satirlar?.length) out.push(t);
  };
  for (const t of urun.teknik?.tablolar || []) push(t);
  for (const a of urun.teknik?.akordeon || []) {
    for (const t of a.tablolar || []) push(t);
    for (const s of a.sekmeler || []) for (const t of s.tablolar || []) push(t);
  }
  for (const s of urun.teknik?.sekmeler || []) for (const t of s.tablolar || []) push(t);
  return out;
}

/** Derinlik satırı + uzunluk/yükseklik matrisi (Fulya, Lilyum vb.) */
function parseDepthMatrix(table) {
  const rows = table.satirlar || [];
  let modelKod = "";
  let depthRowIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(isDepthHeader)) {
      modelKod = cleanModelKod(rows[i][0] || "");
      depthRowIdx = i;
      break;
    }
  }
  if (depthRowIdx < 0) return [];

  const depths = (rows[depthRowIdx + 1] || []).map(parseMm).filter(Boolean);
  if (!depths.length) return [];

  const variants = [];
  let carryHeight = 0;

  for (let i = depthRowIdx + 2; i < rows.length; i++) {
    const row = rows[i];
    const nums = row.map(parseMm).filter((n) => n != null);
    if (!nums.length) continue;

    let g = 0;
    let y = 0;
    let idx = 0;

    if (nums[idx] >= 600 && nums[idx] <= 3500) {
      g = nums[idx++];
    }
    if (nums[idx] >= 800 && nums[idx] <= 2800) {
      y = nums[idx++];
      carryHeight = y;
    } else if (carryHeight) {
      y = carryHeight;
    }

    if (!g) continue;
    if (!y && carryHeight) y = carryHeight;
    if (!y) continue;

    if (depths.length === 1) {
      variants.push({
        modelKod,
        genislik_mm: g,
        derinlik_mm: depths[0],
        yukseklik_mm: y,
      });
      continue;
    }

    for (const d of depths) {
      variants.push({
        modelKod,
        genislik_mm: g,
        derinlik_mm: d,
        yukseklik_mm: y,
      });
    }
  }

  return variants;
}

/** Tek satır: uzunluk + yükseklik (derinlik yok veya ayrı sütun) */
function parseLengthHeightRows(table) {
  const headers = (table.basliklar || []).join(" ").toLowerCase();
  if (!/length|uzunluk/i.test(headers) || !/height|yükseklik/i.test(headers)) {
    return [];
  }
  if (table.satirlar?.some((r) => r.some(isDepthHeader))) return [];

  const variants = [];
  let modelKod = "";

  for (const row of table.satirlar || []) {
    if (row.some(isDepthHeader)) continue;
    if (row.some((c) => isModelCode(c) && /\(/.test(c))) {
      modelKod = cleanModelKod(row.find(isModelCode) || row[0] || "");
      continue;
    }
    const nums = row.map(parseMm).filter(Boolean);
    if (nums.length >= 2) {
      variants.push({
        modelKod,
        genislik_mm: nums[0],
        derinlik_mm: nums[1] >= 600 && nums[1] <= 3500 ? nums[1] : 0,
        yukseklik_mm: nums[1] >= 800 && nums[1] <= 2800 ? nums[1] : nums[2] || 0,
      });
    }
  }
  return variants.filter((v) => v.genislik_mm && v.yukseklik_mm);
}

function variantKey(v) {
  return [v.modelKod, v.genislik_mm, v.derinlik_mm, v.yukseklik_mm].join("|");
}

function dedupe(variants) {
  const seen = new Set();
  return variants.filter((v) => {
    const k = variantKey(v);
    if (seen.has(k)) return false;
    seen.add(k);
    return v.genislik_mm && v.yukseklik_mm;
  });
}

/** Dosya adından 712x2050 ölçü çifti */
export function dimsFromFileName(fn) {
  const m = String(fn || "").match(/(\d{3,4})[xX](\d{3,4})/);
  if (!m) return null;
  return { genislik_mm: Number(m[1]), yukseklik_mm: Number(m[2]) };
}

export function extractCaglayanVariants(urun) {
  const all = [];
  for (const table of collectTables(urun)) {
    all.push(...parseDepthMatrix(table));
    all.push(...parseLengthHeightRows(table));
  }
  return dedupe(all);
}

export function variantSlugId(baseSlug, v) {
  const parts = [baseSlug];
  if (v.modelKod) parts.push(v.modelKod.replace(/[^\w]+/g, "-").toLowerCase());
  parts.push(`${v.genislik_mm}x${v.derinlik_mm || 0}x${v.yukseklik_mm}`);
  return parts.join("--").replace(/--+/g, "-").slice(0, 120);
}

export function variantDisplayName(baslik, v) {
  const base = String(baslik || "").trim();
  const kod = v.modelKod ? ` ${v.modelKod}` : "";
  const dim =
    v.derinlik_mm > 0
      ? `${v.genislik_mm}×${v.derinlik_mm}×${v.yukseklik_mm} mm`
      : `${v.genislik_mm}×${v.yukseklik_mm} mm`;
  return `${base}${kod} — ${dim}`;
}

export function variantModelNo(baslik, v) {
  const seri = String(baslik || "")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .join(" ");
  const kod = v.modelKod || "";
  return [seri, kod, `${v.genislik_mm}x${v.derinlik_mm || "-"}x${v.yukseklik_mm}`]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/** Varyanta uygun kesit / model çizimi (dosya adındaki ölçüye göre). */
export function matchKesitForVariant(relPaths, v) {
  const kesits = relPaths.filter((r) => /kesit/i.test(path.basename(r)));
  if (!kesits.length) return [];

  const exact = kesits.filter((r) => {
    const d = dimsFromFileName(path.basename(r));
    if (!d) return false;
    return d.genislik_mm === v.genislik_mm && d.yukseklik_mm === v.yukseklik_mm;
  });
  if (exact.length) return exact;

  const near = kesits.filter((r) => {
    const d = dimsFromFileName(path.basename(r));
    if (!d) return false;
    return (
      Math.abs(d.genislik_mm - v.genislik_mm) <= 50 &&
      Math.abs(d.yukseklik_mm - v.yukseklik_mm) <= 100
    );
  });
  if (near.length) return near;

  return kesits;
}

export function buildVariantImages(urun, gallery, v) {
  const slug = urun.slug || "";
  const all = gallery || [];
  const product = all.filter((r) => {
    const fn = path.basename(r).toLowerCase();
    return IMG_EXT.test(fn) && !/kesit/i.test(fn) && !/model-\d/i.test(fn);
  });
  const kesitAll = all.filter((r) => /kesit/i.test(path.basename(r)));
  const matched = matchKesitForVariant(all, v);
  const kesit = matched.length ? matched : kesitAll.slice(0, 2);
  const modelDraw = all.filter((r) => /model-\d/i.test(path.basename(r)));
  const out = [];
  const seen = new Set();
  const add = (r) => {
    const k = r.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(r);
  };
  for (const r of product.slice(0, 4)) add(r);
  for (const r of kesit) add(r);
  for (const r of modelDraw.slice(0, 2)) add(r);
  for (const r of product.slice(4)) add(r);
  for (const r of kesitAll) add(r);
  return out.slice(0, 11);
}
