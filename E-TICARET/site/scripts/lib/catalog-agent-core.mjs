/**
 * Katalog ajanı — marka denetimleri ve normalize edilmiş sorun listesi
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "../fetch-tcmb-kur.mjs";
import {
  extractAnchoredPriceFromDescription,
  findManualSenoxKdvDahil,
  findMutbexListPrice,
  findPdfListPrice,
  loadMutbexCatalog,
  loadSenoxPdfCatalog,
  normSenoxKey,
  pricingFromSenoxPdfListe,
  resolveSenoxListPrice,
} from "./senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEPT = path.join(ROOT, "public/data/dept");
const EKIPMANLAR = path.join(ROOT, "var/catalog/ekipmanlar.json");
const YUKSEL_ITHAL = [
  path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-ithal/tum-urunler.json"),
  path.join(ROOT, "..", "..", "EQUSTO-WORK/public/data/fiyat-listeleri/yuksel/2025-ithal/tum-urunler.json"),
].find((p) => fs.existsSync(p));
const YUKSEL_YERLI = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const RATIONAL_COMPARE = path.join(ROOT, "scripts/data/rational-multi-market-karsilastirma.json");

const KDV = 20;
const TOL = 2;
const SENOX_SATIS = 0.5;
const YUKSEL_ISK = 0.35;
const CM_DISCOUNT = Number(process.env.EQUSTO_CAFE_DISCOUNT || "0.07");
const CM_MULT = 1 - CM_DISCOUNT;
const YUKSEL_ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const YUKSEL_NET_MULT = 1 - YUKSEL_ISKONTO;

const SKU_TO_YUKSEL_REF = {
  "9860.MP160.VV": "34740",
  "9860.MP190.VV": "34750",
  "9860.MP190.C0": "34770",
  "9860.MP240.VV": "34760",
  "9860.MP250.C0": "34300B",
  "9810.MP350.U0": "34800L",
  "9810.MP350.CU": "34860L",
  "9810.MP450.UL": "34810L",
  "9860.MP450.C0": "34870L",
  "9860.MP550.A0": "34820LH",
  "9860.MP600.A0": "34830LH",
  "9810.MP800.UL": "34890L",
  "9840.CL50D.00": "24440",
  "9840.CL52D.00": "24490",
  "9840.CL55D.00": "2245",
  "9840.CL60D.00": "2325F",
  "9840.R201E.00": "2129D",
  "9840.R301C.00": "2525",
  "9860.000R2.00": "22100D",
  "9860.000R5.00": "24608M",
  "9860.00J80.00": "56000B",
};
const MANUAL_LISTE_EUR = { "34820LH": 1223.3, "34830LH": 1533.0 };

/** @typedef {'critical'|'high'|'medium'|'low'} CatalogIssueSeverity */
/** @typedef {'price_mismatch'|'price_update'|'missing_source'|'data_quality'|'competitor_gap'|'competitor_advantage'} CatalogIssueType */

/**
 * @param {object} p
 * @returns {import('./catalog-agent-types.mjs').CatalogIssue}
 */
export function makeIssue(p) {
  return {
    id: p.id,
    brand: p.brand,
    severity: p.severity,
    type: p.type,
    sku: p.sku || "",
    model: p.model || "",
    name: p.name || "",
    message: p.message,
    site_tl: p.site_tl ?? null,
    expected_tl: p.expected_tl ?? null,
    diff_tl: p.diff_tl ?? null,
    liste_eur: p.liste_eur ?? null,
    source: p.source || "",
    competitor: p.competitor || null,
    competitor_tl: p.competitor_tl ?? null,
    meta: p.meta || {},
  };
}

function isSenoxRow(r) {
  const k = String(r?.kaynak_fiyat_listesi || r?.kaynak || "").toLowerCase();
  return k.includes("senox") || String(r?.id || "").startsWith("senox__");
}

function pctDiff(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.round((Math.abs(a - b) / Math.max(a, b)) * 1000) / 10;
}

function priceFromListe(listeEur, kur, netMult) {
  const netEur = Math.round(listeEur * netMult * 100) / 100;
  const netTry = netEur * kur;
  const kdvDahil = Math.round(netTry * (1 + KDV / 100));
  return { listeEur, netEur, kdvDahil, kur };
}

