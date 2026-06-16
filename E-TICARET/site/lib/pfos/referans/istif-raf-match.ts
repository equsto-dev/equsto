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
  isOztiIstifSku,
  isPortashelfSku,
} from "../core/portashelf-marka";
import {
  findPortashelfByOlcu,
  PORTASHELF_304_GORSEL_REL,
  portashelfBySku,
  portashelfDisplayName,
  portashelfGorselRelFromSku,
  portashelfOlcuDisplayCm,
  portashelfSatisEurFromListe,
  type PortashelfKatliRafRow,
} from "../core/portashelf-fiyat";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

type PortashelfProduct = {
  sku?: string;
  name?: string;
  model?: string;
  olculer_net_mm?: string;
  alt_kategori?: string;
  fiyat_euro?: number;
  liste_fiyati_eur?: number;
  satis_eur_indirimli?: number;
  category?: string;
};

let portashelfCatalogCache: PortashelfProduct[] | null = null;

export function isIstifRafiReferans(isim: string): boolean {
  return isIstifRafiReferansIsim(isim);
}

/** Referans adı / notlar / ölçü — istif raf ölçü metni (notlar öncelikli) */
function extractIstifOlcuFromReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
): string {
  const fromNotlar =
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  if (fromNotlar && /\d/.test(fromNotlar)) return fromNotlar;
  if (olcu.trim()) return olcu.trim();
  const nameHit = isim.match(/(\d+)\s*[x×X*]\s*(\d+)\s*[x×X*]\s*(\d+)/i);
  if (nameHit) return `${nameHit[1]}×${nameHit[2]}×${nameHit[3]}`;
  return "";
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
  portashelfCatalogCache = items.filter((p) =>
    /inox\s*(304|201)|katli\s*raf|tier\s*shelving/i.test(
      `${p.alt_kategori ?? ""} ${p.name ?? ""}`,
    ),
  );
  return portashelfCatalogCache;
}

function portashelfImageRel(sku: string): string | null {
  return portashelfGorselRelFromSku(sku);
}

function inoxRowFromProduct(
  p: PortashelfProduct,
): (PortashelfKatliRafRow & { sku: string; satisEur: number }) | null {
  const sku = String(p.sku ?? "").trim();
  const fromTable = portashelfBySku(sku);
  if (fromTable) return fromTable;
  const liste = Number(p.liste_fiyati_eur ?? p.fiyat_euro);
  if (!(liste > 0) || !isPortashelfSku(sku)) return null;
  const m = /^(\d+)-x-(\d+)-x-(\d+)/i.exec(sku);
  if (!m) return null;
  return {
    depthCm: Number(m[1]),
    widthCm: Number(m[2]),
    heightCm: Number(m[3]),
    listeEur: liste,
    variant: "201L",
    sku,
    satisEur: portashelfSatisEurFromListe(liste),
  };
}

async function findPortashelfEkipmanRow(sku: string): Promise<AdminUrunRow | null> {
  const needle = String(sku ?? "").trim().toLowerCase();
  if (!needle || !isPortashelfSku(sku)) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      !isOztiIstifSku(r.sku) &&
      (isPortashelfKatalogMarka(r.marka_ad) || isPortashelfSku(r.sku)),
  );
  return (
    rows.find((r) => String(r.sku ?? "").trim().toLowerCase() === needle) ?? null
  );
}

