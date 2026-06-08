import { resolveTipKodu } from "./tip-kodu";

/** PFOS buzdolabı / soğutma dolabı — teklif markası Portabianco */
export const PORTABIANCO_MARKA = "Portabianco";

export const BUZDOLABI_TIP_KODLARI = new Set([
  "tezgah_tip_buzdolabi",
  "tezgah_alti_buz_cek",
  "dik_tip_buzdolabi",
  "bar_buzdolabi",
  "setalti_buzdolabi",
  "setalti_derin_dondurucu",
  "sogutma_tezgah",
  "sise_sogutucu_2k",
  "sise_sogutucu_3k",
  "derin_dondurucu_dik",
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

/** Referans adı — buzdolabı / derin dondurucu / bar soğutucu (buz makinesi vb. hariç) */
export function isBuzdolabiReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (!n) return false;
  if (/buz\s*makin|ice\s*maker|buz\s*uret|kar\s*buz/.test(n)) return false;
  if (/make.?up|makeup|makyaj/.test(n)) return false;
  if (/istif\s*raf|buzdolab.*raf|malzeme\s*dolab/.test(n)) return false;
  if (/teshir\s*dolab|teşhir\s*dolab|vitrin/.test(n) && !/buzdolab/.test(n)) return false;
  if (/bulasik|bulaşık|yikama|bardak\s*yik/.test(n)) return false;
  return (
    /buzdolab|donduruc|derin\s*dondur|sogutuc|soğutuc|sishe\s*sogut|şişe\s*soğut|icecek\s*sogut|içecek\s*soğut|bar\s*sogut|saladette|pizza\s*prep|sogutmali\s*tezgah|soğutmali\s*tezgah|hazirlik\s*buzdolab|hazırlık\s*buzdolab/.test(
      n,
    )
  );
}

export function isBuzdolabiTipKodu(tip: string | null | undefined): boolean {
  return BUZDOLABI_TIP_KODLARI.has(resolveTipKodu(String(tip ?? "").trim()));
}

export function isBuzdolabiPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isBuzdolabiTipKodu(opts.urunTipi)) return true;
  return isBuzdolabiReferansIsim(opts.isim);
}

export function isPortabiancoKatalogMarka(marka: string | null | undefined): boolean {
  return norm(String(marka ?? "")).includes("portabianco");
}

export function isPortabiancoBuzdolabiRow(row: {
  sku?: string | null;
  marka_ad?: string | null;
  ad?: string | null;
}): boolean {
  const blob = norm(`${row.marka_ad ?? ""} ${row.ad ?? ""} ${row.sku ?? ""}`);
  if (isPortabiancoKatalogMarka(row.marka_ad)) return true;
  if (/^TT-|^TTK-|^TTR-|^CA-|^DT-|^BAR-|^PZA-|^PZAC-|^TTC-|^TTG-|^TTS-|^TTM-|^TTX-|^TTK-/i.test(String(row.sku ?? ""))) {
    return blob.includes("portabianco") || /buzdolab|donduruc|sogutuc|soğutuc|bar\s*sise|bar\s*şişe/i.test(blob);
  }
  return false;
}

export function isBuzdolabiDisMarka(marka: string | null | undefined): boolean {
  const n = norm(String(marka ?? ""));
  return (
    n.includes("electrolux") ||
    n.includes("oztiryakiler") ||
    n.includes("ozti") ||
    n.includes("equsto") ||
    n.includes("hoshizaki") ||
    n.includes("brema") ||
    n.includes("rational") ||
    n.includes("fagor")
  );
}