async function loadSiteSenox() {
  const rows = [];
  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (!isSenoxRow(r)) continue;
      rows.push({ ...r, dept_file: f });
    }
  }
  return rows;
}

function pdfMetaByKey(products) {
  const map = new Map();
  for (const p of products) {
    const k = normSenoxKey(p.model);
    if (k) map.set(k, p);
  }
  return map;
}

/**
 * @param {number} kur
 * @returns {Promise<{ check: object, issues: import('./catalog-agent-types.mjs').CatalogIssue[] }>}
 */
export async function auditSenoxDetailed(kur) {
  const pdf = loadSenoxPdfCatalog();
  const mut = loadMutbexCatalog();
  const pdfMeta = pdfMetaByKey(pdf.products);
  const siteRows = await loadSiteSenox();
  const issues = [];

  let formulaOk = 0;
  let formulaBad = 0;
  let guncellemeOner = 0;
  let pageOrder = 0;
  let descSpecs = 0;

  for (const r of siteRows) {
    const ref = {
      model: r.model,
      mutbexCode: r.sku || r.urun_kodu,
      sku: r.sku,
      urun_kodu: r.urun_kodu,
    };
    const pdfDirect = findPdfListPrice(ref, pdf.index, pdf.products);
    const mutDirect = findMutbexListPrice(ref, mut.index);
    const resolved = resolveSenoxListPrice(ref, pdf.index, pdf.products, mut.index);
    const meta = pdfMeta.get(normSenoxKey(r.model));
    const specsListe = meta ? Number(meta.specs?.fiyat_eur) || 0 : 0;
    const descListe = meta
      ? extractAnchoredPriceFromDescription(meta.description, meta.model, meta.title, r.name)
      : 0;
    const manual = findManualSenoxKdvDahil(ref);
    const oneriListe = resolved?.listeEur || 0;
    const oneriPx = manual
      ? { fiyat_tl: manual.kdvDahil }
      : oneriListe > 0
        ? pricingFromSenoxPdfListe(oneriListe, kur, KDV, SENOX_SATIS)
        : null;
    const expectedTl = oneriPx?.fiyat_tl || 0;
    const siteTl = Number(r.fiyat_tl) || 0;
    const pdfListe = pdfDirect?.listeEur ?? null;
    const mutListe = mutDirect?.listeEur ?? null;
    const pdfPageOrder = meta?.specs?.fiyat_eur_source === "page-order";
    const descVsSpecs = descListe > 0 && specsListe > 0 && Math.abs(descListe - specsListe) > 1;
    const formulaOkRow = expectedTl > 0 && Math.abs(siteTl - expectedTl) <= TOL;
    const needsUpdate =
      !manual &&
      oneriListe > 0 &&
      oneriListe !== (Number(r.liste_fiyati_eur) || 0) &&
      !formulaOkRow;

    if (formulaOkRow) formulaOk++;
    else if (expectedTl > 0) formulaBad++;
    if (needsUpdate) guncellemeOner++;
    if (pdfPageOrder) pageOrder++;
    if (descVsSpecs) descSpecs++;

    const sku = r.sku || r.model || "";
    const base = {
      brand: "senox",
      sku,
      model: r.model || "",
      name: String(r.name || "").slice(0, 80),
      site_tl: siteTl,
      expected_tl: expectedTl || null,
      liste_eur: oneriListe || null,
      source: resolved?.source || pdfDirect?.source || "",
    };

    if (!formulaOkRow && expectedTl > 0) {
      issues.push(
        makeIssue({
          ...base,
          id: `senox:${sku}:price_mismatch`,
          severity: Math.abs(siteTl - expectedTl) > 500 ? "high" : "medium",
          type: "price_mismatch",
          diff_tl: siteTl - expectedTl,
          message: `Formül sapması: sitede ₺${siteTl.toLocaleString("tr-TR")}, beklenen ₺${expectedTl.toLocaleString("tr-TR")}`,
          meta: { pdf_liste: pdfListe, mut_liste: mutListe, manual: !!manual },
        }),
      );
    } else if (needsUpdate) {
      issues.push(
        makeIssue({
          ...base,
          id: `senox:${sku}:price_update`,
          severity: "medium",
          type: "price_update",
          diff_tl: siteTl - expectedTl,
          message: `Liste fiyatı güncellenmeli (site €${Number(r.liste_fiyati_eur) || 0} → öneri €${oneriListe})`,
          meta: { pdf_liste: pdfListe, mut_liste: mutListe },
        }),
      );
    }

    if (pdfPageOrder) {
      issues.push(
        makeIssue({
          ...base,
          id: `senox:${sku}:page_order`,
          severity: "medium",
          type: "data_quality",
          message: "PDF page-order kaynaklı fiyat — manuel doğrulama gerekli",
          meta: { pdf_liste: pdfListe, mut_liste: mutListe, pdf_page: meta?.page ?? null },
        }),
      );
    }

    if (descVsSpecs) {
      issues.push(
        makeIssue({
          ...base,
          id: `senox:${sku}:desc_specs`,
          severity: "low",
          type: "data_quality",
          message: `PDF description (€${descListe}) ≠ specs (€${specsListe})`,
          meta: { desc_liste: descListe, specs_liste: specsListe },
        }),
      );
    }

    const pdfMutPct = pctDiff(pdfListe, mutListe);
    if (pdfMutPct != null && pdfMutPct > 15 && pdfListe && mutListe) {
      issues.push(
        makeIssue({
          ...base,
          id: `senox:${sku}:pdf_mut_conflict`,
          severity: "low",
          type: "data_quality",
          message: `PDF (€${pdfListe}) ile Mutbex (€${mutListe}) arasında %${pdfMutPct} fark`,
          meta: { pdf_liste: pdfListe, mut_liste: mutListe, pdf_mut_pct: pdfMutPct },
        }),
      );
    }
  }

  const status = formulaBad > 0 ? "error" : issues.length > 0 ? "warn" : "ok";
  return {
    check: {
      status,
      total: siteRows.length,
      formula_ok: formulaOk,
      formula_bad: formulaBad,
      guncelleme_oner: guncellemeOner,
      pdf_page_order: pageOrder,
      desc_specs_fark: descSpecs,
      formula: "liste × 0,50 × kur × 1,20 KDV → fiyat_tl",
    },
    issues,
  };
}

