#!/usr/bin/env node
/**
 * Eksik elk/gaz kW — marka PDF/web kaynaklarından dept satırlarına yazar.
 *
 *   node scripts/fill-catalog-kw-from-sources.mjs
 *   node scripts/fill-catalog-kw-from-sources.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  fuelContextFromText,
  isPasifPfosEkipman,
  isPoweredPfosEkipman,
  parseKwFromText,
  resolveKwFromSources,
} from "../lib/catalog/kw-resolve.ts";
import { parsePimakGucFromTeknikLine } from "../lib/catalog/pimak-kw.ts";

function formatKwDisplay(kw) {
  if (kw == null || !Number.isFinite(kw)) return "";
  const s = String(kw);
  return (s.includes(".") ? s.replace(".", ",") : s) + " kW";
}
import {
  buildSpecs,
  isOztiBrand,
  kodSoftKey,
  loadPdfByKod,
  loadWebByKod,
  normKod,
  resolveOztiGucKw,
  parseWebElektrikGucuKw,
} from "./lib/ozti-enrich.mjs";
import { SENOX_PDF_CATALOG } from "./lib/senox-pdf-prices.mjs";
import { normSenoxModelKey, senoxModelKeys } from "./lib/senox-model-keys.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT = path.join(ROOT, "scripts/data/catalog-kw-fill-report.json");
const CAFEMARKT_PB = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const YUKSEL_KW_CACHE = path.join(ROOT, "scripts/data/yuksel-kw-cache.json");

const dryRun = process.argv.includes("--dry-run");

function normModelKey(s) {
  return String(s || "")
    .replace(/\s+/g, "")
    .replace(/[._-]/g, "")
    .toUpperCase();
}

function loadPortabiancoKwByTip() {
  const map = new Map();
  if (!fs.existsSync(CAFEMARKT_PB)) return map;
  const list = JSON.parse(fs.readFileSync(CAFEMARKT_PB, "utf8"));
  for (const p of list) {
    const w = String(p.name || "").match(/(\d+(?:[.,]\d+)?)\s*W\b/i);
    if (!w) continue;
    const kw = Math.round((Number(w[1].replace(",", ".")) / 1000) * 1000) / 1000;
    const code = String(p.code || "");
    const tip = code.includes(".") ? code.split(".").pop() : code;
    if (tip) map.set(normModelKey(tip), kw);
    map.set(normModelKey(code), kw);
  }
  return map;
}

function loadSenoxPdfByModel() {
  const map = new Map();
  if (!fs.existsSync(SENOX_PDF_CATALOG)) return map;
  const raw = JSON.parse(fs.readFileSync(SENOX_PDF_CATALOG, "utf8"));
  for (const p of raw.products || []) {
    const desc = [p.description, p.title, JSON.stringify(p.specs || {}), p.specs?.elektrik_gucu]
      .filter(Boolean)
      .join("\n");
    const entry = { ...p, _powerBlob: desc };
    for (const key of [
      normSenoxModelKey(p.model),
      normSenoxModelKey(p.title),
      normModelKey(p.model),
    ]) {
      if (key && !map.has(key)) map.set(key, entry);
    }
  }
  return map;
}

function loadYukselKwCache() {
  if (!fs.existsSync(YUKSEL_KW_CACHE)) return new Map();
  const raw = JSON.parse(fs.readFileSync(YUKSEL_KW_CACHE, "utf8"));
  const map = new Map();
  for (const [url, entry] of Object.entries(raw)) {
    if (entry?.elektrikGucuKw != null || entry?.gazGucuKw != null) {
      map.set(url.split("?")[0], entry);
    }
  }
  return map;
}

function parseWattsFromName(text) {
  const m = String(text || "").match(/(\d+(?:[.,]\d+)?)\s*W\b/i);
  if (!m) return null;
  const w = Number(m[1].replace(",", "."));
  if (!Number.isFinite(w) || w < 50 || w > 200_000) return null;
  return Math.round((w / 1000) * 1000) / 1000;
}

function resolvePortabiancoKw(row, byTip) {
  const fromName = parseWattsFromName(row.name || row.aciklama);
  if (fromName != null) return { elk: fromName, gaz: null, source: "portabianco-name" };

  const keys = [
    row.tip_kodu,
    row.model,
    row.sku,
    row.urun_kodu,
    String(row.sku || "").match(/^TM(\d+)/i)?.[1],
    String(row.sku || "").replace(/^TM/i, "").match(/^(\d+)/)?.[1],
    String(row.sku || "").match(/(\d{3,4})/)?.[1],
  ].filter(Boolean);

  for (const k of keys) {
    const kw = byTip.get(normModelKey(k));
    if (kw != null) return { elk: kw, gaz: null, source: "cafemarkt-tip" };
  }
  return null;
}

function resolveSenoxKw(row, senoxByModel) {
  for (const key of senoxModelKeys(row)) {
    const hit = senoxByModel.get(key);
    if (!hit) continue;
    if (hit.specs?.elektrik_gucu) {
      const parsed = parseKwFromText(String(hit.specs.elektrik_gucu));
      if (parsed.elektrikGucuKw != null || parsed.gazGucuKw != null) {
        return { ...parsed, source: "senox-pdf-spec" };
      }
    }
    const blob = [hit._powerBlob, hit.description, row.specs, ...(row.teknik_ozellikler || [])].join(
      "\n",
    );
    const parsed = parseKwFromText(blob);
    if (parsed.elektrikGucuKw != null || parsed.gazGucuKw != null) {
      return { ...parsed, source: "senox-pdf" };
    }
  }
  return null;
}

function resolveYukselKw(row, yukselCache) {
  const url = String(row.yukselsatis_url || "").split("?")[0];
  if (!url) return null;
  const hit = yukselCache.get(url);
  if (!hit) return null;
  if (hit.elektrikGucuKw != null) {
    return { elk: hit.elektrikGucuKw, gaz: null, source: "yukselsatis-web" };
  }
  if (hit.gazGucuKw != null) {
    return { elk: null, gaz: hit.gazGucuKw, source: "yukselsatis-web" };
  }
  return null;
}

function rowKwSources(row) {
  return {
    sku: row.sku,
    urunAd: row.name,
    el_guc: row.el_guc,
    gaz_guc: row.gaz_guc,
    aciklama: row.aciklama ?? row.specs,
    detay: row.detay,
    description: row.description,
    ozti_web_description: row.ozti_web_description,
    inoksan_shop_description: row.inoksan_shop_description,
    pimak_web_description: row.pimak_web_description,
    teknik_ozellikler: row.teknik_ozellikler,
    olculer: row.olculer,
  };
}

function hasPersistedKw(row) {
  const el = Number(row.el_guc);
  const gaz = Number(row.gaz_guc);
  const olcu = parseKwNumber(row.olculer?.guc_kw);
  return (Number.isFinite(el) && el > 0) || (Number.isFinite(gaz) && gaz > 0) || olcu != null;
}

function parseKwNumber(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n > 0 && n <= 200 ? n : null;
}

function rowFuel(row) {
  const blob = [
    row.name,
    row.category,
    row.specs,
    row.aciklama,
    ...(row.teknik_ozellikler || []),
  ]
    .filter(Boolean)
    .join("\n");
  return fuelContextFromText(blob);
}

function saneKw(kw, row) {
  if (kw == null || !Number.isFinite(kw) || kw <= 0 || kw > 200) return false;
  const hay = [row.name, row.category, row.dept, row.sku].filter(Boolean).join(" ");
  if (/yikama|bula[sş]ik|bardak\s*yikama|^9710\./i.test(hay) && kw > 30) return false;
  if (/cay\s*otomat|çay\s*otomat/i.test(hay) && kw >= 10) return false;
  return true;
}

function syncGucTeknikLine(row, kw, isGas) {
  const display = formatKwDisplay(kw);
  const line = `Güç: ${display}`;
  const tech = [...(row.teknik_ozellikler || [])];
  const idx = tech.findIndex((t) => /^G[uü]ç:\s*/i.test(String(t)));
  if (idx >= 0) tech[idx] = line;
  else tech.unshift(line);
  row.teknik_ozellikler = tech;
  if (isGas) row.gaz_guc = kw;
  else row.el_guc = kw;
  row.olculer = { ...(row.olculer || {}), guc_kw: kw };
}

