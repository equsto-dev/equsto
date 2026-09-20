#!/usr/bin/env node
/**
 * Piyasa referansına göre vitrin fiyat güveni.
 * too_cheap + SKU eşleşmesi → Cafemarkt −%7 (veya Mutbex −%16), fiyat kilitlenir.
 *
 *   node scripts/apply-price-trust.mjs
 *   node scripts/apply-price-trust.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRICE_TRUST,
  evaluatePriceTrust,
  fmtTry,
  havaleFromKdvDahil,
  marketsAgree,
  netFromKdvDahil,
  normSku,
  num,
  skuOf,
  suggestedSaleTl,
} from "./lib/price-trust.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const EKIP = path.join(ROOT, "var/catalog/ekipmanlar.json");
const FEED = path.join(ROOT, "public/feeds/google-products.xml");
const REFS = path.join(ROOT, "scripts/data/price-trust/market-refs.json");
const INDEX_OUT = path.join(ROOT, "public/data/price-trust-index.json");
const REPORT_OUT = path.join(ROOT, "scripts/data/price-trust/last-apply.json");
const CM_PLP = path.join(ROOT, "scripts/data/cm-import/oztiryakiler-plp.json");
const OZTI_CMP = path.join(ROOT, "scripts/data/ozti/ozti-multi-market-karsilastirma.json");
const MUTBEX_OZTI = path.join(ROOT, "scripts/data/ozti/mutbex-ozti-catalog.json");
const dryRun = process.argv.includes("--dry-run");

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/:\s*NaN/g, ": null"));
}

function mergeMarkets(into, sku, patch) {
  const key = normSku(sku);
  if (!key) return;
  const cur = into.get(key) || { cafemarkt: 0, mutbex: 0, name: "", urls: {} };
  if (num(patch.cafemarkt) > num(cur.cafemarkt)) cur.cafemarkt = num(patch.cafemarkt);
  if (num(patch.mutbex) > num(cur.mutbex)) cur.mutbex = num(patch.mutbex);
  if (patch.name && !cur.name) cur.name = patch.name;
  if (patch.cafemarkt_url) cur.urls.cafemarkt = patch.cafemarkt_url;
  if (patch.mutbex_url) cur.urls.mutbex = patch.mutbex_url;
  into.set(key, cur);
}

function loadMarketMap() {
  /** @type {Map<string, {cafemarkt:number, mutbex:number, name:string, urls:object}>} */
  const map = new Map();
  const refs = loadJson(REFS);
  for (const [sku, row] of Object.entries(refs?.skus || {})) {
    mergeMarkets(map, sku, row);
  }
  const cmp = loadJson(OZTI_CMP);
  const rows = Array.isArray(cmp) ? cmp : cmp?.rows || cmp?.items || [];
  for (const r of rows) {
    mergeMarkets(map, r.sku, {
      name: r.name,
      cafemarkt: r.cafemarkt_tl,
      mutbex: r.mutbex_tl || r.mutbex_list_tl,
      mutbex_url: r.mutbex_url,
    });
  }
  const cm = loadJson(CM_PLP);
  const cmRows = Array.isArray(cm) ? cm : cm?.items || cm?.products || cm?.rows || [];
  for (const r of cmRows) {
    mergeMarkets(map, r.code || r.sku, {
      name: r.name,
      cafemarkt: r.price_try_kdv_dahil,
      cafemarkt_url: r.url,
    });
  }
  const mut = loadJson(MUTBEX_OZTI);
  const mutRows = Array.isArray(mut) ? mut : mut?.products || mut?.items || [];
  for (const r of mutRows) {
    mergeMarkets(map, r.sku || r.mutbexCode, {
      name: r.name,
      mutbex: r.price_try_kdv_dahil || r.price_try_list,
      mutbex_url: r.url,
    });
  }
  return map;
}

