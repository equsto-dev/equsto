#!/usr/bin/env node
/**
 * Tezgah departmanı — markalar arası eşleşen ürün fiyat karşılaştırması.
 * Eşleşme: aynı ölçü (G×D×Y mm) + aynı varyant tipi.
 *
 *   node scripts/compare-tezgah-marka-fiyat.mjs
 *   node scripts/compare-tezgah-marka-fiyat.mjs --csv scripts/out/tezgah-marka-fiyat.csv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/tezgah.json");
const OUT_DIR = path.join(ROOT, "scripts/out");

const VARIANT_SUFFIX = {
  "00": "alt_tablasiz",
  "04": "taban_ara_rafli",
  "08": "taban_rafli",
  "11": "tek_evyeli",
  "12": "cift_evyeli",
  "13": "dolapli",
  "15": "hareketli_taban_ara",
  "17": "uc_evyeli",
  "31": "cop_siyirma",
  "46": "mermer_taban_rafli",
  "50": "mermer_tablali",
  "51": "polietilen_taban_rafli",
  "56": "dolapli_blok_cekmeceli",
  "70": "hareketli_taban_rafli",
};

const VARIANT_LABEL = {
  alt_tablasiz: "Alt tablasız çalışma tezgahı",
  taban_ara_rafli: "Taban ve ara raflı",
  taban_rafli: "Taban raflı",
  tek_evyeli: "Tek evyeli",
  cift_evyeli: "Çift evyeli",
  uc_evyeli: "Üç evyeli",
  dolapli: "Dolaplı",
  hareketli_taban_ara: "Hareketli — taban ve ara raflı",
  hareketli_taban_rafli: "Hareketli — taban raflı",
  cop_siyirma: "Çöp sıyırma / süzme",
  mermer_taban_rafli: "Mermer tablalı — taban raflı",
  mermer_tablali: "Mermer tablalı",
  polietilen_taban_rafli: "Polietilen tablalı — taban raflı",
  dolapli_blok_cekmeceli: "Dolaplı blok çekmeceli",
  tek_cekmeceli_acik: "Tek çekmeceli — etrafı açık rafsız (KÇT02)",
  diger: "Diğer / sınıflandırılamadı",
};

function norm(s) {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDims(row) {
  if (row.olcu_etiket) {
    const nums = [...String(row.olcu_etiket).matchAll(/(\d+(?:[.,]\d+)?)/g)]
      .map((m) => Math.round(Number(m[1].replace(",", "."))))
      .filter((n) => n >= 40 && n <= 10000);
    if (nums.length >= 3) return [nums[0], nums[1], nums[2]];
    if (nums.length >= 2) return [nums[0], nums[1], 850];
  }
  const o = row.olculer;
  if (o && typeof o === "object") {
    const w = Math.round(Number(o.genislik_mm || o.uzunluk_mm || 0));
    const d = Math.round(Number(o.derinlik_mm || o.uzunluk_mm || 0));
    const h = Math.round(Number(o.yukseklik_mm || 0));
    if (w >= 40 && d >= 40 && h >= 40) {
      if (o.genislik_mm && o.uzunluk_mm && !o.derinlik_mm) {
        return [Math.round(o.genislik_mm), Math.round(o.uzunluk_mm), h || 850];
      }
      return [w, d, h];
    }
  }
  const name = String(row.name || "");
  const triple = name.match(/(\d{3,4})\s*[×x*]\s*(\d{3,4})\s*[×x*]\s*(\d{2,4})/i);
  if (triple) {
    return [Number(triple[1]), Number(triple[2]), Number(triple[3])];
  }
  const dbl = name.match(/(\d{3,4})\s*[×x*]\s*(\d{3,4})/i);
  if (dbl) return [Number(dbl[1]), Number(dbl[2]), 850];

  const pimakMid = String(row.sku || "").match(/^PIMAK\.(\d{3})(\d{2})\./i);
  if (pimakMid) {
    const w = Number(pimakMid[1]) * 10;
    const d = Number(pimakMid[2]) * 10;
    return [w, d, 850];
  }
  const kct = String(row.sku || "").match(/KCT02\.(\d{2})(\d{2})/i);
  if (kct) {
    return [Number(kct[1]) * 100, Number(kct[2]) * 10, 850];
  }
  return null;
}

function variantFromRow(row) {
  const sku = String(row.sku || "");
  const pimakSuf = sku.match(/^PIMAK\.\d{5}\.(\d{2})$/i)?.[1];
  if (pimakSuf && VARIANT_SUFFIX[pimakSuf]) return VARIANT_SUFFIX[pimakSuf];

  if (/KCT02/i.test(sku) || /tek\s*cekmeceli.*acik|etraf[iı]\s*acik.*rafsiz/i.test(norm(row.name))) {
    return "tek_cekmeceli_acik";
  }

  const n = norm(`${row.name} ${row.category || ""}`);
  if (/cop\s*siyirma|suzme\s*havuz|balik\s*hazir/.test(n)) return "cop_siyirma";
  if (/polietilen/.test(n)) return "polietilen_taban_rafli";
  if (/mermer/.test(n) && /taban\s*rafl/.test(n)) return "mermer_taban_rafli";
  if (/mermer/.test(n)) return "mermer_tablali";
  if (/uc\s*evy|3\s*evy/.test(n)) return "uc_evyeli";
  if (/cift\s*evy|iki\s*evy/.test(n)) return "cift_evyeli";
  if (/tek\s*evy/.test(n)) return "tek_evyeli";
  if (/blok\s*cekmec|ara\s*rafl[iı]\s*blok/.test(n)) return "dolapli_blok_cekmeceli";
  if (/dolap/.test(n)) return "dolapli";
  if (/hareketli/.test(n) && /ara\s*rafl/.test(n)) return "hareketli_taban_ara";
  if (/hareketli/.test(n)) return "hareketli_taban_rafli";
  if (/taban\s*ve\s*ara\s*rafl/.test(n)) return "taban_ara_rafli";
  if (/taban\s*rafl/.test(n)) return "taban_rafli";
  if (/alt\s*tablasiz|tablasiz/.test(n)) return "alt_tablasiz";
  return "diger";
}

function dimKey(dims) {
  return dims.join("x");
}

function pctDiff(a, b) {
  if (!a || !b) return null;
  return Math.round(((b - a) / a) * 1000) / 10;
}

function fmtTry(n) {
  if (!Number.isFinite(n)) return "—";
  return `₺${Math.round(n).toLocaleString("tr-TR")}`;
}

const rows = JSON.parse(fs.readFileSync(DEPT, "utf8"));
const enriched = [];
const skipped = { noDim: 0, noPrice: 0 };

for (const row of rows) {
  const dims = parseDims(row);
  const fiyat = Number(row.fiyat_tl);
  if (!dims) {
    skipped.noDim++;
    continue;
  }
  if (!(fiyat > 0)) {
    skipped.noPrice++;
    continue;
  }
  const variant = variantFromRow(row);
  enriched.push({
    brand: row.brand,
    sku: row.sku || row.model,
    name: row.name,
    dims,
    dimLabel: `${dims[0]}×${dims[1]}×${dims[2]} mm`,
    variant,
    variantLabel: VARIANT_LABEL[variant] || variant,
    fiyat_tl: fiyat,
    kaynak: row.kaynak || "",
    id: row.id,
    href: `/shop/tezgah/${String(row.id || "").replace(/^[^_]+__/, "").toLowerCase()}`,
  });
}

const groups = new Map();
for (const r of enriched) {
  const key = `${r.variant}|${dimKey(r.dims)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const multiBrand = [];
const sameBrandDupes = [];

for (const [key, items] of groups) {
  const brands = [...new Set(items.map((i) => i.brand))];
  if (brands.length >= 2) {
    items.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
    const min = items[0];
    const max = items[items.length - 1];
    multiBrand.push({
      key,
      variant: items[0].variant,
      variantLabel: items[0].variantLabel,
      dimLabel: items[0].dimLabel,
      brands,
      count: items.length,
      items,
      minFiyat: min.fiyat_tl,
      maxFiyat: max.fiyat_tl,
      spreadPct: pctDiff(min.fiyat_tl, max.fiyat_tl),
      spreadTry: max.fiyat_tl - min.fiyat_tl,
    });
  } else if (items.length > 1) {
    sameBrandDupes.push({ key, brand: brands[0], count: items.length });
  }
}

multiBrand.sort((a, b) => b.spreadTry - a.spreadTry);

const brandStats = {};
for (const r of enriched) {
  (brandStats[r.brand] ||= { n: 0, withMatch: 0 }).n++;
}
for (const g of multiBrand) {
  for (const b of g.brands) {
    if (brandStats[b]) brandStats[b].withMatch++;
  }
}

console.log("═══════════════════════════════════════════════════════════");
console.log(" TEZGAH MARKA FİYAT KARŞILAŞTIRMASI");
console.log("═══════════════════════════════════════════════════════════");
console.log(`Kaynak: public/data/dept/tezgah.json (${rows.length} ürün)`);
console.log(`Ölçü+fiyatlı analiz: ${enriched.length} ürün`);
console.log(`Ölçüsüz atlanan: ${skipped.noDim} · fiyatsız atlanan: ${skipped.noPrice}`);
console.log("");
console.log("Marka dağılımı:");
for (const [b, s] of Object.entries(brandStats).sort((a, c) => c.n - a.n)) {
  console.log(`  ${b}: ${s.n} ürün (${s.withMatch} çok-markalı eşleşmede)`);
}
console.log("");
console.log(`Çok markalı eşleşme grubu: ${multiBrand.length}`);
console.log(`Toplam eşleşen ürün satırı: ${multiBrand.reduce((a, g) => a + g.count, 0)}`);
console.log(`Aynı marka mükerrer grup: ${sameBrandDupes.length}`);
console.log("");

if (multiBrand.length === 0) {
  console.log("Farklı markalarda aynı ölçü+varyant eşleşmesi bulunamadı.");
} else {
  console.log("── Eşleşen gruplar (fiyat farkına göre sıralı) ──────────────\n");
  for (const g of multiBrand) {
    console.log(`▸ ${g.variantLabel} · ${g.dimLabel}`);
    console.log(`  Markalar: ${g.brands.join(" · ")} (${g.count} ürün)`);
    console.log(
      `  Aralık: ${fmtTry(g.minFiyat)} — ${fmtTry(g.maxFiyat)} (Δ ${fmtTry(g.spreadTry)}, +%${g.spreadPct})`,
    );
    for (const it of g.items) {
      const rel = g.minFiyat === it.fiyat_tl ? "en ucuz" : `+${pctDiff(g.minFiyat, it.fiyat_tl)}%`;
      console.log(`    [${it.brand}] ${it.sku} · ${fmtTry(it.fiyat_tl)} (${rel})`);
      console.log(`      ${it.name?.slice(0, 72)}`);
    }
    console.log("");
  }
}

const csvArg = process.argv.indexOf("--csv");
if (csvArg >= 0) {
  const csvPath = process.argv[csvArg + 1] || path.join(OUT_DIR, "tezgah-marka-fiyat.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  const lines = [
    "variant,dim_w,dim_d,dim_h,brand,sku,fiyat_tl,kaynak,name,group_spread_try,group_spread_pct",
  ];
  for (const g of multiBrand) {
    for (const it of g.items) {
      const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
      lines.push(
        [
          g.variant,
          g.items[0].dims[0],
          g.items[0].dims[1],
          g.items[0].dims[2],
          it.brand,
          it.sku,
          it.fiyat_tl,
          it.kaynak,
          it.name,
          g.spreadTry,
          g.spreadPct,
        ]
          .map(esc)
          .join(","),
      );
    }
  }
  fs.writeFileSync(csvPath, lines.join("\n"), "utf8");
  console.log(`CSV: ${csvPath}`);
}

const summaryPath = path.join(OUT_DIR, "tezgah-marka-fiyat-summary.json");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      total: rows.length,
      analyzed: enriched.length,
      skipped,
      multiBrandGroups: multiBrand.length,
      multiBrandRows: multiBrand.reduce((a, g) => a + g.count, 0),
      brandStats,
      groups: multiBrand.map((g) => ({
        variant: g.variant,
        variantLabel: g.variantLabel,
        dimLabel: g.dimLabel,
        brands: g.brands,
        minFiyat: g.minFiyat,
        maxFiyat: g.maxFiyat,
        spreadTry: g.spreadTry,
        spreadPct: g.spreadPct,
        items: g.items.map((i) => ({
          brand: i.brand,
          sku: i.sku,
          fiyat_tl: i.fiyat_tl,
          kaynak: i.kaynak,
          name: i.name,
        })),
      })),
    },
    null,
    2,
  ),
  "utf8",
);
console.log(`JSON özet: ${summaryPath}`);
