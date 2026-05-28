/**

 * Çağlayan teknik tablolarından model varyantları (ölçü + model kodu)

 * ve varyant ↔ kesit / ölçü çizimi eşlemesi.

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

  return (/[A-Za-z]/.test(s) && /\d/.test(s)) || /^[A-Z]{2,4}(\s*\([^)]+\))?$/i.test(s);

}



function cleanModelKod(s) {

  return String(s || "")

    .trim()

    .replace(/\s+/g, " ");

}



function modelKodFromRow(row) {

  const codes = (row || []).map((c) => cleanModelKod(c)).filter((c) => isModelCode(c) && /\([^)]+\)/.test(c));

  if (codes.length) return codes[0];

  const loose = (row || []).find((c) => isModelCode(c));

  return cleanModelKod(loose || row?.[0] || "");

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



/** Tüm tablolardan derinlik (mm) listesi — kesit sırası için. */

export function extractDepthList(urun) {

  const depths = [];

  for (const table of collectTables(urun)) {

    const rows = table.satirlar || [];

    for (let i = 0; i < rows.length; i++) {

      if (!rows[i].some(isDepthHeader)) continue;

      const next = rows[i + 1] || [];

      for (const cell of next) {

        const n = parseMm(cell);

        if (n && n >= 600 && n <= 1500) depths.push(n);

      }

    }

  }

  return [...new Set(depths)];

}



/** Derinlik satırı + uzunluk/yükseklik matrisi (Fulya, Nergis, Nilüfer vb.) */