/**
 * @param {number} kur
 * @returns {Promise<{ check: object, issues: import('./catalog-agent-types.mjs').CatalogIssue[] }>}
 */
export async function auditYukselIthal(kur) {
  const issues = [];
  if (!YUKSEL_ITHAL) {
    return {
      check: { status: "skipped", reason: "YÜKSEL İTHAL JSON bulunamadı", total: 0 },
      issues: [],
    };
  }

  const catalog = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
  const pdf = JSON.parse(fs.readFileSync(YUKSEL_ITHAL, "utf8"));
  const byRef = new Map(pdf.map((r) => [String(r.sku || r.model).toUpperCase().replace(/\s+/g, ""), r]));

  let ok = 0;
  let bad = 0;
  let missing = 0;

  for (const p of catalog) {
    const sku = String(p.sku || "").trim();
    const yRef = SKU_TO_YUKSEL_REF[sku];
    if (!yRef) continue;

    const src = byRef.get(yRef.toUpperCase().replace(/\s+/g, ""));
    let liste = src ? Number(src.fiyat_euro) : NaN;
    if (!(liste > 0) && MANUAL_LISTE_EUR[yRef]) liste = MANUAL_LISTE_EUR[yRef];

    if (!(liste > 0)) {
      missing++;
      issues.push(
        makeIssue({
          id: `yuksel_ithal:${sku}:missing_source`,
          brand: "yuksel_ithal",
          severity: "medium",
          type: "missing_source",
          sku,
          model: p.model || "",
          name: String(p.name || "").slice(0, 80),
          message: `PDF'de liste fiyatı yok (ref: ${yRef})`,
          meta: { yRef },
        }),
      );
      continue;
    }

    const exp = priceFromListe(liste, kur, 1 - YUKSEL_ISK);
    const cur = Number(p.fiyat_tl) || 0;
    const diff = cur - exp.kdvDahil;
    if (Math.abs(diff) <= TOL) {
      ok++;
      continue;
    }

    bad++;
    issues.push(
      makeIssue({
        id: `yuksel_ithal:${sku}:price_mismatch`,
        brand: "yuksel_ithal",
        severity: Math.abs(diff) > 1000 ? "high" : "medium",
        type: "price_mismatch",
        sku,
        model: p.model || "",
        name: String(p.name || "").slice(0, 80),
        site_tl: cur,
        expected_tl: exp.kdvDahil,
        diff_tl: diff,
        liste_eur: liste,
        source: "yuksel-2025-ithal",
        message: `Robot Coupe fiyat sapması: ₺${cur.toLocaleString("tr-TR")} → ₺${exp.kdvDahil.toLocaleString("tr-TR")}`,
        meta: { yRef, net_eur: exp.netEur },
      }),
    );
  }

  const total = ok + bad + missing;
  return {
    check: {
      status: bad > 0 ? "error" : missing > 0 ? "warn" : "ok",
      total,
      ok,
      bad,
      missing,
      formula: "liste × 0,65 × kur × 1,20 KDV → fiyat_tl",
    },
    issues,
  };
}

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function cmModelKeys(cm) {
  const keys = new Set();
  const code = String(cm.code || "").trim();
  const m251 = code.match(/^251\.(.+)$/i);
  if (m251) {
    keys.add(normHay(m251[1].replace(/\./g, "-")));
    keys.add(normHay(m251[1].replace(/\./g, "")));
  }
  keys.add(normHay(code));
  const nameM = String(cm.name || "").match(
    /\bPortabianco\s+([A-Z0-9][A-Z0-9./-]{2,}?)(?:\s|,|$)/i,
  );
  if (nameM) {
    keys.add(normHay(nameM[1]));
    keys.add(normHay(nameM[1].replace(/\./g, "-")));
  }
  return [...keys].filter((k) => k.length >= 3);
}

