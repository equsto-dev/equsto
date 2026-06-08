import { resolveTipKodu } from "./tip-kodu";

/** PFOS pişirme hattı — teklif markası Atalay */
export const ATALAY_MARKA = "Atalay";

export const PISIRME_TIP_KODLARI = new Set([
  "fritoz_tek",
  "char_broil",
  "salamander",
  "ocak_4gz",
  "komurlu_izgara",
  "raf_firin",
  "tas_tabanli_firin",
  "kombi_firin_6t",
  "mikrodalga_firin",
]);

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Referans adı — pişirme ekipmanı (soğutma / hazırlık / bulaşık hariç) */
export function isPisirmeReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (!n) return false;
  if (/buzdolab|donduruc|sogutuc|soğutuc|bulasik|bulaşık|yikama|vakum|davlumbaz|teshir|teşhir|vitrin|reyon/.test(n)) {
    return false;
  }
  if (/yer\s*izgar|yer\s*ızgar/.test(n)) return false;
  if (/kahve|espresso|filtre\s*kahve|degirmen|değirmen/.test(n)) return false;
  if (/kiyma|kıyma|kemik\s*testere|dilimleme|hamur\s*yogur|hamur\s*acma|patates\s*soy|meyve\s*sik/.test(n)) {
    return false;
  }
  return (
    /fritoz|fritöz|izgar|ocak|kuzine|salamander|firin|fırın|konveksiyon|combi|kombi/.test(n) ||
    /patates\s*dinlendir|scuttle|wok|benmari|benmari|döner\s*ocak|doner\s*ocak|makarna\s*pisir|makarna\s*pişir/.test(n) ||
    /plate\s*izgar|char\s*broil|lavash|dokum\s*izgar|döküm\s*ızgara|tost\s*mak|waffle|krep/.test(n) ||
    /pizza\s*firin|pizza\s*fırın|combi\s*firin|kombili\s*firin/.test(n) ||
    (/komurlu|kömürlü/.test(n) && /izgar/.test(n))
  );
}

export function isPisirmeTipKodu(tip: string | null | undefined): boolean {
  return PISIRME_TIP_KODLARI.has(resolveTipKodu(String(tip ?? "").trim()));
}

export function isAtalayPisirmePfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isPisirmeTipKodu(opts.urunTipi)) return true;
  return isPisirmeReferansIsim(opts.isim);
}

export function isAtalayKatalogMarka(marka: string | null | undefined): boolean {
  return norm(String(marka ?? "")).includes("atalay");
}

export function isAtalayPisirmeRow(row: {
  sku?: string | null;
  marka_ad?: string | null;
  ad?: string | null;
  kategori?: string | null;
}): boolean {
  if (isAtalayKatalogMarka(row.marka_ad)) return true;
  const sku = String(row.sku ?? "").toUpperCase();
  return /^(AEF|EAEF|EAEI|EAGI|EAAIE|EALI|EAEO|EAEK|EAWO|APD|ASFE|EASFE|EASFG|EAEF)-/i.test(sku);
}

export function isOztiPisirmeSku(sku: string | null | undefined): boolean {
  return /^78[0-9]{2}\./i.test(String(sku ?? "").trim());
}

export function isPisirmeDisMarka(marka: string | null | undefined): boolean {
  const n = norm(String(marka ?? ""));
  return (
    n.includes("oztiryakiler") ||
    n.includes("ozti") ||
    n.includes("electrolux") ||
    n.includes("rational") ||
    n.includes("unox") ||
    n.includes("inoksan") ||
    n.includes("pimak") ||
    n.includes("fagor")
  );
}
