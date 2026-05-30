/** Eski Meilisearch indeksi — Türkçe harfler silinerek üretilmiş slug. */
export function legacyMeiliPathSlug(row: Record<string, unknown>): string {
  function slugify(s: string) {
    return String(s || "")
      .toLocaleLowerCase("tr")
      .replace(/[/\\]+/g, "-")
      .replace(/[^a-z0-9+\-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  }
  const b = slugify(String(row.brand || ""));
  const n = slugify(String(row.name || ""));
  return (b ? `${b}-` : "") + n;
}

/** Vitrin PDP slug — katalog `id` öncelikli; yoksa marka+ad slug. */
export function foldTr(s: string) {
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

export function slugifyCatalogPart(s: string) {
  return foldTr(s)
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-z0-9+\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/** Ürün kodu → URL parçası: 9580.APPIA.3V → 9580-appia-3v */
export function skuPathSlug(sku: string): string {
  return foldTr(String(sku || "").trim())
    .replace(/\./g, "-")
    .replace(/[^a-z0-9+\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

/** Vitrin PDP slug — stok kodu öncelikli (marka öneki yok). */
export function catalogUrlSlug(row: Record<string, unknown>): string {
  const sku = String(row.sku || row.model || row.urun_kodu || row.stok_no || "").trim();
  if (sku) {
    const fromSku = skuPathSlug(sku);
    if (fromSku) return fromSku;
  }
  const id = String(row.id || "").trim();
  if (id) {
    const tail = id.includes("__") ? id.split("__").pop() || "" : "";
    if (tail) return tail.toLowerCase();
    return id.toLowerCase();
  }
  const b = slugifyCatalogPart(String(row.brand || ""));
  const n = slugifyCatalogPart(String(row.name || ""));
  return (b ? `${b}-` : "") + n;
}

/** Örn. 79E4.27NMV.00 → 79e4-27nmv-00 */
export function extractProductCodeTail(text: string): string {
  const m = String(text || "").match(
    /([0-9]{2,}[A-Za-z][0-9][\w.-]*\.[\w.]+)(?:\s*)$/i,
  );
  if (!m) return "";
  return m[1].toLowerCase().replace(/\./g, "-");
}

export function matchCatalogRowByPathSlug(
  row: Record<string, unknown>,
  pathSlug: string,
): boolean {
  const ps = String(pathSlug || "").toLowerCase().replace(/_/g, "-");
  if (!ps) return false;

  const skuSl = skuPathSlug(
    String(row.sku || row.model || row.urun_kodu || row.stok_no || ""),
  );
  if (skuSl && skuSl === ps) return true;

  const id = String(row.id || "").trim().toLowerCase();
  if (id) {
    if (id === ps) return true;
    const idDash = id.replace(/__/g, "-");
    if (idDash === ps || ps.endsWith("-" + idDash) || ps.endsWith(idDash)) {
      return true;
    }
    const tail = id.includes("__") ? id.split("__").pop() || "" : "";
    if (tail && (ps.endsWith(tail) || ps.endsWith(tail.replace(/__/g, "-")))) {
      return true;
    }
  }

  if (catalogUrlSlug(row) === ps) return true;

  const legacy = legacyMeiliPathSlug(row);
  if (legacy && legacy === ps) return true;

  const code = extractProductCodeTail(ps);
  if (code && id && id.endsWith("__" + code)) return true;

  const specs = String(row.specs || row.aciklama || "");
  const name = String(row.name || "");
  if (code && foldTr(specs + " " + name).includes(code.replace(/-/g, ""))) {
    return true;
  }

  return false;
}
