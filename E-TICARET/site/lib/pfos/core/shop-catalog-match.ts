import { readJsonFile } from "@/lib/legacy-data";
import {
  loadLegacyCatalogRows,
  invalidateLegacyCatalogCache,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { enrichEslesmisFromKatalogRow } from "./catalog-enrich";
import { invalidateKatalogGorselCache } from "./katalog-gorsel";
import { katalogRowToEslesmis } from "./katalog-row-eslesmis";
import {
  isBulasikMakinesiTipKodu,
  BULASIK_MARKA,
} from "./bulasik-marka";
import {
  isIstifRafiTipKodu,
  isCopArabasiTipKodu,
  PORTASHELF_MARKA,
} from "./portashelf-marka";
import {
  isCalismaTezgahiTipKodu,
  isEqustoTezgahRow,
  isPimakTezgahSku,
  isSetUstuAraTezgahKatalog,
  CALISMA_TEZGAH_MARKA,
} from "./calisma-tezgah";
import {
  isEqustoDavlumbazRow,
  isPimakDavlumbazSku,
  isOztiDavlumbazSku,
} from "./davlumbaz-marka";
import {
  isDuvarRafiTipKodu,
  isEqustoDuvarRafRow,
  isEqustoDuvarRafSku,
} from "./duvar-raf-marka";
import { isEqustoFiyatListesiSku } from "./equsto-fiyat-sku";
import {
  isBuzdolabiTipKodu,
  isPortabiancoBuzdolabiRow,
} from "./portabianco-marka";
import { isOztiBuzdolabiRow, isOztiPisirmeRow, OZTI_MARKA } from "./ozti-marka";
import {
  isTeshirVitrinTipKodu,
  isCaglayanTeshirRow,
  isOztiTeshirSku,
} from "./caglayan-marka";
import {
  isPisirmeTipKodu,
  isAtalayPisirmeRow,
} from "./atalay-marka";
import {
  isHazirlikTipKodu,
  HAZIRLIK_MARKA,
  isHazirlikKatalogMarka,
  isOztiKatalogMarka,
} from "./hazirlik-marka";
import { isSenoxVakumTipKodu } from "./senox-marka";
import {
  loadZoneCatalog,
} from "./zone-catalog-loader";
import {
  normalizeTipKodu,
  resolveTipKodu,
  TIP_SEARCH_TERMS,
  TIP_SHOP_CATS,
} from "./tip-kodu";

/** Katalog Equsto satış EUR — ekipmanlar.json satis_fiyat_eur / satis_eur_indirimli */
export function equstoSatisEurFromRow(row: AdminUrunRow): number | null {
  const eur = Number(row.satis_fiyat_eur);
  if (eur > 0) return Math.round(eur * 100) / 100;
  const fromSpecs = String(row.aciklama ?? "").match(
    /Equsto\s+net\s*\([^)]*\)\s*:\s*([\d.,]+)/i,
  );
  if (fromSpecs) {
    const parsed = Number(fromSpecs[1].replace(",", "."));
    if (parsed > 0) return Math.round(parsed * 100) / 100;
  }
  return null;
}

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
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Unox fırın üstü davlumbaz — PFOS özel imalat / duvar tipi eşleşmesine girmesin */
function isUnoxCheftopHoodName(name: string): boolean {
  const n = normName(name);
  return (
    n.includes("eech") ||
    n.includes("cheftop") ||
    n.includes("cheft") ||
    (n.includes("unox") && n.includes("davlumbaz"))
  );
}

