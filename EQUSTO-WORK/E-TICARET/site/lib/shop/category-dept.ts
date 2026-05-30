/** Katalog `category` → /shop/{dept} segmenti (eq-site-urls.js ile uyumlu). */
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
  if (dept === "market-reyon") return "market-reyonlari";
  if (dept) return dept;
  return categoryToShopDept(String(row.category || ""));
}
