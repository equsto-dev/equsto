/**
 * Evrensel katalog fiyat denetimi — L1 formül, L2 kaynak, L3 piyasa/oran, L4 anomali.
 * Marka özel mantık yalnızca L2 SourceAdapter içinde.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadVoscoPdfCatalog,
  findPdfListPrice,
  normVoscoKey,
} from "./vosco-pdf-prices.mjs";

function makeIssue(p) {
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

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEPT = path.join(ROOT, "public/data/dept");

const TOL_TL = 5;
const TOL_PCT = 0.008; // %0.8
const L3_LOW = 0.55;
const L3_HIGH = 1.55;
const L4_Z = 3.5;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function almostEqual(a, b) {
  const diff = Math.abs(a - b);
  if (diff <= TOL_TL) return true;
  const base = Math.max(Math.abs(a), Math.abs(b), 1);
  return diff / base <= TOL_PCT;
}

function sourceKey(row) {
  return String(
    row.fiyat_kaynagi ||
      row.kaynak_fiyat_listesi ||
      row.fiyat_kaynak ||
      row.kaynak ||
      "",
  ).trim();
}

function skuOf(row) {
  return String(row.sku || row.model || row.urun_kodu || row.electrolux_cod || "").trim();
}

/** @returns {object[]} */
export function loadAllDeptRows() {
  if (!fs.existsSync(DEPT)) return [];
  const out = [];
  for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json"))) {
    let rows;
    try {
      rows = JSON.parse(fs.readFileSync(path.join(DEPT, f), "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      out.push({ ...r, _deptFile: f.replace(/\.json$/, "") });
    }
  }
  return out;
}

/**
 * Import sırasında yazılmış satış tutarından beklenen KDV dahil TL.
 * Yuvarlama: önce net yuvarla, sonra ×(1+KDV) — Electrolux/Özti stili.
 */
/** Tüm makul formül adaylarını üret (ilk eşleşen değil — L1 hepsini dener). */
export function expectedTlCandidates(row, liveEur = 0, liveUsd = 0) {
  const kdv = (num(row.kdv_oran) || 20) / 100;
  const kurEur = num(row.kur_eur_try) || liveEur;
  const kurUsd = num(row.kur_usd_try) || liveUsd;
  /** @type {{expected:number,path:string,liste:number|null}[]} */
  const out = [];
  const push = (expected, pathName, liste) => {
    if (!(expected > 0)) return;
    out.push({ expected, path: pathName, liste });
  };

  const satisTl = num(row.satis_fiyati_tl);
  if (satisTl > 0) push(Math.round(satisTl * (1 + kdv)), "satis_fiyati_tl", num(row.liste_fiyati_tl) || null);

  const satisEur = num(
    row.satis_fiyati_eur || row.satis_eur_indirimli || row.iskontolu_fiyat,
  );
  if (satisEur > 0 && kurEur > 0) {
    const net = Math.round(satisEur * kurEur);
    push(Math.round(net * (1 + kdv)), "satis_eur×kur", num(row.liste_fiyati_eur) || null);
  }

  const satisOran = num(row.satis_oran);
  const listeTl = num(row.liste_fiyati_tl);
  if (listeTl > 0 && satisOran > 0) {
    push(Math.round(listeTl * satisOran * (1 + kdv)), "liste_tl×satis_oran", listeTl);
  }

  const listeUsd = num(row.liste_fiyati_usd_pdf || row.liste_fiyati_usd);
  if (listeUsd > 0 && satisOran > 0 && kurUsd > 0) {
    const lt = Math.round(listeUsd * kurUsd * 100) / 100;
    push(Math.round(lt * satisOran * (1 + kdv)), "liste_usd×kur×satis_oran", listeUsd);
  }

  const listeEur = num(row.liste_fiyati_eur || row.liste_fiyati);
  if (listeEur > 0 && satisOran > 0 && kurEur > 0) {
    const satis = Math.round(listeEur * satisOran * 100) / 100;
    const net = Math.round(satis * kurEur);
    push(Math.round(net * (1 + kdv)), "liste_eur×satis_oran", listeEur);
  }

  const bayiIsk = num(row.bayi_iskonto);
  const iskontoYuzde = num(row.iskonto_oran);
  if (listeEur > 0 && kurEur > 0 && (bayiIsk > 0 || iskontoYuzde > 0)) {
    const isk = bayiIsk > 0 ? bayiIsk : iskontoYuzde / 100;
    if (isk > 0 && isk < 1) {
      const isOztiStyle =
        /ozti/i.test(sourceKey(row)) ||
        (bayiIsk > 0 && !satisOran && iskontoYuzde >= 60);
      for (const [mult, label] of isOztiStyle
        ? [[1.08, "liste×(1-isk)×1.08"]]
        : [
            [1, "liste×(1-isk)"],
            [1.08, "liste×(1-isk)×1.08"],
          ]) {
        const satis = Math.round(listeEur * (1 - isk) * mult * 100) / 100;
        const net = Math.round(satis * kurEur);
        push(Math.round(net * (1 + kdv)), label, listeEur);
      }
    }
  }

  const netTl = num(row.fiyat_tl_net);
  if (netTl > 0) push(Math.round(netTl * (1 + kdv)), "fiyat_tl_net×KDV", null);

  return out;
}

export function expectedTlFromRow(row, liveEur = 0, liveUsd = 0) {
  const c = expectedTlCandidates(row, liveEur, liveUsd);
  return c[0] || null;
}

/** L1 — formül tutarlılığı (tüm ürünler) */
export function auditL1Formula(rows, liveEur, liveUsd) {
  const issues = [];
  let checked = 0;
  let skipped = 0;
  let bad = 0;

  for (const row of rows) {
    const site = num(row.fiyat_tl);
    if (!(site > 0)) {
      skipped++;
      continue;
    }
    const candidates = [
      ...expectedTlCandidates(row, 0, 0),
      ...expectedTlCandidates(
        { ...row, kur_eur_try: liveEur, kur_usd_try: liveUsd },
        liveEur,
        liveUsd,
      ),
    ];
    if (!candidates.length) {
      skipped++;
      continue;
    }
    checked++;
    const hit = candidates.find((c) => almostEqual(c.expected, site));
    if (hit) continue;

    const best = candidates.reduce((a, b) =>
      Math.abs(a.expected - site) <= Math.abs(b.expected - site) ? a : b,
    );
    bad++;
    const diff = site - best.expected;
    const pct = Math.abs(diff) / Math.max(site, 1);
    issues.push(
      makeIssue({
        id: `l1:${row._deptFile || ""}:${skuOf(row)}`,
        brand: row.brand || "?",
        severity: pct >= 0.05 ? "critical" : pct >= 0.02 ? "high" : "medium",
        type: "price_mismatch",
        sku: skuOf(row),
        model: String(row.model || ""),
        name: String(row.name || "").slice(0, 120),
        message: `L1 formül: sitede ₺${site.toLocaleString("tr-TR")}, en yakın ₺${best.expected.toLocaleString("tr-TR")} (${best.path})`,
        site_tl: site,
        expected_tl: best.expected,
        diff_tl: diff,
        liste_eur: typeof best.liste === "number" ? best.liste : null,
        source: sourceKey(row),
        meta: {
          layer: "L1",
          path: best.path,
          dept: row._deptFile,
          candidateCount: candidates.length,
        },
      }),
    );
  }

  return {
    check: {
      status: bad === 0 ? "ok" : bad / Math.max(checked, 1) > 0.05 ? "error" : "warn",
      total: rows.length,
      checked,
      skipped,
      bad,
      formula: "liste/satis alanlarından KDV dahil TL yeniden hesap",
    },
    issues,
  };
}

function loadJsonSafe(p) {
  if (!fs.existsSync(p)) return null;
  let raw = fs.readFileSync(p, "utf8");
  raw = raw.replace(/:\s*NaN/g, ": null");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadElectroluxSource() {
  const data = loadJsonSafe(path.join(ROOT, "scripts/data/electrolux-fiyat-2026.json"));
  const by = data?.by_cod || {};
  return {
    id: "electrolux-fiyat-listesi-2026",
    /** @param {object} row */
    lookup(row) {
      const cod = String(row.electrolux_cod || row.sku || row.model || "").trim();
      const hit = by[cod];
      if (!hit || !(hit.liste_fiyati_eur > 0)) return null;
      return {
        liste: hit.liste_fiyati_eur,
        currency: "EUR",
        siteListe: num(row.liste_fiyati_eur || row.liste_fiyati),
        label: `PDF COD ${cod} / ${hit.model || ""}`,
      };
    },
  };
}

function loadVoscoSource() {
  const pdf = loadVoscoPdfCatalog();
  return {
    id: "vosco-pdf-2026",
    lookup(row) {
      const match = findPdfListPrice(
        { stockCode: row.sku || row.model, model: row.model || row.sku },
        pdf.index,
        pdf.products,
      );
      if (!match) return null;
      const siteUsd = num(row.liste_fiyati_usd_pdf || row.liste_fiyati_usd);
      const siteEur = num(row.liste_fiyati_eur_pdf || row.liste_fiyati_eur);
      if (match.listeUsd > 0) {
        return {
          liste: match.listeUsd,
          currency: "USD",
          siteListe: siteUsd,
          label: `Vosco PDF ${normVoscoKey(row.sku || row.model)}`,
        };
      }
      if (match.listeEur > 0) {
        return {
          liste: match.listeEur,
          currency: "EUR",
          siteListe: siteEur,
          label: `Vosco PDF ${normVoscoKey(row.sku || row.model)}`,
        };
      }
      return null;
    },
  };
}

function loadOztiSource() {
  const arr = loadJsonSafe(path.join(ROOT, "scripts/data/ozti-fiyat-2025.json"));
  const by = new Map();
  if (Array.isArray(arr)) {
    for (const p of arr) {
      const k = String(p.urun_kodu_norm || p.urun_kodu || "").trim();
      if (k && p.liste_fiyati_eur > 0) by.set(k, p);
    }
  }
  return {
    id: "ozti-fiyat-listesi-2025",
    lookup(row) {
      const k = String(row.sku || row.urun_kodu || row.model || "").trim();
      const hit = by.get(k);
      if (!hit) return null;
      return {
        liste: hit.liste_fiyati_eur,
        currency: "EUR",
        siteListe: num(row.liste_fiyati_eur || row.liste_fiyati),
        label: `Özti ${k}`,
      };
    },
  };
}

const SOURCE_MATCH = [
  { test: /electrolux/i, factory: loadElectroluxSource },
  { test: /vosco/i, factory: loadVoscoSource },
  { test: /ozti/i, factory: loadOztiSource },
];

/** L2 — kaynak listedeki liste fiyatı vs sitedeki liste */
export function auditL2Source(rows) {
  /** @type {Map<string, ReturnType<typeof loadElectroluxSource>>} */
  const adapters = new Map();
  const issues = [];
  let checked = 0;
  let skipped = 0;
  let bad = 0;
  let noAdapter = 0;

  for (const row of rows) {
    const src = sourceKey(row);
    if (!src) {
      skipped++;
      continue;
    }
    let adapter = adapters.get(src);
    if (!adapter) {
      const conf = SOURCE_MATCH.find((c) => c.test.test(src));
      if (!conf) {
        noAdapter++;
        continue;
      }
      adapter = conf.factory();
      adapters.set(src, adapter);
    }
    const hit = adapter.lookup(row);
    if (!hit || !(hit.liste > 0)) {
      skipped++;
      continue;
    }
    if (!(hit.siteListe > 0)) {
      skipped++;
      continue;
    }
    checked++;
    const rel = Math.abs(hit.siteListe - hit.liste) / hit.liste;
    if (rel <= 0.002 || Math.abs(hit.siteListe - hit.liste) < 0.05) continue;
    bad++;
    issues.push(
      makeIssue({
        id: `l2:${skuOf(row)}`,
        brand: row.brand || "?",
        severity: rel >= 0.1 ? "critical" : rel >= 0.02 ? "high" : "medium",
        type: "price_mismatch",
        sku: skuOf(row),
        model: String(row.model || ""),
        name: String(row.name || "").slice(0, 120),
        message: `L2 kaynak: sitede liste ${hit.siteListe} ${hit.currency}, kaynak ${hit.liste} ${hit.currency} (${hit.label})`,
        site_tl: num(row.fiyat_tl) || null,
        expected_tl: null,
        diff_tl: hit.siteListe - hit.liste,
        liste_eur: hit.currency === "EUR" ? hit.liste : null,
        source: src,
        meta: {
          layer: "L2",
          sourceListe: hit.liste,
          siteListe: hit.siteListe,
          currency: hit.currency,
          dept: row._deptFile,
        },
      }),
    );
  }

  return {
    check: {
      status: bad === 0 ? "ok" : "warn",
      total: rows.length,
      checked,
      skipped,
      bad,
      noAdapter,
      adapters: [...adapters.keys()],
      formula: "kaynak PDF/JSON liste ↔ site liste_* alanı",
    },
    issues,
  };
}

/**
 * L3 — marka içi ödeme oranı sapması + varsa site/rakip fiyatı
 * impliedRatio = fiyat_tl / (liste_tl_kdv_dahil)
 */
export function auditL3Market(rows, liveEur, liveUsd) {
  const issues = [];
  /** @type {Map<string, number[]>} */
  const ratiosByBrand = new Map();
  const prepared = [];

  for (const row of rows) {
    const site = num(row.fiyat_tl);
    if (!(site > 0)) continue;
    const kdv = 1 + (num(row.kdv_oran) || 20) / 100;
    const kurEur = num(row.kur_eur_try) || liveEur;
    const kurUsd = num(row.kur_usd_try) || liveUsd;

    let listeTl = num(row.liste_fiyati_tl);
    if (!(listeTl > 0)) {
      const usd = num(row.liste_fiyati_usd_pdf || row.liste_fiyati_usd);
      const eur = num(row.liste_fiyati_eur || row.liste_fiyati);
      if (usd > 0 && kurUsd > 0) listeTl = usd * kurUsd;
      else if (eur > 0 && kurEur > 0) listeTl = eur * kurEur;
    }
    if (!(listeTl > 0)) continue;

    const full = listeTl * kdv;
    if (!(full > 0)) continue;
    const ratio = site / full;
    const brand = row.brand || "?";
    if (!ratiosByBrand.has(brand)) ratiosByBrand.set(brand, []);
    ratiosByBrand.get(brand).push(ratio);
    prepared.push({ row, site, full, ratio, brand });

    const rival = num(
      row.site_fiyat_kdv_dahil ||
        row.sitePriceTry ||
        row.competitor_tl ||
        row.cafemarkt_fiyat_tl,
    );
    if (rival >= 100) {
      const r = site / rival;
      if (r < 0.7 || r > 1.2) {
        issues.push(
          makeIssue({
            id: `l3-rival:${skuOf(row)}`,
            brand,
            severity: r < 0.7 ? "critical" : "high",
            type: r < 1 ? "competitor_gap" : "competitor_advantage",
            sku: skuOf(row),
            model: String(row.model || ""),
            name: String(row.name || "").slice(0, 120),
            message: `L3 piyasa: Equsto ₺${site.toLocaleString("tr-TR")} vs referans ₺${Math.round(rival).toLocaleString("tr-TR")} (oran ${(r * 100).toFixed(0)}%)`,
            site_tl: site,
            expected_tl: Math.round(rival),
            diff_tl: site - rival,
            source: sourceKey(row),
            competitor: "referans_fiyat",
            competitor_tl: rival,
            meta: { layer: "L3", kind: "rival", ratio: r, dept: row._deptFile },
          }),
        );
      }
    }
  }

  /** @type {Map<string, number>} */
  const median = new Map();
  for (const [brand, arr] of ratiosByBrand) {
    if (arr.length < 15) continue;
    const s = [...arr].sort((a, b) => a - b);
    median.set(brand, s[Math.floor(s.length / 2)]);
  }

  let checked = 0;
  let bad = 0;
  for (const p of prepared) {
    const med = median.get(p.brand);
    if (!(med > 0)) continue;
    checked++;
    if (p.ratio >= med * L3_LOW && p.ratio <= med * L3_HIGH) continue;
    bad++;
    const low = p.ratio < med * L3_LOW;
    issues.push(
      makeIssue({
        id: `l3-ratio:${skuOf(p.row)}`,
        brand: p.brand,
        severity: low && p.ratio < med * 0.55 ? "critical" : "high",
        type: "price_mismatch",
        sku: skuOf(p.row),
        model: String(p.row.model || ""),
        name: String(p.row.name || "").slice(0, 120),
        message: `L3 oran: ödeme ${(p.ratio * 100).toFixed(1)}% (marka medyan ${(med * 100).toFixed(1)}%) — liste KDV dahil ₺${Math.round(p.full).toLocaleString("tr-TR")}`,
        site_tl: p.site,
        expected_tl: Math.round(p.full * med),
        diff_tl: p.site - Math.round(p.full * med),
        source: sourceKey(p.row),
        meta: {
          layer: "L3",
          kind: "brand_ratio",
          ratio: p.ratio,
          brandMedian: med,
          dept: p.row._deptFile,
        },
      }),
    );
  }

  return {
    check: {
      status: bad === 0 && issues.length === 0 ? "ok" : "warn",
      total: prepared.length,
      checked,
      bad,
      brandsWithMedian: median.size,
      formula: "fiyat / (liste×KDV) marka medyanına göre + referans fiyat",
    },
    issues,
  };
}

/** L4 — aynı dept+category içinde fiyat anomalisi (log-IQR) */
export function auditL4Anomaly(rows) {
  /** @type {Map<string, {row: object, price: number}[]>} */
  const groups = new Map();
  for (const row of rows) {
    const price = num(row.fiyat_tl);
    if (!(price > 0)) continue;
    const key = `${row._deptFile || "?"}::${row.category || row.brand || "?"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ row, price });
  }

  const issues = [];
  let checked = 0;
  let bad = 0;

  for (const [key, items] of groups) {
    if (items.length < 12) continue;
    const logs = items.map((x) => Math.log(x.price)).sort((a, b) => a - b);
    const q1 = logs[Math.floor(logs.length * 0.25)];
    const q3 = logs[Math.floor(logs.length * 0.75)];
    const iqr = q3 - q1 || 0.01;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;

    for (const it of items) {
      checked++;
      const lp = Math.log(it.price);
      if (lp >= lo && lp <= hi) continue;
      // Aşırı uçlar
      const z = (lp - (q1 + q3) / 2) / (iqr / 1.349);
      if (Math.abs(z) < L4_Z) continue;
      bad++;
      const low = lp < lo;
      issues.push(
        makeIssue({
          id: `l4:${skuOf(it.row)}`,
          brand: it.row.brand || "?",
          severity: Math.abs(z) >= 5 ? "high" : "medium",
          type: "data_quality",
          sku: skuOf(it.row),
          model: String(it.row.model || ""),
          name: String(it.row.name || "").slice(0, 120),
          message: `L4 anomali: ₺${it.price.toLocaleString("tr-TR")} kategori içinde ${low ? "çok düşük" : "çok yüksek"} (${key})`,
          site_tl: it.price,
          source: sourceKey(it.row),
          meta: { layer: "L4", group: key, z: Math.round(z * 100) / 100, dept: it.row._deptFile },
        }),
      );
    }
  }

  return {
    check: {
      status: bad === 0 ? "ok" : "info",
      total: checked,
      bad,
      groups: [...groups.keys()].filter((k) => (groups.get(k) || []).length >= 12).length,
      formula: "log-fiyat IQR + z-score (dept×category)",
    },
    issues,
  };
}

/**
 * @param {number} liveEur
 * @param {number} liveUsd
 */
export function runUniversalAudits(liveEur, liveUsd) {
  const rows = loadAllDeptRows();
  const l1 = auditL1Formula(rows, liveEur, liveUsd);
  const l2 = auditL2Source(rows);
  const l3 = auditL3Market(rows, liveEur, liveUsd);
  const l4 = auditL4Anomaly(rows);
  return {
    rowCount: rows.length,
    l1,
    l2,
    l3,
    l4,
    issues: [...l1.issues, ...l2.issues, ...l3.issues, ...l4.issues],
  };
}
