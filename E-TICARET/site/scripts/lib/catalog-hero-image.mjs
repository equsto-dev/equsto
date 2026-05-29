import path from "node:path";

/** PLP / kart — kesit ve model çizimi ön plana alınmaz. */
export function isTechnicalCatalogImage(relOrUrl) {
  const fn = path.basename(String(relOrUrl || "")).toLowerCase();
  if (!fn) return false;
  if (/kesit/i.test(fn)) return true;
  if (/[-_]model-\d+\.(jpe?g|webp|png|gif)$/i.test(fn)) return true;
  if (/\d{3,4}[-_]model-\d/i.test(fn)) return true;
  return false;
}

export function pickCatalogHeroImage(images) {
  const list = Array.isArray(images) ? images : [];
  if (!list.length) return "";

  const kapak = list.find((r) => /kapak/i.test(path.basename(String(r))));
  if (kapak && !isTechnicalCatalogImage(kapak)) return kapak;

  for (const rel of list) {
    if (!isTechnicalCatalogImage(rel)) return rel;
  }
  return list[0];
}

/** Galeri sırası: ürün fotoğrafları önce, kesit/ölçü çizimi sonda. */
export function sortCatalogImages(images) {
  const list = Array.isArray(images) ? images : [];
  const hero = [];
  const tech = [];
  for (const rel of list) {
    if (isTechnicalCatalogImage(rel)) tech.push(rel);
    else hero.push(rel);
  }
  return [...hero, ...tech];
}
