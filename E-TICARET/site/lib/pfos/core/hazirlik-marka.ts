import { resolveTipKodu } from "./tip-kodu";

/** PFOS hazırlık makineleri — teklif markası her zaman Boğaziçi (Equsto bayi). */
export const HAZIRLIK_MARKA = "Boğaziçi";

/** tip_kodu — hazırlık makinesi; tezgah/evye/dolap hariç */
export const HAZIRLIK_TIP_KODLARI = new Set([
  "kiyma_makinesi",
  "kemik_testere",
  "dilimleme_makinesi",
  "spiral_hamur",
  "hamur_acma",
  "patates_soyma",
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

/** Referans / şablon adından hazırlık tip_kodu (yoksa null) */
const HAZIRLIK_ISIM_KALIP: Array<{ tip: string; test: RegExp }> = [
  {
    tip: "kiyma_makinesi",
    test: /(?:^|\s)(?:et\s*)?(?:k[iı]yma|kiyma)(?:\s*makin|\s*makine|\s*mincer|\s*grinder|$)/,
  },
  { tip: "kemik_testere", test: /kemik\s*testere/ },
  {
    tip: "dilimleme_makinesi",
    test: /dilimleme\s*mak|gida\s*dilim|gıda\s*dilim|ekmek\s*dilim/,
  },
  {
    tip: "spiral_hamur",
    test: /hamur\s*yogur|hamur\s*yoğur|spiral\s*mikser|planet\s*mikser|planet\s*hamur/,
  },
  { tip: "hamur_acma", test: /hamur\s*acma|hamur\s*açma/ },
  { tip: "patates_soyma", test: /patates\s*soy|sebze\s*soy/ },
];

export function inferHazirlikTipFromIsim(
  isim: string | null | undefined,
): string | null {
  const n = norm(isim);
  if (!n) return null;
  for (const rule of HAZIRLIK_ISIM_KALIP) {
    if (rule.test.test(n)) return rule.tip;
  }
  return null;
}

export function isHazirlikReferansIsim(isim: string | null | undefined): boolean {
  return inferHazirlikTipFromIsim(isim) != null;
}

export function isHazirlikTipKodu(tip: string | null | undefined): boolean {
  const resolved = resolveTipKodu(String(tip ?? "").trim());
  return HAZIRLIK_TIP_KODLARI.has(resolved);
}

/** PFOS kalemi hazırlık makinesi mi? (tip veya referans adı) */
export function isHazirlikPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isHazirlikTipKodu(opts.urunTipi)) return true;
  return isHazirlikReferansIsim(opts.isim);
}

export function isHazirlikKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(marka);
  return n.includes("pimak") || n.includes("bogazici") || n.includes("boğaziçi");
}

export function isOztiKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(marka);
  return n.includes("oztiryakiler") || n.includes("ozti ");
}
