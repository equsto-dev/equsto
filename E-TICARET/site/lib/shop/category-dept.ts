/** Katalog `category` → /shop/{dept} segmenti (eq-site-urls.js ile uyumlu). */

/**
 * /shop/dolap → /shop/tezgah (next.config kalıcı yönlendirme).
 * Katalogda hâlâ dept=dolap olan ürünler URL'de tezgah altında yaşar.
 */
export function canonicalShopDept(dept: string | null | undefined): string | null {
  const d = String(dept || "")
    .trim()
    .toLowerCase();
  if (!d) return null;
  if (d === "dolap") return "tezgah";
  if (d === "market-reyon") return "market-reyonlari";
  return d;
}

export function categoryToShopDept(category: string): string | null {
  const c = String(category || "").toLowerCase().trim();
  if (!c) return null;
  if (c === "sogutma-ekipmanlari") return "sogutma";
  if (c === "market-reyonlari") return "market-reyonlari";
  if (c === "gastronom-kuvetler") return "kuvetler";
  const pisirme = [
    "sanayi-ocaklari",
    "sanayi-tipi-izgaralar",
    "kuzineler",
    "fritozler",
    "doner-ocaklari-",
    "tost-makineleri",
    "pilic-cevirme-makineleri",
    "ocakbasi-izgara",
  ];
  if (pisirme.includes(c)) return "pisirme";
  if (c === "kahve-makineleri") return "kahve";
  if (c === "bulasik-makineleri" || c === "yikama-ekipmanlari") return "yikama";
  if (c === "hamur-hazirlik-makineleri" || c === "et-hazirlik-makineleri") return "hazirlik";
  if (
    c === "cay-kazanlari-cay-makineleri-cay-otomatlari" ||
    c === "yiyecek-ve-icecek-otomatlari-" ||
    c === "cikolata-temperleme-makinesi-" ||
    c === "icecek-berrak-buz-makineleri"
  ) {
    return "icecek";
  }
  return null;
}

export function resolveShopDept(row: Record<string, unknown>): string | null {
  const dept = String(row.dept || "").trim().toLowerCase();
  if (dept) return canonicalShopDept(dept);
  return canonicalShopDept(categoryToShopDept(String(row.category || "")));
}
