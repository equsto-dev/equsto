/**
 * Gastrotech katalog iskonto kurallarına göre site fiyat denetimi.
 *
 * Kurallar (apply-gastrotech-catalog.mjs ile aynı):
 * - s.41–78: liste × 0.55 + KDV
 * - Puqpress: liste × 1.0 + KDV
 * - Diğer: liste × 0.53 + KDV
 *
 *   node scripts/audit-gastrotech-prices.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "scripts/data/gastrotech/gastrotech-catalog-extracted.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_JSON = path.join(ROOT, "scripts/data/gastrotech/gastrotech-price-audit.json");
const OUT_MD = path.join(ROOT, "scripts/data/gastrotech/gastrotech-price-audit.md");
const KDV = 20;
const TOL = 5; // TL

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function pricingRule(item) {
  if (
    item.pricing_rule === "list_as_sale" ||
    /^PUQ\s*PRESS/i.test(item.model) ||
    item.brand_hint === "Puqpress"
  ) {
    return { key: "puqpress", iskonto: 0, oran: 1 };
  }
  const p = Number(item.page);
  if (p >= 41 && p <= 78) return { key: "p41_78", iskonto: 45, oran: 0.55 };
  return { key: "default", iskonto: 47, oran: 0.53 };
}

function compute(item, eurTry) {
  const rule = pricingRule(item);
  const liste = Number(item.liste_fiyat);
  const satis = Math.round(liste * rule.oran * 100) / 100;
  const cur = item.currency || "EUR";
  const net = cur === "TL" ? Math.round(satis) : Math.round(satis * eurTry);
  return {
    rule,
    liste,
    satis,
    currency: cur,
    fiyat_tl: Math.round(net * (1 + KDV / 100)),
  };
}

function isGtFamily(row) {
  const blob = `${row.brand || ""} ${row.marka_kodu || ""} ${row.id || ""}`;
  if (/rational|electrolux/i.test(blob)) return false;
  return /gastrotech|gtech|scotsman|puqpress|vital|kitchenaid/i.test(blob);
}

async function main() {
  const cat = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const rates = await fetchTcmbEurUsdRates();
  const eur = rates.eurTry;

  const byNorm = new Map();
  for (const p of cat.products) {
    const k = norm(p.model);
    if (k && !byNorm.has(k)) byNorm.set(k, p);
  }

  const site = [];
  for (const f of fs.readdirSync(DEPT_DIR).filter((x) => x.endsWith(".json"))) {
    const arr = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const row of arr) {
      if (isGtFamily(row)) site.push({ file: f, row });
    }
  }

  let catalogMatched = 0;
  const ok = [];
  const mismatch = [];
  const cafemarktButInCatalog = [];
  const siteCafeUnmatched = [];

  for (const { file, row } of site) {
    const keys = [
      row.sku,
      row.model,
      row.marka_urun_kodu,
      String(row.id || "").replace(/^(gastrotech|gtech|scotsman|puqpress|vital|kitchenaid)__/i, ""),
    ]
      .map(norm)
      .filter(Boolean);

    let item = null;
    for (const k of keys) {
      if (byNorm.has(k)) {
        item = byNorm.get(k);
        break;
      }
    }
    if (!item) {
      for (const k of keys) {
        for (const [ck, cv] of byNorm) {
          if (ck === k || (k.length >= 5 && (ck.startsWith(k) || k.startsWith(ck)))) {
            item = cv;
            break;
          }
        }
        if (item) break;
      }
    }

    const kaynak = String(row.fiyat_kaynak || row.kaynak_fiyat_listesi || "");
    const isCafe = /cafemarkt/i.test(kaynak);

    if (!item) {
      if (isCafe && /gtech|gastrotech/i.test(`${row.brand} ${row.id}`)) {
        siteCafeUnmatched.push({
          id: row.id,
          sku: row.sku,
          fiyat_tl: row.fiyat_tl,
          brand: row.brand,
          name: row.name,
          kaynak,
        });
      }
      continue;
    }

    catalogMatched += 1;
    const px = compute(item, eur);
    const actual = Number(row.fiyat_tl) || 0;
    const delta = actual - px.fiyat_tl;
    const rec = {
      id: row.id,
      sku: row.sku,
      model: item.model,
      page: item.page,
      brand: row.brand,
      name: String(row.name || "").slice(0, 70),
      kaynak,
      isCafe,
      liste: px.liste,
      rule: px.rule.key,
      iskonto: px.rule.iskonto,
      expected: px.fiyat_tl,
      actual,
      delta,
      abs: Math.abs(delta),
      file,
      fiyat_kilit: !!row.fiyat_kilit,
    };

    if (rec.abs <= TOL) ok.push(rec);
    else mismatch.push(rec);
    if (isCafe) cafemarktButInCatalog.push(rec);
  }

  mismatch.sort((a, b) => b.abs - a.abs);
  cafemarktButInCatalog.sort((a, b) => b.abs - a.abs);

  const summary = {
    eurTry: eur,
    tcmbDate: rates.tcmbDate,
    catalog: cat.products.length,
    site_gt_family: site.length,
    catalog_matched: catalogMatched,
    price_ok: ok.length,
    price_mismatch: mismatch.length,
    cafemarkt_but_in_catalog: cafemarktButInCatalog.length,
    cafe_unmatched: siteCafeUnmatched.length,
  };

  const payload = {
    at: new Date().toISOString(),
    rates,
    rules: {
      p41_78: "liste × 0.55 + KDV",
      default: "liste × 0.53 + KDV",
      puqpress: "liste × 1.0 + KDV",
    },
    summary,
    mismatch,
    cafemarktButInCatalog,
    siteCafeUnmatched,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [];
  md.push("# Gastrotech fiyat denetimi");
  md.push("");
  md.push(`- Kur: **1 EUR = ${eur} TRY** (TCMB ${rates.tcmbDate})`);
  md.push(`- Katalog: **${summary.catalog}** | Sitede GT ailesi: **${summary.site_gt_family}** | Eşleşen: **${summary.catalog_matched}**`);
  md.push(`- Fiyat uyumlu (±${TOL} TL): **${summary.price_ok}**`);
  md.push(`- Katalog kuralına uymayan: **${summary.price_mismatch}**`);
  md.push(`- CafeMarkt kalmış ama katalogda var: **${summary.cafemarkt_but_in_catalog}**`);
  md.push(`- CafeMarkt Gtech/Gastrotech, katalogda yok: **${summary.cafe_unmatched}**`);
  md.push("");
  md.push("## Kurallar");
  md.push("- s.41–78: %45 iskonto → ×0.55 + KDV");
  md.push("- Puqpress: iskontosuz liste + KDV");
  md.push("- Diğer: %47 iskonto → ×0.53 + KDV");
  md.push("");
  md.push("## En büyük sapmalar (ilk 40)");
  for (const m of mismatch.slice(0, 40)) {
    md.push(
      `- \`${m.id}\` ${m.model} s.${m.page} (${m.rule} %${m.iskonto}): ₺${Number(m.actual).toLocaleString("tr-TR")} → beklenen **₺${m.expected.toLocaleString("tr-TR")}** (Δ ${m.delta >= 0 ? "+" : ""}${Math.round(m.delta)}; kaynak: ${m.kaynak || "—"})`,
    );
  }
  md.push("");
  md.push("## CafeMarkt kalmış + katalogda var (ilk 40)");
  for (const m of cafemarktButInCatalog.slice(0, 40)) {
    md.push(
      `- \`${m.id}\` ${m.model}: ₺${Number(m.actual).toLocaleString("tr-TR")} → **₺${m.expected.toLocaleString("tr-TR")}** (liste ${m.liste} EUR)`,
    );
  }
  md.push("");
  md.push("## CafeMarkt Gtech — katalogda eşleşme yok (ilk 30)");
  for (const m of siteCafeUnmatched.slice(0, 30)) {
    md.push(`- \`${m.id}\` ${m.sku}: ₺${Number(m.fiyat_tl).toLocaleString("tr-TR")} — ${m.name || ""}`);
  }
  fs.writeFileSync(OUT_MD, md.join("\n") + "\n", "utf8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nreport → ${OUT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
