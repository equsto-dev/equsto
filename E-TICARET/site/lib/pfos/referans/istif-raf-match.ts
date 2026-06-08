import { readJsonFile } from "@/lib/legacy-data";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { equstoSatisEurFromRow } from "../core/shop-catalog-match";
import { normalizePfosGorselUrl } from "../core/katalog-gorsel-url";
import {
  PORTASHELF_CATALOG_REL,
  PORTASHELF_MARKA,
  isIstifRafiReferansIsim,
  isPortashelfKatalogMarka,
} from "../core/portashelf-marka";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

type PortashelfProduct = {
  sku?: string;
  name?: string;
  model?: string;
  olculer_net_mm?: string;
  alt_kategori?: string;
  fiyat_euro?: number;
  category?: string;
};

let portashelfCatalogCache: PortashelfProduct[] | null = null;

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[×x]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

export function isIstifRafiReferans(isim: string): boolean {
  return isIstifRafiReferansIsim(isim);
}

async function loadPortashelfCatalog(): Promise<PortashelfProduct[]> {
  if (portashelfCatalogCache) return portashelfCatalogCache;
  const raw = await readJsonFile<PortashelfProduct[] | { items?: PortashelfProduct[] }>(
    PORTASHELF_CATALOG_REL,
  );
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : [];
  portashelfCatalogCache = items.filter((p) => isPortashelfIstifProduct(p));
  return portashelfCatalogCache;
}

function isPortashelfIstifProduct(p: PortashelfProduct): boolean {
  const blob = norm(`${p.alt_kategori ?? ""} ${p.name ?? ""} ${p.category ?? ""}`);
  if (/davlumbaz\s*filtre|hood filter|slim\s*2\s*door|refrigerator|buzdolab/.test(blob)) {
    return false;
  }
  return (
    /katli\s*raf|tier\s*shelving|tel\s*raf|wire|tel\s*izgara|perfore|istif|raf/.test(blob) &&
    !/slim\s*2\s*doors/.test(blob)
  );
}

function olcuSayilari(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

function dimsFromProduct(p: PortashelfProduct): [number, number, number] | null {
  const mm = String(p.olculer_net_mm ?? "").trim();
  const m = mm.match(/(\d+)\s*[xX*×]\s*(\d+)\s*[xX*×]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const fromName = String(p.name ?? p.sku ?? "").match(
    /(\d+)\s*[-xX*×]\s*(\d+)\s*[-xX*×]\s*(\d+)/i,
  );
  if (fromName) {
    return [Number(fromName[1]), Number(fromName[2]), Number(fromName[3])];
  }
  return null;
}

function dimPermutations(nums: number[]): Array<[number, number, number]> {
  if (nums.length < 3) return [];
  const [a, b, c] = nums;
  return [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ];
}

function olcuDistance(
  target: [number, number, number],
  catalog: [number, number, number],
): number {
  return (
    Math.abs(target[0] - catalog[0]) +
    Math.abs(target[1] - catalog[1]) +
    Math.abs(target[2] - catalog[2])
  );
}

function closestDimDistance(
  targetNums: number[],
  catalog: [number, number, number],
): number {
  const perms = dimPermutations(targetNums.slice(0, 3));
  if (!perms.length) return 9999;
  return Math.min(...perms.map((t) => olcuDistance(t, catalog)));
}

function inferIstifForm(isim: string, notlar?: string | null): "tel" | "katli" | "izgara" | null {
  const blob = norm(`${isim} ${notlar ?? ""}`);
  if (/ip4|izgara\s*tabla|paslanmaz.*4\s*kat|tel\s*raf/.test(blob)) return "tel";
  if (/izgara|wire\s*grid/.test(blob)) return "izgara";
  if (/katli|kati|tier|duz\s*tabl|demonte/.test(blob)) return "katli";
  return null;
}

function scorePortashelfProduct(
  p: PortashelfProduct,
  form: ReturnType<typeof inferIstifForm>,
  targetNums: number[],
  isim: string,
): number {
  const blob = norm(`${p.alt_kategori ?? ""} ${p.name ?? ""}`);
  if (!isPortashelfIstifProduct(p)) return -9999;

  if (form === "tel" || form === "izgara") {
    if (/tel\s*raf|wire|tel\s*izgara|katli\s*raf|tier/.test(blob)) {
      /* ok */
    } else return -9999;
  } else if (form === "katli") {
    if (!/katli\s*raf|tier\s*shelving/.test(blob)) return -9999;
  }

  let score = 100;
  const dims = dimsFromProduct(p);
  if (dims && targetNums.length >= 3) {
    const dist = closestDimDistance(targetNums, dims);
    score += Math.max(0, 500 - dist);
  } else if (targetNums.length >= 2 && dims) {
    const dist =
      Math.abs(dims[0] - targetNums[0]) +
      Math.abs(dims[1] - targetNums[1]);
    score += Math.max(0, 200 - dist);
  }

  if (/paslanmaz|stainless/.test(norm(isim)) && /paslanmaz|stainless|tel/.test(blob)) {
    score += 40;
  }

  return score;
}

function portashelfImageRel(sku: string): string | null {
  const m = /^(\d+)-x-(\d+)-x-(\d+)$/i.exec(String(sku ?? "").trim());
  if (m) return `images/yuksel-${m[1]}x${m[2]}x${m[3]}_1.jpg`;
  return null;
}

function portashelfProductToEslesmis(
  p: PortashelfProduct,
  isim: string,
  row?: AdminUrunRow | null,
): EslesmisUrun {
  if (row) {
    const matched = katalogRowToEslesmis(row, {
      linkMarka: PORTASHELF_MARKA,
      sablonIsim: isim,
      urunTipi: "istif_rafi",
    });
    return {
      ...matched,
      marka: PORTASHELF_MARKA,
      fiyatEur: equstoSatisEurFromRow(row),
    };
  }

  const sku = String(p.sku ?? p.model ?? "").trim();
  const dims = dimsFromProduct(p);
  const olcu = dims ? `${dims[0]}×${dims[1]}×${dims[2]} mm` : null;
  const img = portashelfImageRel(sku);

  return {
    id: `portashelf-${sku || norm(p.name ?? "istif").replace(/\s+/g, "-")}`,
    sku,
    ad: String(p.name ?? p.model ?? isim).trim(),
    marka: PORTASHELF_MARKA,
    model: sku || null,
    olcu,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(img),
  };
}

async function findEkipmanRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku).replace(/\s+/g, "");
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  return (
    rows.find((r) => norm(r.sku ?? "").replace(/\s+/g, "") === needle) ??
    rows.find((r) =>
      isPortashelfKatalogMarka(r.marka_ad) &&
      norm(r.sku ?? "").includes(needle),
    ) ??
    null
  );
}