function applyResolvedKw(row, resolved, source) {
  if (!resolved) return null;
  const fuel = rowFuel(row);
  let elk = resolved.elk ?? resolved.elektrikGucuKw ?? null;
  let gaz = resolved.gaz ?? resolved.gazGucuKw ?? null;
  if (elk == null && gaz == null) return null;
  if (elk != null && !saneKw(elk, row)) return null;
  if (gaz != null && !saneKw(gaz, row)) return null;

  if (fuel === "gaz" && gaz == null && elk != null) {
    gaz = elk;
    elk = null;
  } else if (fuel === "elk" && elk == null && gaz != null) {
    elk = gaz;
    gaz = null;
  }

  if (hasPersistedKw(row)) return null;

  if (gaz != null) syncGucTeknikLine(row, gaz, true);
  else if (elk != null) syncGucTeknikLine(row, elk, false);

  return {
    sku: row.sku,
    name: row.name,
    source,
    elk: row.el_guc ?? null,
    gaz: row.gaz_guc ?? null,
  };
}

function isPimakRow(r) {
  if (!r) return false;
  if (r.pimak_slug || r.pimak_gorsel || r.pimak_web_description) return true;
  if (/^pimak/i.test(String(r.brand || ""))) return true;
  const kaynak = String(r.kaynak || r.kaynak_fiyat_listesi || "").toLowerCase();
  return kaynak.includes("pimak");
}

