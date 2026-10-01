/** Geçerli ürün fotoğu (GMC/PDP) — svg/pdf/kesit hariç */

const PHOTO_EXT = /\.(jpe?g|png|webp|gif)(\?|#|$)/i;
const TECH = /kesit|wireframe|placeholder|model-\d+\.|\.svg(\?|#|$)|\.pdf(\?|#|$)/i;

export function isValidProductPhoto(raw) {
  const s = String(raw || "").trim();
  if (!s) return false;
  if (!PHOTO_EXT.test(s)) return false;
  if (TECH.test(s)) return false;
  return true;
}

export function collectValidPhotos(images) {
  if (!Array.isArray(images)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of images) {
    if (!isValidProductPhoto(raw)) continue;
    const key = String(raw).toLowerCase().split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(String(raw).trim());
  }
  return out;
}

export function normalizeRel(raw) {
  return String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}
