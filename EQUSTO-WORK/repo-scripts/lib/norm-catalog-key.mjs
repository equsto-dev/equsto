/** Kariyer index + katalog eşlemesi (fetch_kariyer_images.py ile uyumlu). */
export function normCatalogKey(raw) {
  return String(raw || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "");
}