function tryPimakRow(row) {
  if (!isPimakRow(row)) return null;
  const lines = row.teknik_ozellikler || [];
  let isGas = false;
  for (const ln of lines) {
    if (/^enerji tipi:/i.test(ln) && /gaz|lpg|doğalgaz|dogalgaz/i.test(ln)) isGas = true;
  }
  for (const ln of lines) {
    const kw = parsePimakGucFromTeknikLine(ln);
    if (kw != null) {
      return isGas
        ? { gaz: kw, elk: null, source: "pimak-teknik" }
        : { elk: kw, gaz: null, source: "pimak-teknik" };
    }
  }
  const blob = [row.pimak_web_description, row.specs, ...lines].join("\n");
  const parsed = parseKwFromText(blob);
  if (parsed.elektrikGucuKw != null || parsed.gazGucuKw != null) {
    return { ...parsed, source: "pimak-text" };
  }
  return null;
}

function resolveOztiFill(row, pdfByKod, webByKod) {
  if (!isOztiBrand(row)) return null;
  const kod = normKod(row.sku || row.urun_kodu);
  const pdfEntry = pdfByKod.get(kod) || pdfByKod.get(kodSoftKey(kod));
  const webPayload = webByKod.get(kod) || webByKod.get(kodSoftKey(kod));
  let nextKw = resolveOztiGucKw(row, pdfEntry, webPayload);

  if (!nextKw && webPayload?.specs) {
    nextKw = parseWebElektrikGucuKw(webPayload.specs);
  }

  if (!nextKw && pdfEntry) {
    const fake = {
      urun_kodu: kod,
      urun_tanimi: row.name,
      kategori: row.category,
      barkod: row.barkod,
    };
    const enriched = buildSpecs(fake, pdfEntry, row.category, []);
    nextKw = enriched.olculer?.guc_kw ?? null;
  }
  if (!nextKw) return null;

  const kw = Number(String(nextKw).replace(",", "."));
  if (!saneKw(kw, row)) return null;
  const fuel = rowFuel(row);
  return fuel === "gaz"
    ? { gaz: kw, elk: null, source: webPayload?.specs ? "ozti-web" : "ozti-pdf-web" }
    : { elk: kw, gaz: null, source: webPayload?.specs ? "ozti-web" : "ozti-pdf-web" };
}