function patchSpecs(specs, saleTl, ref) {
  const head = String(specs || "").split("\n")[0] || "";
  const rest = String(specs || "")
    .split("\n")
    .slice(1)
    .filter((line) => {
      if (/Equsto satış \(TL|Havale \/ EFT|Kaynak fiyat \(KDV|Cafemarkt:|Mutbex:|Piyasa doğrulama/i.test(line)) {
        return false;
      }
      return true;
    });
  const extra = [
    `Piyasa doğrulama: ${ref.source} ${fmtTry(ref.marketTl)}`,
    ref.cafeUrl ? `Cafemarkt: ${ref.cafeUrl}` : "",
    ref.mutUrl ? `Mutbex: ${ref.mutUrl}` : "",
    `Equsto satış (TL, KDV dahil): ${fmtTry(saleTl)}`,
    `Havale / EFT: %2 indirim → ${fmtTry(havaleFromKdvDahil(saleTl))}`,
    "Kaynak fiyat: piyasa SKU eşleşmesi (Özti Excel liste EUR geçersiz — çok düşük)",
  ].filter(Boolean);
  return [head, "", ...rest.filter(Boolean), "", ...extra].join("\n").replace(/\n{3,}/g, "\n\n");
}

function applyCorrection(row, saleTl, verdict, markets) {
  const kdv = (num(row.kdv_oran) || 20) / 100;
  const net = netFromKdvDahil(saleTl, kdv);
  const havale = havaleFromKdvDahil(saleTl);
  if (!row.liste_fiyati_eur_ozti && num(row.liste_fiyati_eur) > 0) {
    row.liste_fiyati_eur_ozti = row.liste_fiyati_eur;
  }
  row.fiyat_tl = saleTl;
  row.fiyat_tl_net = net;
  row.satis_fiyati_tl = net;
  row.fiyat_havale_tl = havale;
  row.havale_iskonto_oran = 2;
  row.price = `${fmtTry(saleTl)} KDV dahil`;
  row.para_birimi = "TL";
  row.fiyat_kilit = true;
  row.fiyat_guven = true;
  row.fiyat_bekleniyor = false;
  row.fiyat_dogrulama = "piyasa_ref";
  row.piyasa_ref_tl = verdict.marketTl;
  row.piyasa_kaynak = verdict.marketSource;
  row.cafemarkt_fiyat_kdv_dahil = num(markets.cafemarkt) || undefined;
  row.cafemarkt_indirim_oran = num(markets.cafemarkt) > 0 ? PRICE_TRUST.CAFE_MULT : undefined;
  row.mutbex_ref_tl = num(markets.mutbex) || undefined;
  row.fiyat_kaynak = "cafemarkt-price-trust";
  row.fiyat_kaynagi = "cafemarkt-price-trust";
  const kur = num(row.kur_eur_try);
  if (kur > 0) {
    row.satis_fiyati_eur = Math.round((net / kur) * 100) / 100;
    row.satis_eur_indirimli = row.satis_fiyati_eur;
  }
  row.specs = patchSpecs(row.specs, saleTl, {
    source: verdict.marketSource,
    marketTl: verdict.marketTl,
    cafeUrl: markets.urls?.cafemarkt,
    mutUrl: markets.urls?.mutbex,
  });
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data)}\n`);
}

function patchGoogleFeed(sku, saleTl) {
  if (!fs.existsSync(FEED)) return false;
  const xml = fs.readFileSync(FEED, "utf8");
  const idRe = new RegExp(
    `(<g:id>${sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</g:id>[\\s\\S]*?<g:price>)([0-9.]+)( TRY</g:price>)`,
  );
  const next = xml.replace(idRe, `$1${saleTl.toFixed(2)}$3`);
  if (next === xml) return false;
  if (!dryRun) fs.writeFileSync(FEED, next);
  return true;
}

function main() {
  const marketsBySku = loadMarketMap();
  const allow = new Set(Object.keys(loadJson(REFS)?.skus || {}).map((k) => normSku(k)));
  const report = {
    generatedAt: new Date().toISOString(),
    corrected: [],
    withheld: [],
    expensive: [],
    skipped: 0,
  };
  const index = { generated: report.generatedAt, skus: {} };

  const targets = [];
  for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json") && !x.includes("_items"))) {
    targets.push({ file: path.join(DEPT, f), dept: f.replace(/\.json$/, "") });
  }
  if (fs.existsSync(EKIP)) targets.push({ file: EKIP, dept: "ekipmanlar" });

  for (const t of targets) {
    const rows = loadJson(t.file);
    if (!Array.isArray(rows)) continue;
    let hits = 0;
    for (const row of rows) {
      const sku = normSku(skuOf(row));
      const markets = marketsBySku.get(sku);
      if (!markets) {
        report.skipped++;
        continue;
      }
      const siteTl = num(row.fiyat_tl);
      const verdict = evaluatePriceTrust({
        siteTl,
        markets,
        quoteOnly: !!row.fiyat_bekleniyor,
        locked: !!row.fiyat_kilit,
        fiyatGuven: row.fiyat_guven,
      });
      if (verdict.reason === "too_expensive") {
        if (t.dept !== "ekipmanlar") {
          report.expensive.push({ sku, dept: t.dept, siteTl, marketTl: verdict.marketTl });
        }
        continue;
      }
      if (verdict.reason !== "too_cheap") continue;
      if (!allow.has(sku) && !marketsAgree(markets)) continue;
      const saleTl = suggestedSaleTl(markets);
      if (!(saleTl > 0)) {
        row.fiyat_bekleniyor = true;
        row.fiyat_guven = false;
        hits++;
        if (t.dept !== "ekipmanlar") report.withheld.push({ sku, dept: t.dept, siteTl });
        continue;
      }
      applyCorrection(row, saleTl, verdict, markets);
      hits++;
      if (t.dept !== "ekipmanlar") {
        report.corrected.push({
          sku,
          dept: t.dept,
          before: siteTl,
          after: saleTl,
          marketTl: verdict.marketTl,
          source: verdict.marketSource,
        });
        index.skus[sku] = {
          piyasa_ref_tl: verdict.marketTl,
          piyasa_kaynak: verdict.marketSource,
          equsto_tl: saleTl,
          fiyat_kilit: true,
          reason: "corrected",
        };
      }
    }
    if (hits && !dryRun) writeJson(t.file, rows);
  }

  for (const c of report.corrected) {
    const patched = patchGoogleFeed(c.sku, c.after);
    c.feedPatched = patched;
  }

  if (!dryRun) {
    writeJson(INDEX_OUT, index);
    fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
    fs.writeFileSync(REPORT_OUT, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(
    `[price-trust] düzeltilen ${report.corrected.length} · durdurulan ${report.withheld.length} · pahalı (yalnız rapor) ${report.expensive.length}${dryRun ? " (dry-run)" : ""}`,
  );
  for (const c of report.corrected) {
    console.log(`  ${c.sku} ${fmtTry(c.before)} → ${fmtTry(c.after)} (ref ${fmtTry(c.marketTl)} ${c.source})`);
  }
}

main();
