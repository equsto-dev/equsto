#!/usr/bin/env node
/**
 * Equsto Pimak vs Cafemarkt — KDV dahil TL.
 *   node scripts/_compare-pimak-cafemarkt.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPTS = ["pisirme", "hazirlik", "araba", "set-ustu-mutfak", "servis", "market-reyon"];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EqustoPriceCompare/1.0";

function parseTlNum(s) {
  if (!s) return 0;
  if (String(s).includes(",")) return Math.round(parseFloat(String(s).replace(/\./g, "").replace(",", ".")));
  return Math.round(parseFloat(s));
}

function normKod(k) {
  return String(k || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

function cafeCodeToEqusto(code) {
  const raw = normKod(code);
  const aliases = new Set([raw]);
  let s = raw.replace(/^301\./, "");
  aliases.add(s);
  aliases.add(s.replace(/\./g, "-"));
  aliases.add(s.replace(/\./g, ""));

  // PI6.M005.K → PI6/M005-K
  aliases.add(s.replace(/^PI(\d+)\./, "PI$1/").replace(/\.([A-Z0-9]+)$/i, "-$1"));

  // KF.M079.2G → KF-M079-2G
  const kf = s.match(/^KF\.M(\d+)\.(\d)([A-Z])/i);
  if (kf) aliases.add(`KF-M${kf[1]}-${kf[2]}${kf[3]}`);

  // M079.4E → M079-4E
  const mNum = s.match(/^M(\d+)\.(\d+)([A-Z])/i);
  if (mNum) aliases.add(`M${mNum[1]}-${mNum[2]}${mNum[3]}`);

  // M.071.1 → M071-1
  const mDot = s.match(/^M\.(\d{3})\.(\d)$/);
  if (mDot) aliases.add(`M${mDot[1]}-${mDot[2]}`);

  // PTS09.MANUEL → PTS09-MANUEL
  const pts = s.match(/^(PTS\d+)\.([A-Z]+)$/);
  if (pts) aliases.add(`${pts[1]}-${pts[2]}`);

  // KM012.4, M057, DFKE10
  const simple = s.match(/^([A-Z]+\d+)\.(\d+)$/i);
  if (simple) aliases.add(`${simple[1]}-${simple[2]}`);

  // DFKE → DKFE (yazim farki)
  if (s.startsWith("DFKE")) aliases.add(s.replace(/^DFKE/, "DKFE"));

  // 70SD.M180.1 → 70SD-M180-1 vb.
  const seri = s.match(/^(\d+SD)\.M(\d+)\.(\d+)$/i);
  if (seri) aliases.add(`${seri[1]}-M${seri[2]}-${seri[3]}`);

  return [...aliases].filter((a) => a.length >= 3);
}

function equstoAliases(kod) {
  const n = normKod(kod);
  const out = new Set([n]);
  out.add(n.replace(/\//g, "-"));
  out.add(n.replace(/\./g, "-"));
  out.add(n.replace(/\./g, ""));
  out.add(n.replace(/\//g, ""));
  if (n.startsWith("PI/")) out.add(n.slice(3));
  return [...out];
}

function loadEqusto() {
  const out = [];
  for (const dept of DEPTS) {
    const arr = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/dept", `${dept}.json`), "utf8"));
    for (const r of arr) {
      if (r.brand !== "Pimak" || r.fiyat_bekleniyor) continue;
      out.push({
        kod: normKod(r.urun_kodu || r.sku),
        name: r.name || "",
        tl_kdv: r.fiyat_tl || 0,
        eur: r.satis_fiyati_eur || 0,
        liste_eur: r.liste_fiyati_eur || 0,
        dept,
      });
    }
  }
  return out;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "tr-T,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function scrapeCafemarktCatalog() {
  const slugs = new Set();
  for (let pg = 1; pg <= 8; pg++) {
    const url = pg === 1 ? "https://www.cafemarkt.com/pimak" : `https://www.cafemarkt.com/pimak?pg=${pg}`;
    const html = await fetchText(url);
    for (const m of html.matchAll(/href="(\/pimak-[^"?]+)"/gi)) slugs.add(m[1]);
    await new Promise((r) => setTimeout(r, 250));
  }

  const products = [];
  const slugArr = [...slugs];
  console.log("[cafemarkt] slug:", slugArr.length);

  for (let i = 0; i < slugArr.length; i++) {
    const slug = slugArr[i].replace(/^\//, "");
    const html = await fetchText(`https://www.cafemarkt.com/${slug}`);
    const supplier = html.match(/supplier-product-code">([^<]+)/i)?.[1]?.trim() || "";
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s+Fiyat.*/i, "").trim() || slug;
    let tl = 0;
    const vat = html.match(/id="product-price-vat-include"[^>]*value="([^"]+)"/i);
    if (vat) tl = parseTlNum(vat[1]);
    if (!tl) {
      const jp = html.match(/"price"\s*:\s*"?([\d.]+)"?/i);
      if (jp) tl = parseTlNum(jp[1]);
    }
    const codes = cafeCodeToEqusto(supplier);
    products.push({ slug, url: `https://www.cafemarkt.com/${slug}`, title, supplier, tl, codes });
    if ((i + 1) % 25 === 0) console.log("[cafemarkt] detay", i + 1, "/", slugArr.length);
    await new Promise((r) => setTimeout(r, 200));
  }
  return products;
}

