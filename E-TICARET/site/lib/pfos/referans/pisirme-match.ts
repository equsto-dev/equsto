import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import {
  OZTI_MARKA,
  isOztiPisirmeRow,
} from "../core/ozti-marka";
import { isOztiKatalogMarka } from "../core/hazirlik-marka";
import {
  preferredOztiPisirmeSkus,
  scoreOztiOcakRow,
} from "../core/ozti-pisirme-spec";
import { isKombiKonveksiyonReferans } from "./firin-match";
import { resolveTipKodu } from "../core/tip-kodu";
import { referansKatalogCeliski } from "./referans-nitelikleri";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Öztiryakiler pişirme eşlemesi — Atalay marka kilidi ve ızgara çeşidi kontrolü */
export function oztiPisirmeKatalogUyumsuz(
  sablonIsim: string,
  katalogAd: string,
  notlar?: string | null,
  katalogSku?: string | null,
): boolean {
  if (referansKatalogCeliski(sablonIsim, katalogAd, notlar)) return true;
  const s = norm(sablonIsim);
  const k = norm(`${katalogAd} ${katalogSku ?? ""}`);
  if (!s || !k) return false;

  if (/plate\s*izgar/.test(s) && !/grill plate|plate duz|plate düz/.test(k)) {
    if (/lavatas|dokum izgar|kuzine|firinli|elektrik|ocak/.test(k)) return true;
  }
  if (/dokum\s*izgar/.test(s) && !/dokum izgar/.test(k)) {
    if (/lavatas|grill plate|plate duz|kuzine|firinli|elektrik/.test(k)) return true;
  }
  if (/lavatas/.test(s) && !/lavatas/.test(k)) {
    if (/dokum izgar|grill plate|plate duz|kuzine|firinli/.test(k)) return true;
  }
  if (/izgar/.test(s) && /kuzine|firinli|elektrikli/.test(k) && !/izgar/.test(k)) {
    return true;
  }
  if (/gazli|gazlı|\bgaz\b/.test(s) && /elektrik/.test(k) && !/gaz/.test(k)) {
    return true;
  }
  if (/elektrik/.test(s) && /gazli|gazlı|\bgaz\b/.test(k) && !/elektrik/.test(k)) {
    return true;
  }
  if (/cift|çift|iki\s*hazne/.test(s) && /set\s*ustu|setüstü/.test(s) && /7856\.(gn|ef)/i.test(k)) {
    return true;
  }
  if (
    /cift|çift|iki\s*hazne/.test(s) &&
    /set\s*ustu|setüstü/.test(s) &&
    /7856\.n1\.80703\.13/.test(k) &&
    /elektrik|elk/.test(s)
  ) {
    return true;
  }
  if (
    /cift|çift|iki\s*hazne/.test(s) &&
    /set\s*ustu|setüstü/.test(s) &&
    /7856\.n1\.80703\.11/.test(k) &&
    /gazli|gazlı|\bgaz\b/.test(s)
  ) {
    return true;
  }
  if (/tost\s*mak/.test(s) && /^78\d{2}\./.test(String(katalogSku ?? ""))) {
    return true;
  }
  if (
    /mikrodalga|microwave|menumaster/i.test(s) &&
    (/kuzine|firinli|brulor|brülör|acik\s*ates|açık\s*ateş|4\s*kare\s*plate/i.test(k) ||
      /^7865\./i.test(String(katalogSku ?? "")))
  ) {
    return true;
  }
  return false;
}

export function isPisirmeReferans(isim: string): boolean {
  const n = norm(isim);
  return /fritoz|fritöz|izgar|ocak|kuzine|salamander|firin|fırın|patates\s*dinlendir|wok|benmari|bain\s*marie|bainmarie|sos\s*bain|makarna\s*pisir|tost|waffle|pizza\s*firin|mikrodalga|microwave|menumaster/.test(
    n,
  );
}

type PisirmeFamily =
  | "fritoz"
  | "patates_dinlendirme"
  | "izgara"
  | "ocak"
  | "kuzine"
  | "salamander"
  | "firin"
  | "mikrodalga"
  | "pizza_firin"
  | "wok"
  | "doner"
  | "makarna"
  | "bainmarie"
  | "komurlu_izgara"
  | null;