function isCombiOvenName(name: string): boolean {
  const n = normName(name);
  if (!n) return false;
  if (n.includes("buzdolab") || n.includes("dondurucu")) return false;
  if (n.includes("kombi tip") || n.includes("kombine")) return false;
  if (n.includes("blender") || n.includes("mikser")) return false;
  if (n.includes("mikrodalga")) return false;
  return (
    n.includes("icombi") ||
    n.includes("kombili") ||
    /\bcombi\b/.test(n) ||
    (n.includes("kombi") &&
      !n.includes("kombin") &&
      !n.includes("kombine") &&
      n.includes("firin"))
  );
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
    name.includes("tezgah") &&
    !name.includes("buzdolab") &&
    !name.includes("set ust") &&
    !name.includes("setust") &&
    !name.includes("ara tezgah") &&
    !/firin\s*stand|fırın\s*stand|firin\s*alt\s*tezgah|fırın\s*alt\s*tezgah/.test(name),
  tezgah_taban_rafli: (name) =>
    /firin\s*stand|fırın\s*stand|firin\s*alt\s*tezgah|fırın\s*alt\s*tezgah/.test(name) ||
    (/konveksiyonlu\s*firin\s*stand|setustu\s*konveksiyonlu\s*firin\s*stand/.test(name) &&
      /tepsi|istif|raf/.test(name)),
  tezgah_rafli_dol: (name) =>
    /taban\s*ve\s*ara\s*rafl/.test(name) &&
    /dolap/.test(name) &&
    (/calisma|çalışma|tezgah/.test(name)),
  balik_hazirlik_tezgah: (name) =>
    (/balik|balık/.test(name) && /hazirlik|hazırlık|tezgah/.test(name)) ||
    /balik\s*hazirlik|balık\s*hazırlık/.test(name),
  davlumbaz_dekoratif: (name) =>
    /firin\s*davlumbaz|fırın\s*davlumbaz/.test(name) ||
    (name.includes("davlumbaz") && name.includes("dekoratif")),
  davlumbaz_duvar: (name) => {
    if (isUnoxCheftopHoodName(name)) return false;
    if (/firin\s*davlumbaz|fırın\s*davlumbaz/.test(name)) return false;
    if (name.includes("ultravent") || name.includes("yogusturma")) return false;
    return (
      name.includes("davlumbaz") &&
      (name.includes("duvar") || name.includes("duvar tipi")) &&
      !name.includes("izgar")
    );
  },
  yer_izgara: (name) =>
    (name.includes("yer izgar") || name.includes("yer ızgar")) &&
    !name.includes("istif") &&
    !name.includes("davlumbaz"),
  servis_rafi: (name) =>
    (name.includes("servis raf") || name.includes("servis rafı")) &&
    !name.includes("arab") &&
    !name.includes("banko") &&
    !name.includes("unite") &&
    !name.includes("ünite"),
  fritoz_dolapli_elk: (name) =>
    (name.includes("fritoz") || name.includes("fritöz")) &&
    name.includes("dolap") &&
    (name.includes("elektrik") || name.includes("elek")),
  fritoz_dolapli_gaz: (name) =>
    (name.includes("fritoz") || name.includes("fritöz")) &&
    name.includes("dolap") &&
    (name.includes("gazli") || name.includes("gazlı") || /\bgaz\b/.test(name)),
  fritoz_tek: (name) =>
    (name.includes("fritoz") || name.includes("fritöz")) && !name.includes("dolap"),
  tost_makinasi: (name) =>
    name.includes("tost") &&
    (name.includes("atm") || name.includes("atalay") || name.includes("tost mak")),
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
  bar_blender: (name) =>
    name.includes("blender") &&
    !name.includes("mikrodalga") &&
    !name.includes("robot coupe el blenderi cmp"),
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
  benmari_mobil: (name) => {
    return (
      (name.includes("benmari") || name.includes("bain marie") || name.includes("bainmarie")) &&
      (name.includes("hareket") || name.includes("mobil") || name.includes("taban raf"))
    );
  },
  banket_arabasi: (name) => {
    return (
      name.includes("banket") &&
      (name.includes("araba") || name.includes("isitmali") || name.includes("ısıtmalı") || name.includes("sıcak") || name.includes("sicak"))
    );
  },
};

