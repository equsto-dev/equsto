/**
 * Çağlayan PDP galerisi: 6 ürün + kesit(ler) + detay/ölçü → en fazla 11 küçük görsel.
 */
import path from "node:path";

export const GALLERY_MAX = 11;
export const PRODUCT_MAX = 6;
export const DETAIL_MAX = 3;

const IMG_EXT = /\.(webp|jpe?g|png|gif)$/i;

function fileName(u) {
  const s = String(u || "").replace(/\\\//g, "/");
  return path.basename(s.split("?")[0]).toLowerCase();
}

function isJunk(fn) {
  return (
    !fn ||
    fn.endsWith(".pdf") ||
    /^(circle-bg|pdf-icon)\b/i.test(fn) ||
    /^(meat|meat-2|chicken|cheese|olive|delicatessen|dairy)(-\d+)?\.webp$/i.test(fn)
  );
}

function isKesit(fn) {
  return /kesit/i.test(fn);
}

function isOlcu(fn) {
  return /model-\d|fg-|lm-|hd-|sl_ml|sl-ml/i.test(fn) && !isKesit(fn);
}

function isDetay(fn, slug) {
  if (
    !/bicaklik|terazilik|sepetlik|posetlik|modul-bolucu|urun-bolucu|plexi|kademeli|et-aydinlatma|aydinlatma|bankolu|kose|ic-kose|dis-kose|zyt/i.test(
      fn
    )
  ) {
    return false;
  }
  return matchesSlug(fn, slug);
}

function isKapak(fn) {
  return /kapak/i.test(fn);
}

function matchesSlug(fn, slug) {
  const rawSlug = String(slug || "").toLowerCase();
  const f = String(fn || "").toLowerCase();
  const fCompact = f.replace(/[^a-z0-9]/g, "");
  const sCompact = rawSlug.replace(/[^a-z0-9]/g, "");
  if (!sCompact || sCompact.length < 3) return true;
  if (fCompact.includes(sCompact)) return true;
  const tokens = rawSlug.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
  const main = tokens[0];
  if (main && main.length >= 4 && f.includes(main)) return true;
  const sig = tokens.filter((t) => t.length >= 2 && !/^(hf|nv|en|tr|sky)$/i.test(t));
  if (sig.length >= 2) {
    const hit = sig.filter((t) => fCompact.includes(t)).length;
    if (hit >= 2) return true;
  }
  return tokens.some((t) => t.length >= 3 && f.includes(t));
}

/** Ürün vitrin fotoğrafı — başka serinin aksesuar/kapak görsellerini ele */
function isProductPhoto(fn, slug) {
  if (isJunk(fn) || isKesit(fn) || isOlcu(fn) || isDetay(fn) || isKapak(fn)) return false;
  if (!IMG_EXT.test(fn)) return false;
  if (!matchesSlug(fn, slug)) return false;
  return true;
}

function collectRawEntries(urun) {
  const out = [];
  const push = (url, dosya) => {
    const u = url || "";
    const d = dosya || "";
    if (u || d) out.push({ url: u, dosya: d, fn: fileName(d || u) });
  };

  if (urun.kapak) push(urun.kapak, urun.kapakYol);
  const g = urun.gorseller || {};
  for (const key of ["urun", "teknikCizim", "tum"]) {
    for (const item of g[key] || []) {
      if (typeof item === "string") push(item, "");
      else push(item.url, item.dosya);
    }
  }

  const tek = urun.teknik || {};
  for (const sek of tek.sekmeler || []) {
    for (const u of sek.gorseller || []) {
      if (typeof u === "string") push(u, "");
    }
  }
  for (const acc of tek.akordeon || []) {
    for (const sek of acc.sekmeler || []) {
      const baslik = String(sek.baslik || "").toLowerCase();
      for (const u of sek.gorseller || []) {
        if (typeof u === "string") push(u, "");
      }
    }
  }

  return out;
}

/**
 * @param {object} urun PFOS urun JSON
 * @param {(entry: {url:string,dosya:string,fn:string}) => string|null} mapEntry
 */
export function buildCaglayanGallery(urun, mapEntry) {
  const entries = collectRawEntries(urun);
  const slug = urun.slug || "";

  const urunImgs = [];
  const kesitImgs = [];
  const detayImgs = [];
  const olcuImgs = [];
  const seen = new Set();

  const add = (bucket, entry) => {
    const rel = mapEntry(entry);
    if (!rel) return;
    const key = rel.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    bucket.push(rel);
  };

  for (const entry of entries) {
    const fn = entry.fn;
    if (!IMG_EXT.test(fn)) continue;
    if (isKesit(fn) && matchesSlug(fn, slug)) add(kesitImgs, entry);
    else if (isDetay(fn, slug)) add(detayImgs, entry);
    else if (isOlcu(fn) && matchesSlug(fn, slug)) add(olcuImgs, entry);
    else if (isProductPhoto(fn, slug)) add(urunImgs, entry);
  }

  const product = [];
  const g = urun.gorseller || {};
  for (const item of g.urun || []) {
    const entry = {
      url: item.url,
      dosya: item.dosya,
      fn: fileName(item.dosya || item.url),
    };
    if (!isProductPhoto(entry.fn, slug)) continue;
    const rel = mapEntry(entry);
    if (!rel || seen.has(rel.toLowerCase())) continue;
    seen.add(rel.toLowerCase());
    product.push(rel);
    if (product.length >= PRODUCT_MAX) break;
  }
  for (const rel of urunImgs) {
    if (product.length >= PRODUCT_MAX) break;
    if (!product.includes(rel)) product.push(rel);
  }

  let gallery = [...product];

  let slots = GALLERY_MAX - gallery.length;
  const detayWant = Math.min(DETAIL_MAX, detayImgs.length);
  const kesitWant = Math.min(kesitImgs.length, Math.max(0, slots - detayWant));
  gallery = gallery.concat(kesitImgs.slice(0, kesitWant));

  slots = GALLERY_MAX - gallery.length;
  gallery = gallery.concat(detayImgs.slice(0, Math.min(detayImgs.length, slots)));

  slots = GALLERY_MAX - gallery.length;
  gallery = gallery.concat(olcuImgs.slice(0, slots));

  slots = GALLERY_MAX - gallery.length;
  if (slots > 0) {
    for (const rel of kesitImgs.slice(kesitWant)) {
      if (slots <= 0) break;
      if (!gallery.includes(rel)) {
        gallery.push(rel);
        slots--;
      }
    }
  }

  return gallery.slice(0, GALLERY_MAX);
}

/** Uzak URL listesi (patch / canlı) */
export function buildCaglayanGalleryRemote(urun) {
  return buildCaglayanGallery(urun, (entry) => {
    const u = String(entry.url || "").replace(/\\\//g, "/").trim();
    if (u.startsWith("http")) return u;
    return null;
  });
}

/** Yerel public yolu */
export function buildCaglayanGalleryLocal(urun) {
  return buildCaglayanGallery(urun, (entry) => {
    let rel = entry.dosya || entry.url || "";
    rel = String(rel).replace(/\\\//g, "/").replace(/^gorseller\//, "");
    if (!rel || !IMG_EXT.test(rel)) return null;
    return `caglayan-market/${urun.slug}/${path.basename(rel)}`;
  });
}
