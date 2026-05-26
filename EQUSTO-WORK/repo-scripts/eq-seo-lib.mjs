/**
 * Equsto SEO — slug ve kategori eşlemesi (product.html ile uyumlu).
 */
export function slugifyEq(s) {
  const tr = {
    ğ: "g", ü: "u", ş: "s", ı: "i", ö: "o", ç: "c", â: "a", î: "i", û: "u",
    Ğ: "g", Ü: "u", Ş: "s", İ: "i", Ö: "o", Ç: "c", Â: "a", Î: "i", Û: "u",
  };
  return String(s || "")
    .toLowerCase()
    .replace(/[ğüşıöçâîûĞÜŞİÖÇÂÎÛ]/g, (c) => tr[c] || c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export function categoryToDeptSeg(cat) {
  const c = String(cat || "").toLowerCase();
  if (c === "sogutma-ekipmanlari" || c === "icecek-berrak-buz-makineleri") return "sogutma";
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
  if (c === "bulasik-makineleri") return "yikama";
  if (c === "hamur-hazirlik-makineleri" || c === "et-hazirlik-makineleri") return "hazirlik";
  if (
    c === "cay-kazanlari-cay-makineleri-cay-otomatlari" ||
    c === "yiyecek-ve-icecek-otomatlari-" ||
    c === "cikolata-temperleme-makinesi-"
  ) {
    return "icecek";
  }
  return null;
}

export function productSlug(brand, name) {
  const b = slugifyEq(brand);
  const n = slugifyEq(name);
  return (b ? b + "-" : "") + n;
}

export function productPath(deptSeg, slug) {
  return `/shop/${deptSeg}/${slug}`;
}

export const ORIGIN = "https://equsto.com";
export const LASTMOD = new Date().toISOString().slice(0, 10);
