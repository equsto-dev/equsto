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
  PORTASHELF_MARKA,
  YUKSEL_SATIS_CATALOG_REL,
  isCopArabasiReferansIsim,
  isPortashelfKatalogMarka,
} from "../core/portashelf-marka";

type YukselSatisProduct = {
  slug?: string;
  name?: string;
  sku_web?: string;
  catalog_sku?: string;
  model_keys?: string[];
  image_url?: string;
  yukselsatis_price_try?: number;
};

let yukselCopArabasiCache: YukselSatisProduct[] | null = null;

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCopArabasiReferans(isim: string): boolean {
  return isCopArabasiReferansIsim(isim);
}

function isYukselCopArabasiProduct(p: YukselSatisProduct): boolean {
  const blob = norm(`${p.name ?? ""} ${p.slug ?? ""}`);
  return /cop\s*arab|çöp\s*arab/.test(blob) && !/cop\s*tezgah|çöp\s*tezgah/.test(blob);
}

async function loadYukselCopArabasiCatalog(): Promise<YukselSatisProduct[]> {
  if (yukselCopArabasiCache) return yukselCopArabasiCache;
  const raw = await readJsonFile<YukselSatisProduct[]>(YUKSEL_SATIS_CATALOG_REL);
  yukselCopArabasiCache = (Array.isArray(raw) ? raw : []).filter((p) =>
    isYukselCopArabasiProduct(p),
  );
  return yukselCopArabasiCache;
}

function yukselImageToLocalRel(imageUrl: string | undefined): string | null {
  const url = String(imageUrl ?? "").trim();
  const m = /\/([A-Za-z0-9-]+)(?:-scaled)?\.(?:jpg|jpeg|png|webp)$/i.exec(url);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  return `images/catalog/yuksel/web/yuksel-${slug}_1.jpg`;
}

function copArabasiProductToEslesmis(
  p: YukselSatisProduct,
  isim: string,
  row?: AdminUrunRow | null,
): EslesmisUrun {
  if (row) {
    const matched = katalogRowToEslesmis(row, {
      linkMarka: PORTASHELF_MARKA,
      sablonIsim: isim,
      urunTipi: "cop_arabasi",
    });
    return {
      ...matched,
      marka: PORTASHELF_MARKA,
      fiyatEur: equstoSatisEurFromRow(row),
    };
  }

  const sku = String(p.catalog_sku ?? p.sku_web ?? p.model_keys?.[0] ?? "").trim();
  const localImg = yukselImageToLocalRel(p.image_url);

  return {
    id: `portashelf-cop-${sku || norm(p.slug ?? "arabasi")}`,
    sku,
    ad: String(p.name ?? isim).trim(),
    marka: PORTASHELF_MARKA,
    model: sku || null,
    olcu: null,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(localImg),
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
    rows.find(
      (r) =>
        isPortashelfKatalogMarka(r.marka_ad) &&
        norm(r.sku ?? "").includes(needle),
    ) ??
    null
  );
}

async function matchFromEkipmanlar(isim: string): Promise<EslesmisUrun | null> {
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      (isPortashelfKatalogMarka(r.marka_ad) ||
        /yuksel|portashelf|mb126/i.test(`${r.marka_ad} ${r.ad} ${r.sku ?? ""}`)) &&
      /cop\s*arab|çöp\s*arab|mb126/i.test(norm(`${r.ad} ${r.sku ?? ""}`)),
  );
  if (!rows.length) return null;
  const row = rows.find((r) => norm(r.sku ?? "") === "mb126x") ?? rows[0];
  return copArabasiProductToEslesmis({}, isim, row);
}

/** Çöp arabası — Portashelf (Yüksel MB126X); fiyat yalnızca ekipmanlar.json */
export async function matchCopArabasiByReferans(
  isim: string,
  _olcu: string,
  _notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const fromShop = await matchFromEkipmanlar(isim);
  if (fromShop) return fromShop;

  const catalog = await loadYukselCopArabasiCatalog();
  const pick = catalog[0];
  if (!pick) {
    if (isCopArabasiReferansIsim(isim)) {
      return copArabasiProductToEslesmis({ name: isim }, isim);
    }
    return null;
  }

  const sku = String(pick.catalog_sku ?? pick.sku_web ?? pick.model_keys?.[0] ?? "").trim();
  const ekipmanRow = sku ? await findEkipmanRowBySku(sku) : null;
  return copArabasiProductToEslesmis(pick, isim, ekipmanRow);
}

export function invalidateCopArabasiCache(): void {
  yukselCopArabasiCache = null;
}