function isExcludedForTip(name: string, tip: string): boolean {
  const n = normName(name);
  if (/^davlumbaz/.test(tip.replace(/_/g, "-")) && isUnoxCheftopHoodName(n)) {
    return true;
  }
  if (tip === "derin_dondurucu_dik") {
    return n.includes("panel") || n.includes("split");
  }
  if (tip === "benmari_mobil") {
    return n.replace(/kuvetler?\s*hari[cç]/g, "").includes("kuvet") || n.includes("kapak") || n.includes("sos");
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

/** Tip sözlüğü senkronu — katalog satırı bu tip_kodu ile eşleşiyor mu */
export function productMatchesTipKodu(row: AdminUrunRow, tipKodu: string): boolean {
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
  if (isHazirlikTipKodu(tip)) return "hazirlik";
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
    "pfos-tip-shop-links.json",
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
  const hazirlik = isHazirlikTipKodu(tip);
  const bulasik = isBulasikMakinesiTipKodu(tip);
  return {
    id: `pfos-link-${tip}`,
    equsto_kod: null,
    marka_kodu: null,
    urun_kodu: null,
    ad: link.name ?? link.sku ?? tip,
    sku: link.sku ?? null,
    tip_kodu: tip,
    kategori: hazirlik
      ? "et-hazirlik-makineleri"
      : bulasik
        ? "bulasik-yikama-makineleri"
        : "sogutma-ekipmanlari",
    kategori_ad: hazirlik
      ? "Et Hazırlık Makineleri"
      : bulasik
        ? "Bulaşık Yıkama Makineleri"
        : "Soğutma Ekipmanları",
    marka_id: null,
    marka_ad:
      link.brand ??
      (hazirlik
        ? "Boğaziçi Makine"
        : bulasik
          ? "Inoksan"
          : "Öztiryakiler Endüstriyel Mutfak"),
    model: link.model ?? null,
    stok: 0,
    fiyat_tl: fiyat,
    el_guc: null,
    gaz_guc: null,
    aciklama: null,
    detay: null,
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
  return katalogRowToEslesmis(row, {
    linkMarka: ctx?.link?.marka,
    zoneMarka: ctx?.zoneMeta?.marka,
    zoneOlcu: ctx?.zoneMeta?.olcu,
  });
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

  if (isBulasikMakinesiTipKodu(tip)) {
    const marka = normName(row.marka_ad);
    const sku = normName(row.sku ?? "");
    if (!marka.includes("inoksan") && !sku.startsWith("ino-")) score -= 2500;
  }

  if (isHazirlikTipKodu(tip)) {
    if (isOztiKatalogMarka(row.marka_ad)) return -9999;
    if (isHazirlikKatalogMarka(row.marka_ad)) score += 220;
    if (name.includes("bogazici") || name.includes("boğaziçi")) score += 120;
  }

  if (isSenoxVakumTipKodu(tip)) {
    if (isOztiKatalogMarka(row.marka_ad)) return -9999;
    if (name.includes("senox") || name.includes("şenox")) score += 300;
  }

  if (isIstifRafiTipKodu(tip)) {
    const sku = normName(row.sku ?? "");
    if (/8897\.|7897\./.test(sku)) return -9999;
    if (isOztiKatalogMarka(row.marka_ad) && !/^\d+-x-\d+-x-\d+/.test(sku)) {
      return -9999;
    }
    const marka = normName(row.marka_ad);
    if (marka.includes("portashelf") || /^\d+-x-\d+-x-\d+/.test(sku)) {
      score += 320;
    }
  }

  if (isCopArabasiTipKodu(tip)) {
    if (isOztiKatalogMarka(row.marka_ad)) return -9999;
    const marka = normName(row.marka_ad);
    const sku = normName(row.sku ?? "");
    if (marka.includes("portashelf") || marka.includes("yuksel") || sku === "mb126x") {
      score += 320;
    } else if (/8893\.|plastik|kova/.test(sku) || /plastik|kova/.test(name)) {
      score -= 2500;
    }
  }

  if (isCalismaTezgahiTipKodu(tip)) {
    if (isSetUstuAraTezgahKatalog(row.ad, row.sku)) return -9999;
    const skuN = normName(row.sku ?? "");
    if (/electrolux|^132\d{3,6}$|371\d|^7711\.|^7897\.|^7911\./.test(skuN) || /electrolux/.test(normName(row.marka_ad))) {
      return -9999;
    }
    if (isOztiKatalogMarka(row.marka_ad) && /7911\.n1\./.test(skuN)) {
      return -9999;
    }
    if (isPimakTezgahSku(row.sku)) score += 920;
    else if (isEqustoFiyatListesiSku(row.sku)) score += 800;
    else if (isEqustoTezgahRow(row.sku, row.ad)) score += 350;
    else return -9999;
  }

  if (
    isCalismaTezgahiTipKodu(tip) === false &&
    /calisma|çalışma|evyeli\s*tezgah|taban\s*rafl/i.test(name) &&
    isOztiKatalogMarka(row.marka_ad) &&
    /7911\.n1\./.test(normName(row.sku ?? ""))
  ) {
    return -9999;
  }

  if (tip === "davlumbaz_duvar" || /^davlumbaz/.test(tip.replace(/_/g, "-"))) {
    if (isOztiDavlumbazSku(row.sku) || (isOztiKatalogMarka(row.marka_ad) && /7885\./.test(normName(row.sku ?? "")))) {
      return -9999;
    }
    if (isPimakDavlumbazSku(row.sku)) score += 920;
    else if (isEqustoFiyatListesiSku(row.sku)) score += 800;
    else if (isEqustoDavlumbazRow(row.sku, row.ad)) score += 350;
    else return -9999;
  }

  if (isDuvarRafiTipKodu(tip)) {
    const skuN = normName(row.sku ?? "");
    if (/^7897\./.test(skuN)) return -9999;
    if (isOztiKatalogMarka(row.marka_ad) && /^7897\./.test(skuN)) return -9999;
    if (isEqustoDuvarRafSku(row.sku)) score += 800;
    else if (isEqustoDuvarRafRow(row.sku, row.ad)) score += 350;
    else return -9999;
  }

  if (isBuzdolabiTipKodu(tip)) {
    const sku = normName(row.sku ?? "");
    if (
      (isPortabiancoBuzdolabiRow(row) || /^TT-|^DT-|^CA-|^BAR-|^SBT-|^SBM-/.test(sku)) &&
      !isOztiBuzdolabiRow(row)
    ) {
      return -9999;
    }
    if (/^7919\.|^8919\.|^79e4\./.test(sku) && isOztiBuzdolabiRow(row)) {
      score += 350;
    }
  }

  if (isPisirmeTipKodu(tip)) {
    const sku = normName(row.sku ?? "");
    if (
      (isAtalayPisirmeRow(row) || /^AEF-|^AEI-|^AGO-|^AAT-/.test(sku)) &&
      !isOztiPisirmeRow(row)
    ) {
      return -9999;
    }
    if (/^78\d{2}\./.test(sku) && isOztiPisirmeRow(row)) {
      score += 350;
    }
  }
  if (isTeshirVitrinTipKodu(tip)) {
    const sku = normName(row.sku ?? "");
    if (isOztiTeshirSku(row.sku) || (isOztiKatalogMarka(row.marka_ad) && /8919\.ts/.test(sku))) {
      return -9999;
    }
    if (isCaglayanTeshirRow(row)) score += 350;
  }

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
    score += productMatchesTipKodu(row, tip) ? 140 : -800;
  } else if (productMatchesTipKodu(row, tip)) {
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

  /** Bulaşık yıkama makineleri — İnoksan referans; Electrolux/Öztiryakiler havuzundan seçilmesin */
  if (isBulasikMakinesiTipKodu(tip) && link && (link.marka || link.name || link.sku)) {
    const bulLink: TipShopLink = {
      marka: link.marka ?? BULASIK_MARKA,
      ...link,
    };
    if (bulLink.sku) {
      const bySku = pool.find(
        (r) => r.sku && normName(r.sku) === normName(bulLink.sku!),
      );
      if (bySku) return adminRowToEslesmis(bySku, { ...ctx, link: bulLink });
    }
    return adminRowToEslesmis(pseudoRowFromLink(bulLink, tip), {
      ...ctx,
      link: bulLink,
    });
  }

  /** Yerden çalışma tezgahı — EQUSTO eşlemesi; set üstü ara tezgah SKU kullanılmaz */
  if (isCalismaTezgahiTipKodu(tip) && link?.marka) {
    return null;
  }

  /** Davlumbaz — EQUSTO ölçü/tip eşlemesi; Öztiryakiler 7885.* kullanılmaz */
  if ((tip === "davlumbaz_duvar" || /^davlumbaz/.test(tip.replace(/_/g, "-"))) && link?.marka) {
    return null;
  }

  /** Buzdolabı — Öztiryakiler ölçü/tip eşlemesi; Portabianco kullanılmaz */
  if (isBuzdolabiTipKodu(tip) && link?.marka) {
    return null;
  }

  /** Teşhir reyonu — Çağlayan Soğutma ölçü eşlemesi; Öztiryakiler TSV kullanılmaz */
  if (isTeshirVitrinTipKodu(tip) && link?.marka) {
    return null;
  }

  /** Pişirme — Öztiryakiler ölçü/tip eşlemesi; Atalay kullanılmaz */
  if (isPisirmeTipKodu(tip) && (link?.marka || link?.sku)) {
    if (link.sku && isOztiPisirmeRow({ sku: link.sku, marka_ad: link.brand ?? link.marka })) {
      const bySku = pool.find(
        (r) => r.sku && normName(r.sku) === normName(link.sku!),
      );
      if (bySku) {
        return adminRowToEslesmis(bySku, {
          ...ctx,
          link: { ...link, marka: OZTI_MARKA },
        });
      }
    }
    if (!link.sku || isAtalayPisirmeRow({ sku: link.sku, marka_ad: link.brand ?? link.marka })) {
      return null;
    }
  }

  /** Çöp arabası — Portashelf (Yüksel); Öztiryakiler plastik kova kullanılmaz */
  if (isCopArabasiTipKodu(tip) && link && (link.marka || link.name || link.sku)) {
    const psLink: TipShopLink = {
      marka: link.marka ?? PORTASHELF_MARKA,
      ...link,
    };
    if (psLink.sku) {
      const bySku = pool.find(
        (r) => r.sku && normName(r.sku) === normName(psLink.sku!),
      );
      if (bySku) return adminRowToEslesmis(bySku, { ...ctx, link: psLink });
    }
    return adminRowToEslesmis(pseudoRowFromLink(psLink, tip), {
      ...ctx,
      link: psLink,
    });
  }

  /** İstif rafları — Portashelf; Öztiryakiler havuzundan seçilmesin */
  if (isIstifRafiTipKodu(tip) && link && (link.marka || link.name || link.sku)) {
    const psLink: TipShopLink = {
      marka: link.marka ?? PORTASHELF_MARKA,
      ...link,
    };
    if (psLink.sku) {
      const bySku = pool.find(
        (r) => r.sku && normName(r.sku) === normName(psLink.sku!),
      );
      if (bySku) return adminRowToEslesmis(bySku, { ...ctx, link: psLink });
    }
    return adminRowToEslesmis(pseudoRowFromLink(psLink, tip), {
      ...ctx,
      link: psLink,
    });
  }

  /** Hazırlık makineleri — Boğaziçi referans; katalog havuzundan Öztiryakiler seçilmesin */
  if (isHazirlikTipKodu(tip) && link && (link.marka || link.name || link.sku)) {
    const hazLink: TipShopLink = {
      marka: link.marka ?? HAZIRLIK_MARKA,
      ...link,
    };
    if (hazLink.sku) {
      const bySku = pool.find(
        (r) => r.sku && normName(r.sku) === normName(hazLink.sku!),
      );
      if (bySku) return adminRowToEslesmis(bySku, { ...ctx, link: hazLink });
    }
    return adminRowToEslesmis(pseudoRowFromLink(hazLink, tip), {
      ...ctx,
      link: hazLink,
    });
  }

  if (link?.sku) {
    const bySku = pool.find(
      (r) => r.sku && normName(r.sku) === normName(link.sku!),
    );
    if (bySku && productMatchesTipKodu(bySku, tip)) {
      return adminRowToEslesmis(bySku, ctx);
    }
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
  invalidateKatalogGorselCache();
}
