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

  // Gelen listedeki markayı değil, PFOS'ta belirlenen markaları eşleştirmek için marka çelişki kontrolünü devre dışı bırakıyoruz.
  /*
  if (ref.markalar.length) {
    const katMarka = katalogMarkalari(katalogAd);
    if (katMarka.length && !ref.markalar.some((m) => katMarka.includes(m))) {
      return true;
    }
    if (!katMarka.length && ref.markalar.includes("brema") && /buz mak/.test(k)) {
      return true;
    }
  }
  */

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

  const refN = norm(isim);
  if (/servis\s*banko|dekoratif\s*servis/.test(refN)) {
    if (
      /davlumbaz|aspirator|buzdolab|derin donduruc|firin|fritoz|izgara|ocak|kuzine/.test(k) &&
      !/banko|servis.*unite|serv\.banko/.test(k)
    ) {
      return true;
    }
  }
  if (/davlumbaz/.test(refN) && /servis\s*banko|kasa\s*banko/.test(k)) {
    return true;
  }

  if (/komurlu.*izgar|kömürlü.*izgar/.test(refN)) {
    if (/yer\s*izgar|7960\.|pvc|sifon|tavali|ya[gğ]\s*tutucu/.test(k)) {
      return true;
    }
  }
  if (/yer\s*izgar/.test(refN) && /komurlu|kömürlü|plate\s*izgar|set\s*ustu/.test(k)) {
    return true;
  }

  const refKapi = kapiSayisiFromBlob(`${isim} ${notlar ?? ""}`);
  const katKapi = kapiSayisiFromBlob(katalogAd);
  if (refKapi != null && katKapi != null && refKapi !== katKapi) return true;

  const refGoz = gozBrulorSayisiFromBlob(`${isim} ${notlar ?? ""}`);
  const katGoz = gozBrulorSayisiFromBlob(katalogAd);
  if (refGoz != null && katGoz != null && refGoz !== katGoz) return true;

  return false;
}

function kapiSayisiFromBlob(blob: string): number | null {
  const n = norm(blob);
  const d = n.match(/(\d)\s*kap/i);
  if (d) return Number(d[1]);
  if (/dort\s*kap|4\s*inox\s*kap|4\s*kap/.test(n)) return 4;
  if (/uc\s*kap|üç\s*kap|3\s*kap/.test(n)) return 3;
  if (/cift\s*kap|çift\s*kap|iki\s*kap|2\s*kap/.test(n)) return 2;
  if (/tek\s*kap|1\s*kap/.test(n)) return 1;
  return null;
}

function gozBrulorSayisiFromBlob(blob: string): number | null {
  const n = norm(blob);
  const g = n.match(/(\d)\s*goz/i);
  if (g) return Number(g[1]);
  if (/uclu|üçlü|3\s*goz|3\s*brul/.test(n)) return 3;
  if (/ikili|iki\s*goz|2\s*goz|2\s*brul|2\s*acik/.test(n)) return 2;
  if (/dortlu|dörtlü|4\s*acik|4\s*goz|4\s*brul/.test(n)) return 4;
  return null;
}

/** Proforma alt satır — referans ile katalog teknik metni çelişiyorsa gösterme */
export function referansTeklifAciklamaCeliski(
  isim: string,
  aciklama: string,
  notlar?: string | null,
): boolean {
  const refBlob = norm(`${isim} ${notlar ?? ""}`);
  const acBlob = norm(aciklama);
  if (!refBlob || !acBlob) return false;

  const refKapi = kapiSayisiFromBlob(refBlob);
  const acKapi = kapiSayisiFromBlob(acBlob);
  if (refKapi != null && acKapi != null && refKapi !== acKapi) return true;

  const refGoz = gozBrulorSayisiFromBlob(refBlob);
  const acGoz = gozBrulorSayisiFromBlob(acBlob);
  if (refGoz != null && acGoz != null && refGoz !== acGoz) return true;

  if (
    (/cekmece|çekmece|make.?up/i.test(refBlob)) &&
    /(cift|çift|iki)\s*kap/i.test(acBlob) &&
    !/cekmece|çekmece/i.test(acBlob)
  ) {
    return true;
  }

  if (/ta[sş]\s*firin/.test(refBlob) && /kuzine|4\s*acik|acik\s*ates/.test(acBlob)) {
    return true;
  }

  if (
    /470\s*ntv|47ntv/.test(`${refBlob} ${acBlob}`) &&
    /270\s*ntv|ctag\s*270/.test(acBlob) &&
    /4\s*kap|dort\s*kap/.test(refBlob)
  ) {
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