function rowLookupKeys(sku) {
  const s = String(sku || "").trim();
  const keys = new Set([normHay(s)]);
  if (/E$/.test(s) && !/-E$/.test(s)) keys.add(normHay(s.replace(/E$/, "-E")));
  if (/-E$/.test(s)) keys.add(normHay(s.replace(/-E$/, "E")));
  const noEko = s.replace(/-EKO$/i, "");
  if (noEko !== s) keys.add(normHay(noEko));
  return [...keys];
}

function buildCmIndex(rows) {
  const m = new Map();
  for (const cm of rows) {
    for (const k of cmModelKeys(cm)) {
      if (!m.has(k)) m.set(k, cm);
    }
  }
  return m;
}

function findCmExact(sku, idx) {
  for (const k of rowLookupKeys(sku)) {
    if (idx.has(k)) return idx.get(k);
  }
  return null;
}

function isYukselPortabianco(row) {
  return (
    /portabianco/i.test(String(row.brand || "")) &&
    (String(row.kaynak_fiyat_listesi || "").includes("yuksel") ||
      row.category === "bar-blender")
  );
}

function priceFromCafemarkt(cmPriceKdvDahil, eurTry) {
  const cm = Number(cmPriceKdvDahil);
  if (!cm || cm <= 0) return null;
  const kdvDahil = Math.round(cm * CM_MULT * 100) / 100;
  const netTry = kdvDahil / (1 + KDV / 100);
  return { kdvDahil, netTry: Math.round(netTry), cmRef: cm, eurTry };
}

function priceFromEuro(listEur, eurTry) {
  const netEur = Math.round(listEur * YUKSEL_NET_MULT * 100) / 100;
  const netTry = netEur * eurTry;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    netEur,
    netTry: Math.round(netTry),
    kdvDahil: Math.round(kdvDahil * 100) / 100,
    listEur,
  };
}

/**
 * @param {number} kur
 * @returns {{ check: object, issues: import('./catalog-agent-types.mjs').CatalogIssue[] }}
 */
