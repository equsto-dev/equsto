/**
 * Proso katalog PDF metninden model kodları ve ölçü varyantları.
 * Çağlayan import ile uyumlu: genislik_mm (uzunluk), derinlik_mm, yukseklik_mm.
 */

const LENGTH_HDR = /Length\s*\/\s*Uzunluk/i;
const MODEL_LINE_RE =
  /\b([A-Z][A-Z0-9]+(?:\s+V\d+)?)\s+((?:DP|MT|FV|SLD|PLG|FG|WFG|IFG|CG|HP|PN|PR|BR|BM|BA|SB|SP|TK|DG|LG|PG|SG|CC|MAX|RETRO|DK)(?:\s+[A-Z]{2,4})?\/[\d\w]+(?:\/[\d\-]+)+)/gi;

function toMm(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 40 || v > 5000) return null;
  return v >= 400 ? v : v * 10;
}

export function parseProsoLengths(text) {
  const m = text.match(LENGTH_HDR);
  if (!m) return [];
  const idx = m.index ?? text.search(LENGTH_HDR);
  const chunk = text.slice(idx, idx + 500);
  const nums = [];
  for (const hit of chunk.matchAll(/\b(1[0-9]{3}|2[0-9]{3}|3[0-9]{3}|4[0-9]{3})\b/g)) {
    const n = Number(hit[1]);
    if (n >= 1200 && n <= 4500) nums.push(n);
  }
  const out = [];
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 8) break;
  }
  return out;
}

export function parseProsoModelLines(text, baslik = "") {
  const root = String(baslik || "")
    .trim()
    .split(/\s+/)[0]
    ?.toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const found = [];
  const seen = new Set();
  for (const m of text.matchAll(MODEL_LINE_RE)) {
    const line = `${m[1].trim()} ${m[2].trim()}`.replace(/\s+/g, " ");
    const key = line.toUpperCase();
    if (seen.has(key)) continue;
    if (root && !key.startsWith(root) && !key.includes(root)) continue;
    seen.add(key);
    found.push(line);
  }
  return found;
}

/** "DP/110/180-170-160-150" veya "V2/110/220-205" */
function expandSlashTail(tail) {
  const segs = tail.split("/").filter(Boolean);
  if (!segs.length) return { type: "", tiers: [], depths: [], heights: [] };
  const type = segs[0];
  const tiers = [];
  const depths = [];
  const heights = [];
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    if (/^\d{2,3}(?:-\d{2,3})+$/.test(s)) {
      const raw = s.split("-").map(Number).filter(Number.isFinite);
      const nums = raw.map(toMm).filter(Boolean);
      if (raw.length >= 3) depths.push(...nums);
      else if (raw.length === 2 && raw.every((n) => n >= 200 && n <= 260)) heights.push(...nums);
      else depths.push(...nums);
    } else if (/^\d{2,3}$/.test(s)) {
      tiers.push(s);
    }
  }
  return { type, tiers, depths, heights };
}

export function expandProsoModelLine(line) {
  const m = line.match(/^([A-Z][A-Z0-9]+(?:\s+V\d+)?)\s+(.+)$/i);
  if (!m) return [];
  const brand = m[1].trim();
  const tail = m[2].trim();
  const { type, tiers, depths, heights } = expandSlashTail(tail);
  const tier = tiers[0] || "";
  const baseKod = tier ? `${brand} ${type}/${tier}` : `${brand} ${type}`;
  const depthList = [...new Set(depths)];
  const heightList = [...new Set(heights)];
  const out = [];

  if (depthList.length && heightList.length) {
    for (const d of depthList) {
      for (const y of heightList) {
        out.push({ modelKod: baseKod, derinlik_mm: d, yukseklik_mm: y });
      }
    }
  } else if (depthList.length) {
    for (const d of depthList) {
      out.push({ modelKod: baseKod, derinlik_mm: d, yukseklik_mm: 0 });
    }
  } else if (heightList.length) {
    for (const y of heightList) {
      out.push({ modelKod: baseKod, derinlik_mm: 0, yukseklik_mm: y });
    }
  } else {
    out.push({ modelKod: line.trim(), derinlik_mm: 0, yukseklik_mm: 0 });
  }
  return out;
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
    return v.modelKod && (v.genislik_mm || v.derinlik_mm || v.yukseklik_mm);
  });
}

/**
 * @param {string} text PDF düz metin
 * @param {string} baslik Ürün adı (Falcon, Lion, …)
 */
export function extractProsoPdfVariants(text, baslik = "") {
  const lengths = parseProsoLengths(text);
  const lines = parseProsoModelLines(text, baslik);
  const base = [];
  for (const line of lines) {
    base.push(...expandProsoModelLine(line));
  }
  if (!base.length) return [];

  const variants = [];
  const lenList = lengths.length ? lengths : [0];
  for (const g of lenList) {
    for (const b of base) {
      variants.push({
        modelKod: b.modelKod,
        genislik_mm: g || 0,
        derinlik_mm: b.derinlik_mm || 0,
        yukseklik_mm: b.yukseklik_mm || 0,
      });
    }
  }
  return dedupe(variants);
}
