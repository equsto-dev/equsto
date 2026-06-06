/**
 * Proso xlsx ↔ site katalog eşleştirme raporu (kod, görsel, fiyat)
 *   node scripts/report-proso-display-match.mjs
 *   node scripts/report-proso-display-match.mjs --json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  PROSO_XLSX_DEFAULT,
  PROSO_NET_MULT,
  PROSO_KAYNAK,
  loadProsoPriceIndex,
  lookupProsoListPrice,
  excelFamilyCandidates,
  parseRowDims,
  buildProsoPriceFields,
} from "./lib/proso-display-price-list.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MARKET = join(root, "public/data/dept/market-reyon.json");
const OUT_DIR = join(root, "scripts/out");
const OUT_JSON = join(OUT_DIR, "proso-display-match-report.json");
const jsonOut = process.argv.includes("--json");
const xlsxPath = process.env.PROSO_PRICE_XLSX?.trim() || PROSO_XLSX_DEFAULT;
const CDN = "https://dqb0g8etbedva.cloudfront.net";

async function headOk(url) {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(12000) });
    return res.ok;
  } catch {
    return false;
  }
}

function imgRel(row) {
  const im = row.images?.[0];
  return im ? String(im).replace(/\\/g, "/") : "";
}

function localImgExists(rel) {
  if (!rel) return false;
  const clean = rel.replace(/^\//, "").replace(/\\/g, "/");
  const candidates = [
    join(root, "public", clean),
    join(root, "public/data", clean),
  ];
  if (/^prosogutma-market\//i.test(clean)) {
    candidates.push(join(root, "public/data", clean));
  }
  return candidates.some((p) => existsSync(p));
}

function cdnUrl(rel) {
  if (!rel) return "";
  const p = rel.replace(/^\//, "");
  if (/^prosogutma-market\//i.test(p)) return `${CDN}/data/${p}`;
  if (/^images\//i.test(p)) return `${CDN}/${p}`;
  if (/^data\//i.test(p)) return `${CDN}/${p}`;
  return `${CDN}/${p}`;
}

async function main() {
  if (!existsSync(xlsxPath)) {
    console.error("[proso-report] xlsx yok:", xlsxPath);
    process.exit(1);
  }

  const kur = await fetchTcmbEurRate();
  const eurTry = kur.rate;
  const index = await loadProsoPriceIndex(xlsxPath);
  const rows = JSON.parse(readFileSync(MARKET, "utf8")).filter((r) => r.kaynak === "prosogutma");

  const bySeries = {};
  const unmatched = [];
  const priceMismatch = [];
  const noImage = [];
  const imgBroken = [];
  const matchedKeys = new Set();

  let priceOk = 0;
  let pricePending = 0;
  let codeMatched = 0;
  let imgOk = 0;

  for (const row of rows) {
    const series = row.series || "?";
    if (!bySeries[series]) {
      bySeries[series] = { total: 0, priced: 0, codeMatch: 0, imgOk: 0, pending: 0 };
    }
    bySeries[series].total++;

    const hit = lookupProsoListPrice(index, row);
    const rel = imgRel(row);
    const hasImg = !!rel;

    if (!hasImg) {
      noImage.push({ sku: row.sku, name: row.name, series, prosoModelKod: row.prosoModelKod });
    } else {
      const local = localImgExists(rel);
      let remote = local;
      if (!local && /^prosogutma-market\//i.test(rel)) {
        remote = true;
      } else if (!local) {
        remote = await headOk(cdnUrl(rel));
      }
      if (remote) {
        imgOk++;
        bySeries[series].imgOk++;
      } else {
        imgBroken.push({
          sku: row.sku,
          name: row.name?.slice(0, 70),
          image: rel,
          series,
        });
      }
    }

    if (hit) {
      codeMatched++;
      bySeries[series].codeMatch++;
      matchedKeys.add(`${hit.fam}|${hit.width}`);

      const expected = buildProsoPriceFields(row, hit.listEur, eurTry);
      const onSite = row.kaynak_fiyat_listesi === PROSO_KAYNAK;

      if (onSite) {
        bySeries[series].priced++;
        const listDiff = Math.abs((row.liste_fiyati_eur || 0) - hit.listEur);
        const tlDiff = Math.abs((row.fiyat_tl || 0) - (expected.fiyat_tl || 0));
        if (listDiff > 0.02 || tlDiff > 2) {
          priceMismatch.push({
            sku: row.sku,
            prosoModelKod: row.prosoModelKod,
            excelListEur: hit.listEur,
            siteListEur: row.liste_fiyati_eur,
            expectedTl: expected.fiyat_tl,
            siteTl: row.fiyat_tl,
            excelFam: hit.fam,
            width: hit.width,
          });
        } else {
          priceOk++;
        }
      } else {
        pricePending++;
        bySeries[series].pending++;
        unmatched.push({
          sku: row.sku,
          name: row.name?.slice(0, 70),
          series,
          prosoModelKod: row.prosoModelKod,
          olculer: row.olculer,
          reason: "excel_eslesmesi_var_fiyat_yok",
          excelFam: hit.fam,
          excelWidth: hit.width,
          excelListEur: hit.listEur,
        });
      }
    } else {
      pricePending++;
      bySeries[series].pending++;
      unmatched.push({
        sku: row.sku,
        name: row.name?.slice(0, 70),
        series,
        prosoModelKod: row.prosoModelKod || null,
        olculer: row.olculer,
        reason: row.prosoModelKod ? "excel_eslesmesi_yok" : "model_kodu_yok",
        candidates: excelFamilyCandidates(row).slice(0, 4),
      });
    }
  }

  const excelOnly = [];
  for (const [key, val] of index) {
    if (!matchedKeys.has(key)) {
      excelOnly.push({
        key,
        listEur: val.listEur,
        sheet: val.sheet,
        desc: val.desc?.slice(0, 80),
      });
    }
  }
  excelOnly.sort((a, b) => a.key.localeCompare(b.key));

  const report = {
    generatedAt: new Date().toISOString(),
    xlsx: xlsxPath,
    eurTry,
    eurTryFallback: kur.fallback || false,
    summary: {
      siteTotal: rows.length,
      excelPriceRows: index.size,
      codeMatched,
      codeMatchPct: +((100 * codeMatched) / rows.length).toFixed(1),
      pricedOnSite: rows.filter((r) => r.kaynak_fiyat_listesi === PROSO_KAYNAK).length,
      priceOk,
      priceMismatch: priceMismatch.length,
      pricePending,
      withImage: rows.length - noImage.length,
      imgOk,
      imgBroken: imgBroken.length,
      excelUnmatchedOnSite: excelOnly.length,
    },
    bySeries: Object.fromEntries(
      Object.entries(bySeries).sort((a, b) => b[1].total - a[1].total)
    ),
    unmatched: unmatched.slice(0, 120),
    unmatchedTotal: unmatched.length,
    priceMismatch: priceMismatch.slice(0, 30),
    imgBroken: imgBroken.slice(0, 30),
    excelOnlySample: excelOnly.slice(0, 40),
    excelOnlyTotal: excelOnly.length,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + "\n", "utf8");

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const s = report.summary;
  console.log("\n=== PROSO DISPLAY — EŞLEŞTİRME RAPORU ===\n");
  console.log("Excel:", xlsxPath.split(/[/\\]/).pop());
  console.log("EUR/TRY:", eurTry, kur.fallback ? "(fallback)" : "");
  console.log("");
  console.log("SITE TOPLAM:", s.siteTotal);
  console.log("EXCEL FİYAT SATIRI:", s.excelPriceRows);
  console.log("");
  console.log("KOD ↔ EXCEL:", s.codeMatched, "/", s.siteTotal, `(${s.codeMatchPct}%)`);
  console.log("FİYAT SİTEDE:", s.pricedOnSite, "| doğrulanan:", s.priceOk, "| uyumsuz:", s.priceMismatch);
  console.log("FİYAT BEKLEYEN:", s.pricePending);
  console.log("GÖRSEL:", s.imgOk, "/", s.withImage, "| kırık:", s.imgBroken);
  console.log("EXCEL'DE VAR, SİTEDE EŞLEŞMEYEN:", s.excelUnmatchedOnSite);
  console.log("");
  console.log("--- Seri bazında ---");
  for (const [name, v] of Object.entries(report.bySeries).slice(0, 15)) {
    console.log(
      `  ${name.padEnd(12)} toplam ${String(v.total).padStart(3)} | kod ${String(v.codeMatch).padStart(3)} | fiyat ${String(v.priced).padStart(3)} | bekleyen ${String(v.pending).padStart(3)}`
    );
  }
  if (unmatched.length) {
    console.log("\n--- Eşleşmeyen örnekler (ilk 10) ---");
    unmatched.slice(0, 10).forEach((u) => {
      console.log(`  [${u.reason}] ${u.series} | ${u.prosoModelKod || "—"} | ${u.name}`);
    });
  }
  console.log("\nJSON:", OUT_JSON);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
