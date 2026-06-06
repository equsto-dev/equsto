#!/usr/bin/env node
/**
 * Portabianco fiyat denetimi — Yuksel formul vs Cafemarkt −%7
 *   node scripts/verify-portabianco-prices.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const YUKSEL_SRC = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const ICECEK = path.join(ROOT, "public/data/dept/icecek.json");

const CM_DISCOUNT = Number(process.env.EQUSTO_CAFE_DISCOUNT || "0.07");
const CM_MULT = 1 - CM_DISCOUNT;
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = 1 - ISKONTO;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function fmtTry(n) {
  return Math.round(n).toLocaleString("tr-TR");
}

function priceFromCafemarkt(cmPriceKdvDahil) {
  const cm = Number(cmPriceKdvDahil);
  if (!cm || cm <= 0) return null;
  const kdvDahil = Math.round(cm * CM_MULT * 100) / 100;
  const netTry = kdvDahil / (1 + KDV / 100);
  return {
    kdvDahil,
    netTry: Math.round(netTry),
    cmRef: cm,
  };
}

function priceFromEuro(listEur) {
  const netEur = Math.round(listEur * NET_MULT * 100) / 100;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    netEur,
    netTry: Math.round(netTry),
    kdvDahil: Math.round(kdvDahil * 100) / 100,
    listEur,
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

function expectedPrice(sku, src, cmExact) {
  if (cmExact?.price_try_kdv_dahil > 0) {
    const p = priceFromCafemarkt(cmExact.price_try_kdv_dahil);
    return p
      ? {
          rule: "cafemarkt",
          ...p,
          cmCode: cmExact.code,
        }
      : null;
  }
  const listEur = Number(src?.fiyat_euro);
  if (listEur > 0) {
    const p = priceFromEuro(listEur);
    return { rule: "yuksel", ...p };
  }
  return null;
}

function main() {
  const yuksel = JSON.parse(fs.readFileSync(YUKSEL_SRC, "utf8"));
  const srcBySku = new Map(
    yuksel.map((r) => [String(r.model || r.sku || "").toUpperCase(), r]),
  );
  const cmIndex = buildCmIndex(JSON.parse(fs.readFileSync(CM_JSON, "utf8")));
  const rows = [
    ...JSON.parse(fs.readFileSync(SOGUTMA, "utf8")).filter(isYukselPortabianco),
    ...JSON.parse(fs.readFileSync(ICECEK, "utf8")).filter((r) => r.category === "bar-blender"),
  ];

  const ok = [];
  const bad = [];
  const dual = [];

  for (const row of rows) {
    const sku = String(row.sku || row.model || "").trim();
    const cur = Number(row.fiyat_tl) || 0;
    const src = srcBySku.get(sku.toUpperCase());
    const cmExact = findCmExact(sku, cmIndex);
    const exp = expectedPrice(sku, src, cmExact);
    const yukselExp = src?.fiyat_euro > 0 ? priceFromEuro(Number(src.fiyat_euro)) : null;
    const cmExp =
      cmExact?.price_try_kdv_dahil > 0
        ? priceFromCafemarkt(Number(cmExact.price_try_kdv_dahil))
        : null;

    if (!exp) {
      bad.push({ sku, dept: row.dept, reason: "kaynak-yok", cur });
      continue;
    }

    const diff = Math.abs(cur - exp.netTry);
    const entry = {
      sku,
      dept: row.dept,
      rule: exp.rule,
      cur,
      expected: exp.netTry,
      kdvDahil: exp.kdvDahil,
      diff,
      cmCode: exp.cmCode,
      cmRaw: exp.cmRef,
      yukselNet: yukselExp?.netTry,
      yukselListe: yukselExp?.listEur,
    };

    if (yukselExp && cmExp && exp.rule === "cafemarkt") {
      dual.push(entry);
    }

    if (diff <= 2) ok.push(entry);
    else bad.push(entry);
  }

  console.log("=== Portabianco fiyat denetimi ===");
  console.log(`Kur: 1 EUR = ${EUR_TRY} TRY`);
  console.log(`Yuksel: liste × ${NET_MULT} (iskonto %${ISKONTO * 100}) × kur, KDV %${KDV}`);
  console.log(`Cafemarkt: KDV dahil × ${CM_MULT} (−%${CM_DISCOUNT * 100}), net = KDV/(1+${KDV}%)`);
  console.log(`Toplam: ${rows.length} | OK: ${ok.length} | Uyumsuz: ${bad.length}\n`);

  console.log("--- Bar blender (icecek, Cafemarkt kurali) ---");
  ok.filter((e) => e.dept === "icecek").forEach((e) => {
    console.log(
      `  ${e.sku} OK | net ₺${fmtTry(e.cur)} | CM ₺${fmtTry(e.cmRaw)} → Equsto KDV ₺${fmtTry(e.kdvDahil)}`,
    );
  });
  bad.filter((e) => e.dept === "icecek").forEach((e) => {
    console.log(
      `  ${e.sku} HATA | katalog ₺${fmtTry(e.cur)} | beklenen ₺${fmtTry(e.expected)} | CM ₺${fmtTry(e.cmRaw || 0)}`,
    );
  });

  console.log("\n--- BAR/ST soğutucu (Yuksel kurali) ---");
  const barSt = ok.filter((e) => /^BAR|^ST-/i.test(e.sku));
  barSt.forEach((e) => {
    console.log(
      `  ${e.sku} OK | net ₺${fmtTry(e.cur)} | liste ${e.yukselListe} EUR → KDV ₺${fmtTry(e.kdvDahil)}`,
    );
  });
  bad.filter((e) => /^BAR|^ST-/i.test(e.sku)).forEach((e) => {
    console.log(
      `  ${e.sku} HATA | katalog ₺${fmtTry(e.cur)} | yuksel ₺${fmtTry(e.yukselNet || 0)}`,
    );
  });

  if (bad.length) {
    console.log("\n--- Diger uyumsuzluklar ---");
    bad.filter((e) => e.dept !== "icecek" && !/^BAR|^ST-/i.test(e.sku)).forEach((e) => {
      console.log(
        `  ${e.sku} [${e.rule}] katalog ₺${fmtTry(e.cur)} | beklenen ₺${fmtTry(e.expected)} | fark ${e.diff}`,
      );
    });
  }

  if (dual.length) {
    console.log(`\n--- Cafemarkt oncelikli (${dual.length} urun; yuksel daha dusuk) ---`);
    dual.slice(0, 5).forEach((e) => {
      console.log(
        `  ${e.sku}: CM net ₺${fmtTry(e.expected)} vs Yuksel net ₺${fmtTry(e.yukselNet)} (liste ${e.yukselListe} EUR)`,
      );
    });
    if (dual.length > 5) console.log(`  ... +${dual.length - 5} urun daha`);
  }

  process.exit(bad.length ? 1 : 0);
}

main();
