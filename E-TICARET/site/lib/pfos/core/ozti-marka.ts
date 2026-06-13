import { isOztiKatalogMarka } from "./hazirlik-marka";
import { isOztiPisirmeSku } from "./atalay-marka";

/** PFOS buzdolabı / pişirme — teklif markası Öztiryakiler */
export const OZTI_MARKA = "Öztiryakiler";

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isOztiBuzdolabiSku(sku: string | null | undefined): boolean {
  return /^7919\.|^8919\.|^79e[34]\./i.test(String(sku ?? "").trim());
}

export function isOztiBuzdolabiRow(row: {
  sku?: string | null;
  marka_ad?: string | null;
  ad?: string | null;
}): boolean {
  const sku = String(row.sku ?? "");
  const ad = norm(`${row.ad ?? ""} ${row.sku ?? ""}`);
  if (!isOztiBuzdolabiSku(sku) && !isOztiKatalogMarka(row.marka_ad)) {
    return false;
  }
  return /buzdolab|donduruc|ntv|nmv|lts|lmv|soguk\s*servis|cihaz\s*alti|cihazalti|dik\s*tip|havuzlu|make\s*up|makeup|bar\s*sise|bar\s*şişe/i.test(
    ad,
  );
}

export function isOztiPisirmeRow(row: {
  sku?: string | null;
  marka_ad?: string | null;
  ad?: string | null;
  kategori?: string | null;
}): boolean {
  const sku = String(row.sku ?? "");
  if (!/^78\d{2}\./i.test(sku) && !isOztiKatalogMarka(row.marka_ad)) {
    return false;
  }
  const ad = norm(`${row.ad ?? ""} ${row.kategori ?? ""}`);
  if (/buzdolab|donduruc|davlumbaz|bulasik|bulaşık|yikama|tezgah|raf|dolap|vitrin|teshir/.test(ad)) {
    if (!/fritoz|fritöz|ocak|izgar|firin|fırın|salamander|makarna|wok|kuzine/.test(ad)) {
      return false;
    }
  }
  return isOztiPisirmeSku(sku) || (isOztiKatalogMarka(row.marka_ad) && /^78\d{2}\./.test(sku));
}