function parsePisirmeFamily(isim: string, urunTipi?: string | null): PisirmeFamily {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  if (/patates\s*dinlendir|scuttle|sicak\s*tutucu.*patates/.test(n)) {
    return "patates_dinlendirme";
  }
  if (/mikrodalga|microwave|menumaster|merry\s*chef|speed\s*oven/i.test(n)) {
    return "mikrodalga";
  }
  if ((/komurlu|kömürlü/.test(n) && /izgar/.test(n)) || urunTipi === "komurlu-izgara") {
    return "komurlu_izgara";
  }
  if (/fritoz|fritöz|friteuse/.test(n)) return "fritoz";
  if (/bain\s*marie|bainmarie|sos\s*bain|benmari/.test(n)) return "bainmarie";
  if (/pizza\s*firin|pizza\s*fırın/.test(n)) return "pizza_firin";
  if (/salamander/.test(n)) return "salamander";
  if (/wok/.test(n)) return "wok";
  if (/döner\s*ocak|doner\s*ocak|doner-ocak/.test(n)) return "doner";
  if (/makarna\s*pisir|makarna\s*pişir|makarna-hafllama/.test(n)) return "makarna";
  if (/kuzine/.test(n)) return "kuzine";
  if (/ocak|alevli/.test(n) && !/döner|doner/.test(n)) return "ocak";
  if (/plate\s*izgar|char\s*broil|lavash|dokum\s*izgar|döküm|izgar|char_broil|komurlu_izgara/.test(n)) {
    return "izgara";
  }
  if (/konveksiyon|combi|kombi|tas\s*taban|taş\s*taban|rafli\s*firin|raflı\s*fırın|firin|fırın/.test(n)) {
    return "firin";
  }
  return null;
}

