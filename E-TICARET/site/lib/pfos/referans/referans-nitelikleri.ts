/** Referans satırından (isim + notlar) çıkarılan teknik nitelikler — katalog çelişki kontrolü */

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export type ReferansNitelikleri = {
  markalar: string[];
  buzKgGun: number | null;
  bulasikForm:
    | "setalti"
    | "giyotin"
    | "bardak"
    | "konveyor"
    | "kazan"
    | null;
  tabakSaat: number | null;
  tekEvye: boolean;
  mermerTabla: boolean;
  imalat: boolean;
};

const MARKA_KALIPLARI: Array<{ key: string; test: RegExp }> = [
  { key: "brema", test: /\bbrema\b/i },
  { key: "hoshizaki", test: /\bhoshizaki\b/i },
  { key: "simag", test: /\bsimag\b/i },
  { key: "ozti", test: /\bozti\b|\böztiryakiler\b/i },
  { key: "unox", test: /\bunox\b/i },
  { key: "rational", test: /\brational\b/i },
  { key: "fagor", test: /\bfagor\b/i },
  { key: "neo", test: /\bneo\b/i },
];

export function parseReferansNitelikleri(
  isim: string,
  notlar?: string | null,
): ReferansNitelikleri {
  const blob = norm(`${isim} ${notlar ?? ""}`);
  const markalar = MARKA_KALIPLARI.filter((m) => m.test.test(blob)).map(
    (m) => m.key,
  );

  let buzKgGun: number | null = null;
  const kgM = blob.match(/(\d+(?:[.,]\d+)?)\s*kg\s*\/?\s*(?:gun|gün|d)/);
  if (kgM) buzKgGun = Number(kgM[1].replace(",", "."));
  const cbM = blob.match(/\bcb(\d{3,4})\b/i);
  if (cbM) {
    const n = Number(cbM[1]);
    if (n >= 300 && n <= 500) buzKgGun = Math.round(n / 10);
  }

  let bulasikForm: ReferansNitelikleri["bulasikForm"] = null;
  if (/bardak\s*yik|bardak yik/.test(blob)) bulasikForm = "bardak";
  else if (/giyotin/.test(blob)) bulasikForm = "giyotin";
  else if (/setalti|set alti|tezgahalti|tezgah alti|undercounter/.test(blob))
    bulasikForm = "setalti";
  else if (/konveyor|konveyör|1000\s*tb|500\s*tb/.test(blob))
    bulasikForm = /giyotin/.test(blob) ? "giyotin" : "setalti";
  else if (/kazan\s*yik/.test(blob)) bulasikForm = "kazan";

  let tabakSaat: number | null = null;
  const tbM = blob.match(/(\d+)\s*tb\s*\/?\s*saat/);
  if (tbM) tabakSaat = Number(tbM[1]);

  return {
    markalar,
    buzKgGun,
    bulasikForm,
    tabakSaat,
    tekEvye: /tek\s*evyeli/.test(blob),
    mermerTabla: /mermer\s*tabla/.test(blob),
    imalat: /\(imalat\)|\(equsto\)/i.test(isim),
  };
}

function katalogMarkalari(ad: string): string[] {
  const k = norm(ad);
  return MARKA_KALIPLARI.filter((m) => m.test.test(k)).map((m) => m.key);
}

function buzKgFromKatalog(ad: string): number | null {
  const k = norm(ad);
  const m = k.match(/(\d+(?:[.,]\d+)?)\s*kg/);
  return m ? Number(m[1].replace(",", ".")) : null;
}

function bulasikFormFromKatalog(ad: string): ReferansNitelikleri["bulasikForm"] {
  const k = norm(ad);
  if (/firin|konveksiyon|fritoz/.test(k) && !/bulasik|bulaşık|yikama\s*mak/.test(k)) {
    return null;
  }
  if (/bardak\s*yik/.test(k)) return "bardak";
  if (/giyotin/.test(k)) return "giyotin";
  if (/tezgahalti|tezgah alti|oby\s*50|bulasik.*setalti|setalti.*bulasik/.test(k))
    return "setalti";
  if (/kazan\s*yik/.test(k)) return "kazan";
  if (/konveyor|konveyör|flight/.test(k)) return "konveyor";
  return null;
}

/** Referans tanımı ile katalog satırı çelişiyorsa true — yanlış SKU/fiyat engeli */
export function referansKatalogCeliski(
  isim: string,
  katalogAd: string,
  notlar?: string | null,
): boolean {
  const ref = parseReferansNitelikleri(isim, notlar);
  const k = norm(katalogAd);
  if (!k) return false;

  if (ref.markalar.length) {
    const katMarka = katalogMarkalari(katalogAd);
    if (katMarka.length && !ref.markalar.some((m) => katMarka.includes(m))) {
      return true;
    }
    if (!katMarka.length && ref.markalar.includes("brema") && /buz mak/.test(k)) {
      return true;
    }
  }

  if (ref.buzKgGun != null && /buz mak|ice/.test(k)) {
    const katKg = buzKgFromKatalog(katalogAd);
    if (katKg != null && Math.abs(katKg - ref.buzKgGun) > 25) return true;
  }

  if (ref.bulasikForm === "setalti") {
    const form = bulasikFormFromKatalog(katalogAd);
    if (form === "giyotin" || form === "kazan" || form === "konveyor")
      return true;
  }

  if (/bulasik\s*yik|bulaşık\s*yik|bardak\s*yik/.test(norm(isim))) {
    const k = norm(katalogAd);
    if (
      /firin|konveksiyon|fritoz|izgara|ocak|kuzine/.test(k) &&
      !/bulasik|bulaşık|yikama\s*mak|dishwash/.test(k)
    ) {
      return true;
    }
  }

  if (/buzdolab/.test(norm(isim)) && /davlumbaz|aspirator/.test(norm(katalogAd))) {
    return true;
  }
  if (/davlumbaz/.test(norm(isim)) && /buzdolab|derin donduruc|sogutuc/.test(norm(katalogAd))) {
    return true;
  }
  if (
    /setalti.*buzdolab|buzdolab.*setalti/.test(norm(isim)) &&
    /davlumbaz|firin|fritoz|izgara|ocak/.test(norm(katalogAd)) &&
    !/buzdolab|sogutuc|yatay tip/.test(norm(katalogAd))
  ) {
    return true;
  }
  if (ref.bulasikForm === "bardak" && /giyotin|kazan|tezgahalti bulasik/.test(k)) {
    return true;
  }
  if (ref.bulasikForm === "giyotin" && bulasikFormFromKatalog(katalogAd) === "setalti") {
    return true;
  }

  if (ref.tekEvye && /ara tezgah|set ustü|set ustu|nötr tezgah|notr tezgah/.test(k)) {
    return true;
  }
  if (ref.tekEvye && !/evyeli|evye|göz evye/.test(k) && /tezgah|600 seri/.test(k)) {
    return true;
  }

  return false;
}

/** Tek tip→SKU linki kullanılabilir mi? (marka/kapasite/form çelişkisi varsa hayır) */
export function tipShopLinkUygun(
  isim: string,
  notlar: string | null | undefined,
  linkName?: string | null,
): boolean {
  if (!linkName) return true;
  return !referansKatalogCeliski(isim, linkName, notlar);
}
