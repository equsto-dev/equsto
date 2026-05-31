import { dataPath, readJsonFile } from "@/lib/legacy-data";
import { loadLegacyCatalogRows, invalidateLegacyCatalogCache } from "@/lib/legacy-catalog";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { enrichEslesmisFromKatalogRow } from "./catalog-enrich";
import {
  loadZoneCatalog,
} from "./zone-catalog-loader";
import {
  normalizeTipKodu,
  resolveTipKodu,
  TIP_SEARCH_TERMS,
  TIP_SHOP_CATS,
} from "./tip-kodu";

const MIN_SCORE = 72;

type TipShopLink = {
  brand?: string;
  /** Gerçek imalat markası (ör. Rational) — katalog satıcısından farklı */
  marka?: string;
  sku?: string;
  name?: string;
  model?: string;
  /** ekipmanlar.json’da yoksa zone/referans TL fiyat */
  fiyat_try?: number;
};

let shopPoolCache: AdminUrunRow[] | null = null;
let tipLinksCache: Record<string, TipShopLink> | null = null;
let zoneTipMetaCache: Map<
  string,
  { marka?: string; olcu?: string }
> | null = null;

function normName(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isCombiOvenName(name: string): boolean {
  const n = normName(name);
  if (!n) return false;
  const hasCombi =
    n.includes("icombi") ||
    n.includes("kombili") ||
    /\bcombi\b/.test(n) ||
    /\bkombi\b/.test(n) ||
    (n.includes("kombi") && !n.includes("kombin") && !n.includes("kombine"));
  if (!hasCombi && !n.includes("konveks")) return false;
  if (n.includes("buzdolab") || n.includes("dondurucu")) return false;
  if (n.includes("kombi tip") || n.includes("kombine")) return false;
  if (n.includes("blender") || n.includes("mikser")) return false;
  return hasCombi || n.includes("konveks");
}

const TIP_MATCH_RULES: Record<string, (name: string) => boolean> = {
  kombi_firin_6t: isCombiOvenName,
  ocak_4gz: (name) =>
    name.includes("ocak") &&
    name.includes("4") &&
    (name.includes("gozlu") || name.includes("gözlü") || name.includes("göz")),
  bulasik_giyotin_1000: (name) =>
    name.includes("giyotin") &&
    (name.includes("bulasik") || name.includes("bulaşık") || name.includes("tabak")),
  calisma_tezgahi: (name) =>
    name.includes("tezgah") && !name.includes("buzdolab") && !name.includes("evye"),
  davlumbaz_duvar: (name) => name.includes("davlumbaz") && !name.includes("izgar"),
  yer_izgara: (name) =>
    (name.includes("yer izgar") || name.includes("yer ızgar")) &&
    !name.includes("istif") &&
    !name.includes("davlumbaz"),
  fritoz_tek: (name) => name.includes("fritoz") || name.includes("fritöz"),
  filter_coffee: (name) =>
    name.includes("filtre kahve") ||
    name.includes("filter kahve") ||
    (name.includes("filtre") && name.includes("kahve")),
  turk_kahve_cift: (name) =>
    name.includes("turk kahve") ||
    name.includes("türk kahve") ||
    name.includes("atkm") ||
    (name.includes("cezve") && name.includes("kahve")),
  espresso_makinasi: (name) => {
    if (name.includes("filtre") || name.includes("turk kahve")) return false;
    if (name.includes("cikolata") || name.includes("choc")) return false;
    if (name.includes("degirmen") && name.includes("kahve makin")) return false;
    return (
      name.includes("espresso") ||
      name.includes("2 grupl") ||
      name.includes("appia") ||
      name.includes("kahve makinas") ||
      name.includes("kahve makinesi")
    );
  },
  kahve_degirmeni: (name) => {
    if (name.includes("kahve makin") || name.includes("espresso")) return false;
    if (/wmf 1[13]00/.test(name)) return false;
    return (
      name.includes("degirmen") ||
      name.includes("değirmen") ||
      name.includes("grinder") ||
      name.includes("ogut") ||
      name.includes("öğüt")
    );
  },
  bar_buzdolabi: (name) =>
    (name.includes("sis") && name.includes("sogut")) ||
    name.includes("bbc35") ||
    name.includes("icecek sogut") ||
    (name.includes("3") && name.includes("kapili") && name.includes("sogut")),
  derin_dondurucu_dik: (name) => {
    if (name.includes("panel") || name.includes("split") || name.includes("splİt"))
      return false;
    if (name.includes("yatay tip")) return false;
    return (
      (name.includes("dik tip") && name.includes("derin")) ||
      (name.includes("derin dondurucu") && !name.includes("panel"))
    );
  },
};

function isExcludedForTip(name: string, tip: string): boolean {
  const n = normName(name);
  if (tip === "derin_dondurucu_dik") {
    return n.includes("panel") || n.includes("split");
  }
  if (tip === "kahve_degirmeni") {
    return n.includes("kahve makin") || n.includes("espresso") || /wmf 1[13]00/.test(n);
  }
  if (tip === "espresso_makinasi") {
    return n.includes("cikolata") || n.includes("choc") || n.includes("filtre");
  }
  if (tip === "bar_buzdolabi") {
    if (n.includes("gn 6") || n.includes("gn600") || n.includes("lmv")) return true;
    if (
      (n.includes("bar alt") || n.includes("setalti") || n.includes("setaltı")) &&
      !n.includes("sis") &&
      !n.includes("bbc")
    ) {
      return true;
    }
  }
  return false;
}

function itemMatchesTip(row: AdminUrunRow, tipKodu: string): boolean {
  const tip = String(tipKodu || "").trim();
  if (!tip) return false;
  const name = normName(row.ad);
  if (!name) return false;
  if (isExcludedForTip(name, tip)) return false;
  const rule = TIP_MATCH_RULES[tip];
  if (rule) return rule(name);
  const terms = TIP_SEARCH_TERMS[tip] ?? [tip.replace(/_/g, " ")];
  return terms.some((t) => name.includes(normName(t)));
}

function tipDeptHint(tip: string): string {
  if (/buzdolab|sogut|dondurucu|tezgah_tip_buz|dik_tip_buz/.test(tip)) return "sogutma";
  if (/bulasik|yikama|bym_|cop_siyirma/.test(tip)) return "yikama";
  if (/espresso|kahve|filter|turk_kahve/.test(tip)) return "kahve";
  if (/buz_mak/.test(tip)) return "icecek";
  return "pisirme";
}

function deptForRow(row: AdminUrunRow): string {
  const cat = normName(row.kategori);
  if (cat.includes("sogutma") || cat.includes("buzdolab") || cat.includes("dondurucu"))
    return "sogutma";
  if (cat.includes("bulasik") || cat.includes("yikama")) return "yikama";
  if (cat.includes("kahve") || cat.includes("espresso")) return "kahve";
  if (cat.includes("buz")) return "icecek";
  if (cat.includes("hazirlik") || cat.includes("et-hazirlik")) return "hazirlik";
  return "pisirme";
}

async function loadTipShopLinks(): Promise<Record<string, TipShopLink>> {
  if (tipLinksCache) return tipLinksCache;
  const raw = await readJsonFile<{ links?: Record<string, TipShopLink> }>(
    dataPath("pfos-tip-shop-links.json"),
  );
  tipLinksCache = raw?.links ?? {};
  return tipLinksCache;
}

async function loadZoneTipMeta(): Promise<
  Map<string, { marka?: string; olcu?: string }>
> {
  if (zoneTipMetaCache) return zoneTipMetaCache;
  const map = new Map<string, { marka?: string; olcu?: string }>();
  try {
    const bundle = await loadZoneCatalog();
    for (const block of Object.values(bundle.catalog)) {
      for (const p of block.products ?? []) {
        if (!p.tip_kodu) continue;
        const key = normalizeTipKodu(p.tip_kodu);
        if (map.has(key)) continue;
        map.set(key, {
          marka: p.marka,
          olcu: p.dimensions?.trim() || undefined,
        });
      }
    }
  } catch {
    /* zone katalog opsiyonel */
  }
  zoneTipMetaCache = map;
  return map;
}

async function loadShopPool(): Promise<AdminUrunRow[]> {
  if (shopPoolCache) return shopPoolCache;
  const rows = await loadLegacyCatalogRows();
  shopPoolCache = rows.filter((r) => r.fiyat_tl > 0 && r.durum === "aktif");
  return shopPoolCache;
}

function pseudoRowFromLink(link: TipShopLink, tip: string): AdminUrunRow {
  const fiyat = Math.round(Number(link.fiyat_try) || 0);
  return {
    id: `pfos-link-${tip}`,
    ad: link.name ?? link.sku ?? tip,
    sku: link.sku ?? null,
    tip_kodu: tip,
    kategori: "sogutma-ekipmanlari",
    kategori_ad: "Soğutma Ekipmanları",
    marka_id: null,
    marka_ad: link.brand ?? "Öztiryakiler Endüstriyel Mutfak",
    model: link.model ?? null,
    stok: 0,
    fiyat_tl: fiyat,
    el_guc: null,
    gaz_guc: null,
    aciklama: null,
    gorsel_url: null,
    durum: "aktif",
    proje_fab_aktif: true,
    readonly: true,
  };
}

function adminRowToEslesmis(
  row: AdminUrunRow,
  ctx?: {
    tip?: string;
    link?: TipShopLink | null;
    zoneMeta?: { marka?: string; olcu?: string } | null;
  },
): EslesmisUrun {
  const enriched = enrichEslesmisFromKatalogRow(row, {
    linkMarka: ctx?.link?.marka,
    zoneMarka: ctx?.zoneMeta?.marka,
    zoneOlcu: ctx?.zoneMeta?.olcu,
  });
  return {
    id: row.id,
    slug: row.id.replace(/^ecom_/, ""),
    sku: row.sku,
    ad: row.ad,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw: row.el_guc,
    gazGucuKw: row.gaz_guc,
    fiyat: row.fiyat_tl,
    doviz: "TRY",
    gorselUrl: row.gorsel_url,
  };
}

function scoreCandidate(
  row: AdminUrunRow,
  tip: string,
  link: TipShopLink | null,
): number {
  let score = 0;
  const name = normName(row.ad);
  if (!name) return -9999;
  if (isExcludedForTip(name, tip)) return -9999;

  const wantDept = tipDeptHint(tip);
  const gotDept = deptForRow(row);
  if (wantDept && gotDept && wantDept !== gotDept) score -= 520;

  if (link?.sku && row.sku && normName(row.sku) === normName(link.sku)) score += 280;
  if (
    link?.brand &&
    link?.name &&
    normName(row.marka_ad) === normName(link.brand) &&
    normName(row.ad) === normName(link.name)
  ) {
    score += 300;
  }
  if (link?.brand && link?.model && normName(row.marka_ad).includes(normName(link.brand))) {
    const modelNeedle = normName(link.model);
    if (modelNeedle && name.includes(modelNeedle)) score += 260;
  }

  if (row.tip_kodu && normalizeTipKodu(row.tip_kodu) === normalizeTipKodu(tip)) {
    score += 240;
  }

  if (TIP_MATCH_RULES[tip]) {
    score += itemMatchesTip(row, tip) ? 140 : -800;
  } else if (itemMatchesTip(row, tip)) {
    score += 90;
  }

  const cats = TIP_SHOP_CATS[tip];
  if (cats?.length) {
    const cat = normName(row.kategori);
    if (cats.some((c) => cat.includes(normName(c)))) score += 45;
  }

  if (row.gorsel_url) score += 18;

  return score;
}

function pickByStrategy(
  candidates: AdminUrunRow[],
  fiyatStratejisi: FiyatStratejisi,
): AdminUrunRow {
  const sorted = [...candidates].sort((a, b) => a.fiyat_tl - b.fiyat_tl);
  if (fiyatStratejisi === "premium") return sorted[sorted.length - 1];
  if (fiyatStratejisi === "orta") return sorted[Math.floor(sorted.length / 2)];
  return sorted[0];
}

/**
 * ekipmanlar.json üzerinden PFOS tip eşleşmesi (legacy findShopMatch ile hizalı).
 * Canlı e-ticaret fiyatı (fiyat_tl) döner.
 */
export async function matchShopCatalog(
  urunTipi: string,
  fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const tip = resolveTipKodu(urunTipi);
  if (!tip) return null;

  const [pool, links, zoneMetaMap] = await Promise.all([
    loadShopPool(),
    loadTipShopLinks(),
    loadZoneTipMeta(),
  ]);
  const link = links[tip] ?? null;
  const zoneMeta = zoneMetaMap.get(normalizeTipKodu(tip)) ?? null;
  const ctx = { tip, link, zoneMeta };

  if (link?.sku) {
    const bySku = pool.find(
      (r) => r.sku && normName(r.sku) === normName(link.sku!),
    );
    if (bySku) return adminRowToEslesmis(bySku, ctx);
    if (link.name || link.brand) {
      return adminRowToEslesmis(pseudoRowFromLink(link, tip), ctx);
    }
  }
  if (link?.name) {
    const needle = normName(link.name);
    const byName = pool.find((r) => normName(r.ad) === needle);
    if (byName) return adminRowToEslesmis(byName, ctx);
  }

  const scored: { row: AdminUrunRow; score: number }[] = [];
  for (const row of pool) {
    const score = scoreCandidate(row, tip, link);
    if (score >= MIN_SCORE) scored.push({ row, score });
  }

  if (!scored.length) return null;

  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const topTier = scored.filter((s) => s.score >= topScore - 8);
  const picked = pickByStrategy(
    topTier.map((s) => s.row),
    fiyatStratejisi,
  );
  return adminRowToEslesmis(picked, ctx);
}

export function clearShopCatalogCache(): void {
  shopPoolCache = null;
  tipLinksCache = null;
  zoneTipMetaCache = null;
  invalidateLegacyCatalogCache();
}