export function auditPortabianco(kur) {
  const issues = [];
  if (!fs.existsSync(YUKSEL_YERLI) || !fs.existsSync(CM_JSON)) {
    return {
      check: {
        status: "skipped",
        reason: !fs.existsSync(YUKSEL_YERLI) ? "Yuksel yerli JSON yok" : "Cafemarkt cache yok",
        total: 0,
      },
      issues: [],
    };
  }

  const yuksel = JSON.parse(fs.readFileSync(YUKSEL_YERLI, "utf8"));
  const srcBySku = new Map(
    yuksel.map((r) => [String(r.model || r.sku || "").toUpperCase(), r]),
  );
  const cmIndex = buildCmIndex(JSON.parse(fs.readFileSync(CM_JSON, "utf8")));
  const sogutma = JSON.parse(fs.readFileSync(path.join(DEPT, "sogutma.json"), "utf8"));
  const icecek = JSON.parse(fs.readFileSync(path.join(DEPT, "icecek.json"), "utf8"));
  const rows = [
    ...sogutma.filter(isYukselPortabianco),
    ...icecek.filter((r) => r.category === "bar-blender"),
  ];

  let ok = 0;
  let bad = 0;

  for (const row of rows) {
    const sku = String(row.sku || row.model || "").trim();
    const cur = Number(row.fiyat_tl) || 0;
    const src = srcBySku.get(sku.toUpperCase());
    const cmExact = findCmExact(sku, cmIndex);

    let exp = null;
    if (cmExact?.price_try_kdv_dahil > 0) {
      const p = priceFromCafemarkt(cmExact.price_try_kdv_dahil, kur);
      if (p) exp = { rule: "cafemarkt", ...p, cmCode: cmExact.code };
    } else if (src?.fiyat_euro > 0) {
      const p = priceFromEuro(Number(src.fiyat_euro), kur);
      exp = { rule: "yuksel", ...p };
    }

    if (!exp) {
      bad++;
      issues.push(
        makeIssue({
          id: `portabianco:${sku}:missing_source`,
          brand: "portabianco",
          severity: "medium",
          type: "missing_source",
          sku,
          model: row.model || sku,
          name: String(row.name || "").slice(0, 80),
          site_tl: cur,
          message: "Yuksel veya Cafemarkt kaynağı bulunamadı",
          meta: { dept: row.dept },
        }),
      );
      continue;
    }

    const compareExpected =
      row.category === "bar-blender" || row.dept === "icecek"
        ? Math.round(exp.kdvDahil)
        : exp.netTry;
    const diff = cur - compareExpected;

    if (Math.abs(diff) <= TOL) {
      ok++;
      continue;
    }

    bad++;
    issues.push(
      makeIssue({
        id: `portabianco:${sku}:price_mismatch`,
        brand: "portabianco",
        severity: Math.abs(diff) > 500 ? "high" : "medium",
        type: "price_mismatch",
        sku,
        model: row.model || sku,
        name: String(row.name || "").slice(0, 80),
        site_tl: cur,
        expected_tl: compareExpected,
        diff_tl: diff,
        source: exp.rule,
        competitor: exp.rule === "cafemarkt" ? "cafemarkt" : null,
        competitor_tl: exp.cmRef ?? null,
        message: `${exp.rule} kuralına göre ₺${cur.toLocaleString("tr-TR")} → beklenen ₺${compareExpected.toLocaleString("tr-TR")}`,
        meta: {
          dept: row.dept,
          kdv_dahil: exp.kdvDahil,
          cm_code: exp.cmCode,
        },
      }),
    );
  }

  return {
    check: {
      status: bad > 0 ? "error" : "ok",
      total: rows.length,
      ok,
      bad,
      formula_cafemarkt: `KDV dahil × ${CM_MULT} (−%${CM_DISCOUNT * 100})`,
      formula_yuksel: `liste × ${YUKSEL_NET_MULT} × kur, KDV %${KDV}`,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./catalog-agent-types.mjs').CatalogIssue[] }}
 */
export function auditRationalCompetitors() {
  const issues = [];
  if (!fs.existsSync(RATIONAL_COMPARE)) {
    return {
      check: { status: "skipped", reason: "Rational karşılaştırma raporu yok — npm run catalog:rational:compare", total: 0 },
      issues: [],
    };
  }

  const data = JSON.parse(fs.readFileSync(RATIONAL_COMPARE, "utf8"));
  const rows = Array.isArray(data.rows) ? data.rows : [];
  let cheaperCount = 0;
  let advantageCount = 0;

  for (const row of rows) {
    if (!row.in_equsto) continue;
    const equsto = row.market?.equsto?.price_try_kdv_dahil;
    if (!(equsto > 0)) continue;
    const sku = row.sku || "";
    const base = {
      brand: "rational",
      sku,
      model: sku,
      name: String(row.name || "").slice(0, 80),
      site_tl: equsto,
    };

    const competitors = [
      { key: "cafemarkt", price: row.market?.cafemarkt?.price_try_kdv_dahil },
      { key: "mutbex", price: row.market?.mutbex?.price_try_kdv_dahil },
      { key: "akakce", price: row.market?.akakce_en_ucuz?.price_try_kdv_dahil },
    ].filter((c) => c.price > 0);

    const minComp = competitors.reduce(
      (best, c) => (!best || c.price < best.price ? c : best),
      null,
    );

    if (minComp && minComp.price < equsto) {
      const pct = Math.round(((equsto - minComp.price) / equsto) * 1000) / 10;
      if (pct >= 3) {
        cheaperCount++;
        issues.push(
          makeIssue({
            ...base,
            id: `rational:${sku}:competitor_cheaper`,
            severity: pct >= 10 ? "high" : "medium",
            type: "competitor_gap",
            expected_tl: minComp.price,
            diff_tl: equsto - minComp.price,
            competitor: minComp.key,
            competitor_tl: minComp.price,
            message: `${minComp.key} ₺${Math.round(minComp.price).toLocaleString("tr-TR")} — Equsto %${pct} pahalı`,
            meta: {
              equsto_vs_pct: pct,
              min_price_tl: row.min_price_tl,
              equsto_en_ucuz: row.equsto_en_ucuz,
            },
          }),
        );
      }
    }

    if (row.equsto_en_ucuz) {
      advantageCount++;
      const second = row.rank_among_known?.[1];
      if (second?.price > equsto) {
        const leadPct = Math.round(((second.price - equsto) / second.price) * 1000) / 10;
        if (leadPct >= 5) {
          issues.push(
            makeIssue({
              ...base,
              id: `rational:${sku}:competitor_advantage`,
              brand: "rational",
              severity: "low",
              type: "competitor_advantage",
              competitor: second.site,
              competitor_tl: second.price,
              message: `Pazarda en ucuz — ${second.site}'dan %${leadPct} daha düşük`,
              meta: { lead_pct: leadPct },
            }),
          );
        }
      }
    }
  }

  return {
    check: {
      status: cheaperCount > 5 ? "warn" : "ok",
      total: rows.filter((r) => r.in_equsto).length,
      competitor_cheaper: cheaperCount,
      equsto_advantage: advantageCount,
      fetched_at: data.summary?.fetched_at || null,
      source: path.basename(RATIONAL_COMPARE),
    },
    issues,
  };
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * @param {import('./catalog-agent-types.mjs').CatalogIssue[]} issues
 */
export function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 9;
    const sb = SEVERITY_ORDER[b.severity] ?? 9;
    if (sa !== sb) return sa - sb;
    return Math.abs(b.diff_tl || 0) - Math.abs(a.diff_tl || 0);
  });
}

/**
 * @param {import('./catalog-agent-types.mjs').CatalogIssue[]} issues
 */
export function summarizeIssues(issues) {
  const byBrand = {};
  const byType = {};
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of issues) {
    byBrand[i.brand] = (byBrand[i.brand] || 0) + 1;
    byType[i.type] = (byType[i.type] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
  }
  return {
    totalIssues: issues.length,
    ...bySeverity,
    byBrand,
    byType,
  };
}

/**
 * @returns {Promise<import('./catalog-agent-types.mjs').CatalogAgentReport>}
 */
export async function runCatalogAgentChecks() {
  const started = Date.now();
  const kurRes = await fetchTcmbEurRate();
  const kur = kurRes.rate;

  const [senox, yukselIthal] = await Promise.all([
    auditSenoxDetailed(kur),
    auditYukselIthal(kur),
  ]);
  const portabianco = auditPortabianco(kur);
  const rational = auditRationalCompetitors();

  const allIssues = sortIssues([
    ...senox.issues,
    ...yukselIthal.issues,
    ...portabianco.issues,
    ...rational.issues,
  ]);

  const checks = {
    senox: senox.check,
    yuksel_ithal: yukselIthal.check,
    portabianco: portabianco.check,
    rational_compare: rational.check,
  };

  const overallStatus = Object.values(checks).some((c) => c.status === "error")
    ? "error"
    : allIssues.some((i) => i.severity === "high" || i.severity === "critical")
      ? "warn"
      : allIssues.length > 0
        ? "info"
        : "ok";

  return {
    generatedAt: new Date().toISOString(),
    kur,
    kurFallback: !!kurRes.fallback,
    durationMs: Date.now() - started,
    status: overallStatus,
    summary: summarizeIssues(allIssues),
    checks,
    issues: allIssues.slice(0, 200),
    issueCount: allIssues.length,
    aiSummary: null,
  };
}
