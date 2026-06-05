import fs from "node:fs/promises";
import { readJsonFile } from "@/lib/legacy-data";
import { loadLegacyCatalogRows, type AdminUrunRow } from "@/lib/legacy-catalog";
import { productMatchesTipKodu } from "@/lib/pfos/core/shop-catalog-match";
import {
  normalizeTipKodu,
  resolveTipKodu,
  TIP_SEARCH_TERMS,
  URUN_TIPI_ALIASES,
} from "@/lib/pfos/core/tip-kodu";
import { inferUrunTipiFromReferansSatir } from "@/lib/pfos/referans/infer-urun-tipi";
import type { TipSozlukEntry } from "./types";
import { loadTipSozluguEntries, parseAdminHtmlSeed } from "./store";

const DEPT_KAT: Record<string, string> = {
  pisirme: "pisirme",
  sogutma: "sogutma",
  icecek: "icecek",
  kahve: "icecek",
  yikama: "yikama",
  hazirlik: "hazirlik",
  davlumbaz: "tezgah_davlumbaz",
  tezgah: "tezgah_davlumbaz",
  araba: "araba",
  istif: "depolama",
  tasima: "araba",
  dolap: "depolama",
  "set-ustu-mutfak": "pisirme",
  "market-reyon": "diger",
};

function deptToKategori(row: AdminUrunRow): string {
  const dept = String(row.kategori || "").trim().toLowerCase();
  if (DEPT_KAT[dept]) return DEPT_KAT[dept];
  if (dept.includes("sogutma") || dept.includes("buzdolab")) return "sogutma";
  if (dept.includes("bulasik") || dept.includes("yikama")) return "yikama";
  if (dept.includes("kahve")) return "icecek";
  if (dept.includes("hazirlik")) return "hazirlik";
  return "diger";
}

function mergeEntry(
  map: Map<string, TipSozlukEntry>,
  partial: Omit<TipSozlukEntry, "frekans"> & { frekans?: number },
) {
  const key = normalizeTipKodu(partial.tip_kodu);
  if (!key) return;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, {
      tip_kodu: key,
      aciklama: partial.aciklama || key,
      kategori: partial.kategori || "diger",
      alt_kategori: partial.alt_kategori ?? null,
      kaynak: partial.kaynak || "seed",
      frekans: partial.frekans ?? 0,
    });
    return;
  }
  if (partial.aciklama && (partial.aciklama.length > prev.aciklama.length || prev.aciklama === key)) {
    prev.aciklama = partial.aciklama;
  }
  if (partial.kategori && partial.kategori !== "diger") prev.kategori = partial.kategori;
  if (partial.alt_kategori) prev.alt_kategori = partial.alt_kategori;
  if (partial.kaynak === "api" || partial.kaynak === "import") prev.kaynak = partial.kaynak;
  if ((partial.frekans ?? 0) > prev.frekans) prev.frekans = partial.frekans ?? 0;
}

async function loadPfosLinks(): Promise<Record<string, { name?: string }>> {
  const raw = await readJsonFile<{ links?: Record<string, { name?: string }> }>(
    "pfos-tip-shop-links.json",
  );
  return raw?.links ?? {};
}

function aciklamaFromSearchTerms(tip: string): string {
  const terms = TIP_SEARCH_TERMS[tip];
  if (!terms?.length) return tip.replace(/_/g, " ");
  return terms.slice(0, 3).join(" · ");
}

export async function rebuildTipSozlugu(): Promise<{
  entries: TipSozlukEntry[];
  stats: Record<string, number>;
}> {
  const map = new Map<string, TipSozlukEntry>();
  const stats = {
    onceki: 0,
    admin_seed: 0,
    search_terms: 0,
    aliases: 0,
    pfos_links: 0,
    katalog_eslesme: 0,
    infer_yeni: 0,
  };

  for (const row of await loadTipSozluguEntries()) {
    stats.onceki++;
    mergeEntry(map, row);
  }

  for (const row of await parseAdminHtmlSeed()) {
    stats.admin_seed++;
    mergeEntry(map, { ...row, kaynak: row.kaynak || "P1" });
  }

  for (const tip of Object.keys(TIP_SEARCH_TERMS)) {
    stats.search_terms++;
    mergeEntry(map, {
      tip_kodu: tip,
      aciklama: aciklamaFromSearchTerms(tip),
      kategori: "pisirme",
      kaynak: "motor",
    });
  }

  for (const [alias, canonical] of Object.entries(URUN_TIPI_ALIASES)) {
    stats.aliases++;
    const tip = resolveTipKodu(canonical);
    mergeEntry(map, {
      tip_kodu: tip,
      aciklama: aciklamaFromSearchTerms(tip),
      kategori: "pisirme",
      kaynak: "alias",
    });
    mergeEntry(map, {
      tip_kodu: resolveTipKodu(alias),
      aciklama: alias,
      kategori: "pisirme",
      kaynak: "alias",
    });
  }

  const links = await loadPfosLinks();
  for (const [tip, link] of Object.entries(links)) {
    stats.pfos_links++;
    mergeEntry(map, {
      tip_kodu: resolveTipKodu(tip),
      aciklama: link.name || aciklamaFromSearchTerms(tip),
      kategori: "pisirme",
      kaynak: "pfos-link",
    });
  }

  const rows = await loadLegacyCatalogRows();
  const sampleName = new Map<string, string>();
  const tipKeys = [...map.keys()];

  for (const row of rows) {
    if (row.durum !== "aktif" || row.fiyat_tl <= 0) continue;
    const kat = deptToKategori(row);

    for (const tip of tipKeys) {
      if (!productMatchesTipKodu(row, tip)) continue;
      const ent = map.get(tip)!;
      ent.frekans += 1;
      stats.katalog_eslesme++;
      if (!sampleName.has(tip)) sampleName.set(tip, row.ad);
      if (ent.kategori === "diger" || ent.kategori === "pisirme") ent.kategori = kat;
    }

    const inferred = resolveTipKodu(
      inferUrunTipiFromReferansSatir({
        bolum: "",
        bolumAd: "",
        poz: row.kategori || "",
        ad: row.ad,
        olcu: "",
        adet: 1,
      }),
    );
    if (inferred.startsWith("pfos_")) continue;
    if (!map.has(inferred)) {
      stats.infer_yeni++;
      mergeEntry(map, {
        tip_kodu: inferred,
        aciklama: row.ad.slice(0, 120),
        kategori: kat,
        kaynak: "infer",
        frekans: 1,
      });
      sampleName.set(inferred, row.ad);
    }
  }

  for (const [tip, name] of sampleName) {
    const ent = map.get(tip);
    if (ent && (ent.aciklama === tip || ent.aciklama.length < 8)) {
      ent.aciklama = name.slice(0, 160);
    }
  }

  const entries = [...map.values()].sort((a, b) => {
    if (b.frekans !== a.frekans) return b.frekans - a.frekans;
    return a.tip_kodu.localeCompare(b.tip_kodu, "tr");
  });

  return { entries, stats };
}