function parseDepthMatrix(table) {

  const rows = table.satirlar || [];

  let modelKod = "";

  let depthRowIdx = -1;



  for (let i = 0; i < rows.length; i++) {

    if (rows[i].some(isDepthHeader)) {

      modelKod = modelKodFromRow(rows[i]);

      depthRowIdx = i;

      break;

    }

  }

  if (depthRowIdx < 0) return [];



  const depths = (rows[depthRowIdx + 1] || []).map(parseMm).filter(Boolean);

  if (!depths.length) return [];



  const variants = [];

  let carryLength = 0;



  for (let i = depthRowIdx + 2; i < rows.length; i++) {

    const row = rows[i];

    if (row.some(isDepthHeader)) break;

    const nums = row.map(parseMm).filter((n) => n != null);

    if (!nums.length) continue;



    let g = 0;

    let y = 0;



    if (nums.length === 1 && nums[0] >= 800 && nums[0] <= 2800 && carryLength) {

      g = carryLength;

      y = nums[0];

    } else {

      let idx = 0;

      if (nums[idx] >= 600 && nums[idx] <= 3500) {

        g = nums[idx++];

        carryLength = g;

      }

      if (nums[idx] >= 800 && nums[idx] <= 2800) {

        y = nums[idx++];

      }

    }



    if (!g || !y) continue;



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

      modelKod = modelKodFromRow(row);

      continue;

    }

    const nums = row.map(parseMm).filter(Boolean);

    if (nums.length >= 2) {

      variants.push({

        modelKod,

        genislik_mm: nums[0],

        derinlik_mm: nums[1] >= 600 && nums[1] <= 1500 ? nums[1] : 0,

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

  return { a_mm: Number(m[1]), b_mm: Number(m[2]) };

}



function kesitNumberFromPath(rel) {

  const m = path.basename(rel).match(/kesit-?(\d{1,2})/i);

  return m ? Number(m[1]) : -1;

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



/** Equsto katalog adı: Çağlayan seri adının başına EQ- */
export function eqBrandName(baslik) {
  const base = String(baslik || "").trim();
  if (!base) return "EQ-Ürün";
  if (/^EQ-/i.test(base)) return base;
  return "EQ-" + base;
}

export function eqVariantCode(eqNo) {
  return "EQ" + String(eqNo);
}

export function sortVariantsByOlculer(variants) {
  return variants.slice().sort((a, b) => {
    if (a.genislik_mm !== b.genislik_mm) return a.genislik_mm - b.genislik_mm;
    if ((a.derinlik_mm || 0) !== (b.derinlik_mm || 0)) {
      return (a.derinlik_mm || 0) - (b.derinlik_mm || 0);
    }
    return a.yukseklik_mm - b.yukseklik_mm;
  });
}

export function variantDisplayName(baslik, v, eqNo) {
  const brand = eqBrandName(baslik);
  const eq = eqNo != null ? " " + eqVariantCode(eqNo) : "";
  const kod = v.modelKod ? ` · ${v.modelKod}` : "";
  const dim =
    v.derinlik_mm > 0
      ? `${v.genislik_mm}×${v.derinlik_mm}×${v.yukseklik_mm} mm`
      : `${v.genislik_mm}×${v.yukseklik_mm} mm`;
  return `${brand}${eq}${kod} — ${dim}`;
}

export function variantModelNo(baslik, _v, eqNo) {
  const brand = eqBrandName(baslik);
  return eqNo != null ? `${brand} ${eqVariantCode(eqNo)}` : brand;
}

export function eqSku(baslik, eqNo) {
  const compact = eqBrandName(baslik)
    .replace(/^EQ-/i, "")
    .replace(/[^\w\u00C0-\u024F]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
  return `EQ-${compact}-${eqVariantCode(eqNo)}`.slice(0, 56);
}



/** Varyanta uygun model ölçü çizimi (derinlik×yükseklik veya uzunluk×yükseklik). */

export function matchModelDrawForVariant(relPaths, v) {

  const draws = relPaths.filter((r) => /model-\d/i.test(path.basename(r)));

  if (!draws.length) return null;



  const matchPair = (a, b) => {

    if (v.derinlik_mm > 0) return a === v.derinlik_mm && b === v.yukseklik_mm;

    return a === v.genislik_mm && b === v.yukseklik_mm;

  };



  const exact = draws.find((r) => {

    const d = dimsFromFileName(path.basename(r));

    return d && matchPair(d.a_mm, d.b_mm);

  });

  if (exact) return exact;



  const near = draws.find((r) => {

    const d = dimsFromFileName(path.basename(r));

    if (!d) return false;

    if (v.derinlik_mm > 0) {

      return (

        Math.abs(d.a_mm - v.derinlik_mm) <= 50 && Math.abs(d.b_mm - v.yukseklik_mm) <= 100

      );

    }

    return (

      Math.abs(d.a_mm - v.genislik_mm) <= 50 && Math.abs(d.b_mm - v.yukseklik_mm) <= 100

    );

  });

  return near || null;

}



/** Varyanta uygun kesit (numaralı sıra veya dosya adındaki ölçü). */

export function matchKesitForVariant(relPaths, v, depths = []) {

  const kesits = relPaths.filter((r) => /kesit/i.test(path.basename(r)));

  if (!kesits.length) return [];



  const sorted = kesits.slice().sort((a, b) => kesitNumberFromPath(a) - kesitNumberFromPath(b));

  const depthList = depths?.length ? depths : [];



  if (depthList.length && v.derinlik_mm > 0) {

    const di = depthList.indexOf(v.derinlik_mm);

    if (di >= 0) {

      const nDepth = depthList.length;

      let band = 0;

      if (sorted.length >= nDepth * 2) {

        band = v.yukseklik_mm >= 2150 ? 1 : 0;

      }

      const idx = band * nDepth + di;

      if (sorted[idx]) return [sorted[idx]];

      const targetNum = idx + 1;

      const byNum = sorted.filter((r) => kesitNumberFromPath(r) === targetNum);

      if (byNum.length) return byNum;

    }

  }



  const exact = kesits.filter((r) => {

    const d = dimsFromFileName(path.basename(r));

    if (!d) return false;

    if (v.derinlik_mm > 0) {

      return d.a_mm === v.derinlik_mm && d.b_mm === v.yukseklik_mm;

    }

    return d.a_mm === v.genislik_mm && d.b_mm === v.yukseklik_mm;

  });

  if (exact.length) return exact;



  return sorted.length ? [sorted[0]] : [];

}



/** Varyant için tek kesit + tek model çizimi. */

export function resolveVariantTeknik(gallery, v, depths = []) {

  const kesit = matchKesitForVariant(gallery, v, depths)[0] || null;

  const modelCizim = matchModelDrawForVariant(gallery, v) || null;

  return { kesit, modelCizim };

}



export function buildVariantImages(urun, gallery, v, depths = []) {

  const all = gallery || [];

  const product = all.filter((r) => {

    const fn = path.basename(r).toLowerCase();

    return IMG_EXT.test(fn) && !/kesit/i.test(fn) && !/model-\d/i.test(fn);

  });

  const { kesit, modelCizim } = resolveVariantTeknik(all, v, depths);

  const out = [];

  const seen = new Set();

  const add = (r) => {

    if (!r) return;

    const k = r.toLowerCase();

    if (seen.has(k)) return;

    seen.add(k);

    out.push(r);

  };

  for (const r of product.slice(0, 4)) add(r);

  add(kesit);

  add(modelCizim);

  for (const r of product.slice(4)) add(r);

  return out.slice(0, 11);

}


