#!/usr/bin/env node
/**
 * ekipmanlar.json — Pimak Güç (kW/hp) → el_guc/gaz_guc + normalize teknik satırı
 *
 *   node scripts/sync-pimak-kw-catalog.mjs
 *   node scripts/sync-pimak-kw-catalog.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodePimakHtml,
  formatPimakKwDisplay,
  parsePimakGucKwValue,
} from "./lib/pimak-kw.mjs";

function parsePimakGucFromTeknikLine(line) {
  const t = String(line ?? "").trim();
  if (!t) return null;
  const m = t.match(/^g[uü][çc](?:\s*\([^)]*\))?\s*:\s*(.+)$/i);
  if (m) return parsePimakGucKwValue(m[1]);
  return null;
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = path.join(ROOT, "public/data/ekipmanlar.json");

function isPimakRow(r) {
  if (!r) return false;
  if (r.pimak_slug || r.pimak_gorsel || r.pimak_web_description) return true;
  if (/^pimak/i.test(String(r.brand || ""))) return true;
  const kaynak = String(r.kaynak || r.kaynak_fiyat_listesi || "").toLowerCase();
  return kaynak.includes("pimak");
}

function isPimakGucKey(key) {
  return /^g[uü][çc](?:\s*\([^)]*\))?$/i.test(String(key || "").trim());
}

function normalizeTeknikLine(line, isGas) {
  const t = String(line || "").trim();
  if (!t || t.indexOf(":") < 0) return line;
  const key = t.split(":")[0].trim();
  const val = t.split(":").slice(1).join(":").trim();
  if (!isPimakGucKey(key)) return line;
  const kw = parsePimakGucKwValue(val);
  if (kw == null) return line;
  return `Güç: ${formatPimakKwDisplay(kw)}`;
}

function marketingLines(lines) {
  return (lines || [])
    .map((ln) => decodePimakHtml(String(ln || "").trim()))
    .filter((t) => t.length > 3 && !t.includes(":"));
}

const dryRun = process.argv.includes("--dry-run");
const rows = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
let touched = 0;
let elSet = 0;
let gazSet = 0;

for (const row of rows) {
  if (!isPimakRow(row)) continue;
  const lines = Array.isArray(row.teknik_ozellikler) ? [...row.teknik_ozellikler] : [];
  if (!lines.length) continue;

  let el = row.el_guc != null && row.el_guc > 0 ? row.el_guc : null;
  let gaz = row.gaz_guc != null && row.gaz_guc > 0 ? row.gaz_guc : null;
  let isGas = false;
  for (const ln of lines) {
    if (/^enerji tipi:/i.test(ln) && /gaz|lpg|doğalgaz|dogalgaz/i.test(ln)) isGas = true;
  }

  let changed = false;
  const nextLines = lines.map((ln) => {
    const kw = parsePimakGucFromTeknikLine(ln);
    if (kw != null) {
      if (isGas) {
        if (gaz == null) gaz = kw;
      } else if (el == null) {
        el = kw;
      }
      const norm = normalizeTeknikLine(ln, isGas);
      if (norm !== ln) changed = true;
      return norm;
    }
    return ln;
  });

  const mkt = marketingLines(lines);
  if (!row.pimak_web_description && mkt.length) {
    row.pimak_web_description = mkt.join("\n");
    changed = true;
  }

  if (el != null && row.el_guc !== el) {
    row.el_guc = el;
    elSet++;
    changed = true;
  }
  if (gaz != null && row.gaz_guc !== gaz) {
    row.gaz_guc = gaz;
    gazSet++;
    changed = true;
  }
  if (changed) {
    row.teknik_ozellikler = nextLines;
    touched++;
  }
}

console.log(
  `[sync-pimak-kw] touched=${touched} el_guc=${elSet} gaz_guc=${gazSet}${dryRun ? " (dry-run)" : ""}`,
);

if (!dryRun && touched > 0) {
  fs.writeFileSync(EKIPMANLAR, JSON.stringify(rows));
}