function portashelfToEslesmis(
  isim: string,
  sku: string,
  satisEur: number,
  row?: AdminUrunRow | null,
  olcu?: string | null,
): EslesmisUrun {
  if (row && !isOztiIstifSku(row.sku)) {
    const matched = katalogRowToEslesmis(row, {
      linkMarka: PORTASHELF_MARKA,
      sablonIsim: isim,
      urunTipi: "istif_rafi",
    });
    const eur = equstoSatisEurFromRow(row) ?? satisEur;
    return {
      ...matched,
      sku,
      marka: PORTASHELF_MARKA,
      model: null,
      fiyatEur: eur,
      fiyat: row.fiyat_tl > 0 ? row.fiyat_tl : 0,
      gorselUrl: normalizePfosGorselUrl(PORTASHELF_304_GORSEL_REL),
    };
  }

  const m = /^(\d+)-x-(\d+)-x-(\d+)/i.exec(sku);
  const ad = m
    ? portashelfDisplayName(Number(m[1]), Number(m[2]), Number(m[3]))
    : isim.trim();

  return {
    id: `portashelf-${sku.toLowerCase()}`,
    sku,
    ad,
    marka: PORTASHELF_MARKA,
    model: null,
    olcu: olcu ?? null,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur: satisEur,
    doviz: "EUR",
    gorselUrl: normalizePfosGorselUrl(portashelfImageRel(sku)),
  };
}

/** İstif raf — Portashelf INOX 201 LIGHT; Öztiryakiler 8897/7897 kullanılmaz */
export async function matchIstifRafiByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcuText = extractIstifOlcuFromReferans(isim, olcu, notlar);
  const variantHint = `${isim} ${notlar ?? ""}`;

  const inoxMatch = olcuText ? findPortashelfByOlcu(olcuText, variantHint) : null;
  if (inoxMatch) {
    const row = await findPortashelfEkipmanRow(inoxMatch.sku);
    const olcuDisplay = portashelfOlcuDisplayCm(
      inoxMatch.depthCm,
      inoxMatch.widthCm,
      inoxMatch.heightCm,
    );
    return portashelfToEslesmis(
      isim,
      inoxMatch.sku,
      inoxMatch.satisEur,
      row,
      olcuDisplay,
    );
  }

  const catalog = await loadPortashelfCatalog();
  if (catalog.length && olcuText) {
    const nums = [...olcuText.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) =>
      Number(m[1].replace(",", ".")),
    );
    let best: {
      inox: NonNullable<ReturnType<typeof inoxRowFromProduct>>;
      dist: number;
    } | null = null;
    for (const p of catalog) {
      const inox = inoxRowFromProduct(p);
      if (!inox) continue;
      const catalogDims: [number, number, number] = [
        inox.depthCm,
        inox.widthCm,
        inox.heightCm,
      ];
      const perms: Array<[number, number, number]> =
        nums.length >= 3
          ? [
              [nums[0], nums[1], nums[2]],
              [nums[0], nums[2], nums[1]],
              [nums[1], nums[0], nums[2]],
              [nums[1], nums[2], nums[0]],
              [nums[2], nums[0], nums[1]],
              [nums[2], nums[1], nums[0]],
            ]
          : [];
      const dist = perms.length
        ? Math.min(
            ...perms.map(
              (t) =>
                Math.abs(t[0] - catalogDims[0]) +
                Math.abs(t[1] - catalogDims[1]) +
                Math.abs(t[2] - catalogDims[2]),
            ),
          )
        : 9999;
      if (!best || dist < best.dist) {
        if (dist < 100) best = { inox, dist };
      }
    }
    if (best) {
      const row = await findPortashelfEkipmanRow(best.inox.sku);
      return portashelfToEslesmis(
        isim,
        best.inox.sku,
        best.inox.satisEur,
        row,
        portashelfOlcuDisplayCm(
          best.inox.depthCm,
          best.inox.widthCm,
          best.inox.heightCm,
        ),
      );
    }
  }

  if (isIstifRafiReferansIsim(isim)) {
    return {
      id: "portashelf-istif-ozel",
      sku: "",
      ad: isim.trim(),
      marka: PORTASHELF_MARKA,
      model: null,
      olcu: olcuText || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: normalizePfosGorselUrl(PORTASHELF_304_GORSEL_REL),
    };
  }

  return null;
}

export function invalidatePortashelfIstifCache(): void {
  portashelfCatalogCache = null;
}