function olcuParts(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

function dimsMmFromOlcu(olcu: string): number[] {
  return olcuParts(olcu).map((n) => (n < 900 ? Math.round(n * 10) : Math.round(n)));
}

function dimsFromProductName(ad: string): number[] {
  const m = String(ad).match(/(\d{2,4})\s*[xX×*]\s*(\d{2,4})(?:\s*[xX×*]\s*(\d{2,4}))?/);
  if (!m) return [];
  const out = [Number(m[1]), Number(m[2])];
  if (m[3]) out.push(Number(m[3]));
  return out;
}

function olcuDistance(target: number[], catalog: number[]): number {
  if (!target.length || !catalog.length) return 9999;
  const t = [...target].sort((a, b) => b - a);
  const c = [...catalog].sort((a, b) => b - a);
  const len = Math.max(t.length, c.length);
  let dist = 0;
  for (let i = 0; i < len; i++) {
    dist += Math.abs((t[i] ?? 0) - (c[i] ?? 0));
  }
  return dist;
}

function olcuInAd(olcu: string, ad: string): boolean {
  const nums = olcuParts(olcu);
  if (nums.length < 2) return false;
  const adN = norm(ad).replace(/[×x]/g, "*");
  const [a, b] = nums;
  const pairs = [
    `${a}*${b}`,
    `${b}*${a}`,
    `${Math.round(a * 10)}*${Math.round(b * 10)}`,
    `${Math.round(b * 10)}*${Math.round(a * 10)}`,
  ];
  if (nums.length >= 3) {
    const c = nums[2];
    pairs.push(`${a}*${b}*${c}`, `${b}*${a}*${c}`);
  }
  return pairs.some((p) => adN.includes(p));
}

function rowMatchesFamily(row: AdminUrunRow, family: PisirmeFamily): boolean {
  const ad = norm(row.ad);
  const cat = norm(row.kategori);
  if (!family) return true;

  switch (family) {
    case "fritoz":
      return cat.includes("fritoz") || /fritoz|fritöz/.test(ad);
    case "patates_dinlendirme":
      return (
        cat.includes("patates-dinlendirme") ||
        /patates\s*dinlendir|dinlendirme\s*unitesi|sicak\s*tutucu.*patates/.test(ad)
      );
    case "izgara":
      return (
        (cat.includes("izgar") ||
          /izgar|lavash|charbroil|grill plate|plate duz/.test(ad)) &&
        !/patates\s*dinlendir|fritoz|fritöz|kuzine|firinli|elektrikli\s*4/.test(ad) &&
        !(/plate/.test(ad) && !/izgar|grill plate|plate duz/.test(ad))
      );
    case "ocak":
      return (
        cat.includes("ocak") &&
        !cat.includes("doner") &&
        /ocak/.test(ad) &&
        !/wok|konveyorlu|konveyörlü|krep|tost|makarna/.test(ad)
      );
    case "kuzine":
      return cat.includes("kuzine") || /kuzine/.test(ad);
    case "salamander":
      return /salamander/.test(ad);
    case "mikrodalga":
      return (
        cat.includes("mikrodalga") ||
        /mikrodalga|microwave|menumaster/i.test(ad)
      );
    case "firin":
      return (
        (cat.includes("firin") || /firin|fırın|konveksiyon/.test(ad)) &&
        !/mikrodalga|pizza|setalt|set alt|tezgah alt/.test(ad) &&
        !/^(easfe|easfg|asfe|asfg)-/.test(String(row.sku ?? ""))
      );
    case "pizza_firin":
      return cat.includes("pizza") || /pizza\s*firin|pizza\s*fırın/.test(ad);
    case "wok":
      return cat.includes("wok") || /wok/.test(ad);
    case "doner":
      return cat.includes("doner") || /döner|doner/.test(ad);
    case "makarna":
      return cat.includes("makarna") || /makarna/.test(ad);
    case "bainmarie":
      return (
        (cat.includes("bain") || /bain\s*marie|benmari/.test(ad)) &&
        !/bain\s*marie\s*(kapak|kuvet|küvet)/.test(ad) &&
        !( /celik\s*saklama/.test(ad) && /bain\s*marie|benmari/.test(ad) )
      );
    case "komurlu_izgara":
      return /komurlu.*izgar|kömürlü.*izgar/.test(ad);
    default:
      return true;
  }
}

function preferredSkus(
  family: PisirmeFamily,
  olcu: string,
  referansIsim = "",
  notlar?: string | null,
): string[] {
  return preferredOztiPisirmeSkus(family, olcu, referansIsim, notlar);
}

function scoreOztiPisirmeRow(
  row: AdminUrunRow,
  family: PisirmeFamily,
  olcu: string,
  referansIsim: string,
  preferred: string[],
  notlar?: string | null,
  uyumsuzlukKontrol: (
    sablon: string,
    katName: string,
    notes?: string | null,
    sku?: string | null,
  ) => boolean = oztiPisirmeKatalogUyumsuz,
): number {
  if (!isOztiPisirmeRow(row)) return -9999;
  if (uyumsuzlukKontrol(referansIsim, row.ad, notlar, row.sku)) return -9999;
  if (family && !rowMatchesFamily(row, family)) return -9999;

  let score = 80;
  if (isOztiKatalogMarka(row.marka_ad)) score += 40;

  const sku = String(row.sku ?? "").toUpperCase();
  if (preferred.some((p) => norm(sku) === norm(p))) score += 400;

  if (olcu && olcuInAd(olcu, row.ad)) score += 250;

  const target = dimsMmFromOlcu(olcu);
  const catDims = dimsFromProductName(row.ad);
  if (target.length && catDims.length) {
    const dist = olcuDistance(target, catDims);
    score += Math.max(0, 800 - dist);
  }

  const refN = norm(referansIsim);
  const ad = norm(row.ad);
  const refBlob = norm(`${referansIsim} ${notlar ?? ""}`);
  if (family === "fritoz" && /cift|çift|2\s*x|iki\s*sepet|iki\s*hazne/.test(refBlob)) {
    if (/set\s*ustu|setüstü/.test(refBlob)) {
      if (/7856\.n1\.80703\.11/i.test(sku) && /elektrik|elk/.test(refBlob)) score += 300;
      if (/7856\.n1\.80703\.13/i.test(sku) && /gazli|gazlı|\bgaz\b/.test(refBlob)) score += 300;
      if (/7856\.(gn|ef)/i.test(sku)) score -= 8000;
    } else if (/870|2\s*x/.test(ad)) {
      score += 60;
    }
  }
  if (family === "patates_dinlendirme" && /patates|dinlendir|apd/.test(ad)) score += 80;
  if (family === "izgara" && /elektrik|e aei|e agi/.test(ad) && /elektrik|elk/.test(refN)) {
    score += 30;
  }
  if (family === "izgara" && /gaz|gazli|gazlı/.test(refN) && /e agi|gaz/.test(ad)) score += 30;
  if (family === "izgara") {
    if (/kuzine|firinli|elektrikli/.test(ad) && !/izgar/.test(ad)) score -= 5000;
    if (/plate\s*izgar/.test(refN) && /grill plate|plate duz/.test(ad)) score += 120;
    if (/dokum\s*izgar/.test(refN) && /dokum izgar/.test(ad)) score += 120;
    if (/lavatas/.test(refN) && /lavatas/.test(ad)) score += 120;
  }
  if (family === "ocak") {
    const ocakScore = scoreOztiOcakRow(row, referansIsim, olcu, notlar, preferred);
    if (ocakScore < 0) return ocakScore;
    score += ocakScore;
  }
  if (family === "bainmarie") {
    if (/elektrik|elk|elektr/.test(refBlob) && /elektrik/.test(ad)) score += 80;
    if (/gazli|gazlı|\bgaz\b/.test(refBlob) && /gazli|gazlı|\bgaz\b/.test(ad)) score += 80;
    if (/elektrik|elk|elektr/.test(refBlob) && /gazli|gazlı|\bgaz\b/.test(ad) && !/elektrik/.test(ad)) {
      score -= 5000;
    }
  }
  if (family === "mikrodalga") {
    if (/mikrodalga|microwave|menumaster/i.test(ad)) score += 120;
    if (/kuzine|firinli|brulor|brülör/i.test(ad)) score -= 8000;
  }
  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

/** Pişirme ekipmanı — Öztiryakiler katalog */
export async function matchPisirmeByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (isKombiKonveksiyonReferans(isim, urunTipi)) return null;
  if (/tost\s*mak/i.test(norm(isim)) || resolveTipKodu(String(urunTipi ?? "")) === "tost_makinasi") {
    return null;
  }

  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay = toOlcuMmDisplay(olcu) ?? (olcu || null);
  const family = parsePisirmeFamily(isim, urunTipi);
  const preferred = preferredSkus(family, olcu, isim, notlar);

  for (const sku of preferred) {
    const rows = await loadLegacyCatalogRows();
    const exact = rows.find(
      (r) =>
        r.durum === "aktif" &&
        isOztiPisirmeRow(r) &&
        norm(r.sku ?? "") === norm(sku),
    );
    if (exact && rowMatchesFamily(exact, family) && !oztiPisirmeKatalogUyumsuz(isim, exact.ad, notlar, exact.sku)) {
      const matched = katalogRowToEslesmis(exact, {
        linkMarka: OZTI_MARKA,
        sablonIsim: isim,
        urunTipi: urunTipi ?? undefined,
      });
      return {
        ...matched,
        ad: displayIsimFromSablon(isim),
        marka: OZTI_MARKA,
        olcu: olcuDisplay,
      };
    }
  }

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && isOztiPisirmeRow(r),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scoreOztiPisirmeRow(row, family, olcu, isim, preferred, notlar),
    }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const matched = katalogRowToEslesmis(scored[0].row, {
      linkMarka: OZTI_MARKA,
      sablonIsim: isim,
      urunTipi: urunTipi ?? undefined,
    });
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: OZTI_MARKA,
      olcu: olcuDisplay,
    };
  }

  if (isPisirmeReferans(isim)) {
    return {
      id: `ozti-pisirme-${norm(isim).replace(/\s+/g, "-").slice(0, 48)}`,
      sku: preferred[0] ?? null,
      ad: displayIsimFromSablon(isim),
      marka: OZTI_MARKA,
      model: preferred[0] ?? null,
      olcu: olcuDisplay,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  return null;
}