function buildCafeIndex(cafe) {
  const byCode = new Map();
  for (const c of cafe) {
    if (!c.tl) continue;
    for (const code of c.codes) {
      if (!byCode.has(code)) byCode.set(code, c);
    }
    if (c.supplier) {
      for (const a of cafeCodeToEqusto(c.supplier)) byCode.set(a, c);
    }
  }
  return byCode;
}

function findCafe(e, byCode) {
  for (const a of equstoAliases(e.kod)) {
    if (byCode.has(a)) return byCode.get(a);
  }
  return null;
}

async function main() {
  const equsto = loadEqusto();
  console.log("[equsto] fiyatli:", equsto.length);

  const cafe = await scrapeCafemarktCatalog();
  const priced = cafe.filter((c) => c.tl > 0);
  console.log("[cafemarkt] fiyatli:", priced.length, "/", cafe.length);

  const byCode = buildCafeIndex(priced);
  const rows = [];
  const unmatched = [];

  for (const e of equsto) {
    const c = findCafe(e, byCode);
    if (!c) {
      unmatched.push(e);
      continue;
    }
    const diff = e.tl_kdv - c.tl;
    const pct = c.tl > 0 ? Math.round((diff / c.tl) * 1000) / 10 : 0;
    rows.push({
      kod: e.kod,
      name: e.name.slice(0, 55),
      equsto_tl: e.tl_kdv,
      cafe_tl: c.tl,
      diff_tl: diff,
      diff_pct: pct,
      equsto_cheaper: diff < -100,
      equsto_dearer: diff > 100,
      cafe_supplier: c.supplier,
      cafe_url: c.url,
      cafe_title: c.title.slice(0, 60),
    });
  }

  const cheaper = rows.filter((r) => r.equsto_cheaper);
  const dearer = rows.filter((r) => r.equsto_dearer);
  const similar = rows.filter((r) => !r.equsto_cheaper && !r.equsto_dearer);

  console.log("\n=== OZET (KDV dahil TL) ===");
  console.log("Eslesen:", rows.length, "/", equsto.length);
  console.log("Equsto ucuz (>100 TL):", cheaper.length);
  console.log("Equsto pahali (>100 TL):", dearer.length);
  console.log("Yakin (+/-100 TL):", similar.length);
  console.log("Eslesmeyen:", unmatched.length);

  if (cheaper.length) {
    const saves = cheaper.map((r) => -r.diff_tl).sort((a, b) => a - b);
    console.log("Equsto medyan tasarruf:", saves[Math.floor(saves.length / 2)], "TL");
  }
  if (dearer.length) {
    const overs = dearer.map((r) => r.diff_tl).sort((a, b) => a - b);
    console.log("Equsto medyan fark (pahali):", overs[Math.floor(overs.length / 2)], "TL");
  }

  console.log("\n--- Equsto daha ucuz (12) ---");
  cheaper
    .sort((a, b) => a.diff_tl - b.diff_tl)
    .slice(0, 12)
    .forEach((r) => {
      console.log(`${r.kod.padEnd(16)} ${r.equsto_tl} vs ${r.cafe_tl}  (${r.diff_pct}%)`);
    });

  console.log("\n--- Equsto daha pahali (12) ---");
  dearer
    .sort((a, b) => b.diff_tl - a.diff_tl)
    .slice(0, 12)
    .forEach((r) => {
      console.log(`${r.kod.padEnd(16)} ${r.equsto_tl} vs ${r.cafe_tl}  (+${r.diff_pct}%)`);
    });

  const outPath = path.join(ROOT, "scripts/out/pimak-equsto-vs-cafemarkt.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        note: "KDV dahil TL. Cafemarkt urun kodu = supplier-product-code.",
        equsto_priced: equsto.length,
        cafemarkt_scraped: cafe.length,
        cafemarkt_priced: priced.length,
        matched: rows.length,
        summary: { cheaper: cheaper.length, dearer: dearer.length, similar: similar.length, unmatched: unmatched.length },
        rows: rows.sort((a, b) => a.diff_pct - b.diff_pct),
        unmatched_equsto: unmatched.map((e) => ({ kod: e.kod, name: e.name, tl: e.tl_kdv })),
        cafemarkt_sample: priced.slice(0, 5),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log("\n[ok]", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