async function matchFromEkipmanlar(
  isim: string,
  olcuText: string,
): Promise<EslesmisUrun | null> {
  const targetNums = olcuSayilari(olcuText);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      (isPortashelfKatalogMarka(r.marka_ad) ||
        /portashelf|yuksel.*istif|istif.*raf/i.test(`${r.marka_ad} ${r.ad}`)) &&
      /istif|raf|shelving|tel raf/i.test(norm(r.ad)),
  );
  if (!rows.length) return null;

  const form = inferIstifForm(isim);
  const scored = rows
    .map((row) => {
      let score = 80;
      const ad = norm(row.ad);
      if (form === "katli" && !/katli|tier|duz tabl/.test(ad)) score -= 40;
      if ((form === "tel" || form === "izgara") && !/tel|izgara|ip4|paslanmaz/.test(ad)) {
        score -= 20;
      }
      if (targetNums.length >= 3) {
        const m = ad.match(/(\d+)\s*[*x×]\s*(\d+)\s*[*x×]\s*(\d+)/);
        if (m) {
          const dist = closestDimDistance(targetNums, [
            Number(m[1]),
            Number(m[2]),
            Number(m[3]),
          ]);
          score += Math.max(0, 500 - dist);
        }
      }
      if (row.gorsel_url) score += 5;
      return { row, score };
    })
    .filter((x) => x.score >= 80)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return portashelfProductToEslesmis({}, isim, scored[0].row);
}

/** İstif raf — Portashelf katalog ölçü eşlemesi; fiyat yalnızca ekipmanlar.json */
export async function matchIstifRafiByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcuText =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const targetNums = olcuSayilari(olcuText);
  const form = inferIstifForm(isim, notlar);

  const fromShop = await matchFromEkipmanlar(isim, olcuText);
  if (fromShop?.fiyatEur) return fromShop;

  const catalog = await loadPortashelfCatalog();
  const scored = catalog
    .map((p) => ({
      p,
      score: scorePortashelfProduct(p, form, targetNums, isim),
    }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return fromShop;

  const pick = scored[0].p;
  const sku = String(pick.sku ?? pick.model ?? "").trim();
  const ekipmanRow = sku ? await findEkipmanRowBySku(sku) : null;
  const matched = portashelfProductToEslesmis(pick, isim, ekipmanRow);

  if (fromShop && !matched.fiyatEur) {
    return { ...matched, gorselUrl: fromShop.gorselUrl ?? matched.gorselUrl };
  }
  return matched;
}

export function invalidatePortashelfIstifCache(): void {
  portashelfCatalogCache = null;
}