function tryGenericRow(row, pdfByKod) {
  let blob = [
    row.name,
    row.specs,
    row.aciklama,
    row.detay,
    row.description,
    row.ozti_web_description,
    row.inoksan_shop_description,
    row.pimak_web_description,
    ...(row.teknik_ozellikler || []),
  ]
    .filter(Boolean)
    .join("\n");

  if (isOztiBrand(row)) {
    const kod = normKod(row.sku);
    const pdf = pdfByKod.get(kod) || pdfByKod.get(kodSoftKey(kod));
    if (pdf) blob += `\n${(pdf.pdf_metin_parcalari || []).join("\n")}`;
  }

  const parsed = parseKwFromText(blob);
  if (parsed.elektrikGucuKw != null || parsed.gazGucuKw != null) {
    return { ...parsed, source: "generic-text" };
  }
  return null;
}

function syncTextResolvedKw(row) {
  const kw = resolveKwFromSources(rowKwSources(row));
  if (kw.elektrikGucuKw == null && kw.gazGucuKw == null) return null;
  return { ...kw, source: "text-resolve" };
}

function shouldTryFill(row) {
  const ctx = {
    isim: row.name,
    urunTipi: row.category,
    sku: row.sku,
    urunAd: row.name,
  };
  if (isPasifPfosEkipman(ctx) || !isPoweredPfosEkipman(ctx)) return false;
  return !hasPersistedKw(row);
}

function main() {
  const pdfByKod = loadPdfByKod();
  const webByKod = loadWebByKod();
  const pbByTip = loadPortabiancoKwByTip();
  const senoxByModel = loadSenoxPdfByModel();
  const yukselCache = loadYukselKwCache();

  const changes = [];
  const bySource = {};

  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
    const p = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(rows)) continue;
    let fileChanges = 0;

    for (const row of rows) {
      if (!shouldTryFill(row)) continue;

      let resolved =
        resolveOztiFill(row, pdfByKod, webByKod) ||
        resolveYukselKw(row, yukselCache) ||
        (/portabianco/i.test(row.brand || "") ? resolvePortabiancoKw(row, pbByTip) : null) ||
        (/şenox|senox/i.test(row.brand || "") ? resolveSenoxKw(row, senoxByModel) : null) ||
        tryPimakRow(row) ||
        tryGenericRow(row, pdfByKod) ||
        syncTextResolvedKw(row);

      const change = applyResolvedKw(row, resolved, resolved?.source);
      if (!change) continue;
      changes.push({ ...change, dept: file.replace(/\.json$/, "") });
      bySource[change.source] = (bySource[change.source] || 0) + 1;
      fileChanges++;
    }

    if (fileChanges && !dryRun) {
      fs.writeFileSync(p, `${JSON.stringify(rows)}\n`, "utf8");
    }
  }

  const report = {
    at: new Date().toISOString(),
    dryRun,
    filled: changes.length,
    bySource,
    changes: changes.sort((a, b) => String(a.sku).localeCompare(String(b.sku))),
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `[fill-catalog-kw] ${dryRun ? "dry-run " : ""}filled=${changes.length}`,
    bySource,
  );
  for (const c of changes.slice(0, 25)) {
    console.log(`  ${c.sku}: ${c.elk ?? "—"} / ${c.gaz ?? "—"} kW (${c.source}, ${c.dept})`);
  }
  if (changes.length > 25) console.log(`  … +${changes.length - 25} more`);

  if (!dryRun && changes.length) {
    const rb = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (rb.status !== 0) process.exit(rb.status || 1);
  }
}

main();
