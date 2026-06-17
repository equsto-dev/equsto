#!/usr/bin/env node
/**
 * Pimak PDF s.180–185 (Servis hatları) → ürün listesi JSON
 *
 * Kaynak: PFOS/veri/pimak/_pdf-p180-185.txt (önceden çıkarılmış metin)
 * Çıktı:  PFOS/veri/pimak/p180-185-products.json
 *
 * Amaç: PFOS "servis hattı" kalemlerinde Pimak referanslarını önerebilmek.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "_pdf-p180-185.txt");
const OUT = path.join(ROOT, "p180-185-products.json");

function norm(s) {
  return String(s || "").trim();
}

function isEuroLine(s) {
  return /\d/.test(String(s)) && /€/.test(String(s));
}

function parseEuro(s) {
  const m = String(s).match(/(\d+[.,]?\d*)\s*€/);
  if (!m) return 0;
  return Number(m[1].replace(",", ".")) || 0;
}

function parseKg(s) {
  const m = String(s).match(/(\d+(?:[.,]\d+)?)\s*Kg\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function isDimsLine(s) {
  // 120x70x85 / 135
  return /\b\d{2,3}\s*x\s*\d{2,3}\s*x\s*\d{2,3}\b/i.test(s);
}

function parseDimsMm(s) {
  const m = String(s)
    .replace(/[×X]/g, "x")
    .match(/(\d{2,3})\s*x\s*(\d{2,3})\s*x\s*(\d{2,3})(?:\s*\/\s*(\d{2,3}))?/i);
  if (!m) return null;
  const a = [m[1], m[2], m[3], m[4]].filter(Boolean).map((x) => Number(x));
  if (a.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  // cm → mm
  const mm = a.map((n) => Math.round(n * 10));
  // If " / 135" exists, treat as "yükseklik (cam)" and keep in text.
  const base = `${mm[0]}x${mm[1]}x${mm[2]}`;
  return mm.length > 3 ? `${base}/${mm[3]}` : base;
}

function splitPages(txt) {
  const parts = txt.split(/=== PAGE (\d+) ===/g);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const page = Number(parts[i]);
    const body = parts[i + 1] || "";
    if (Number.isFinite(page)) out.push({ page, body });
  }
  return out;
}

function pageTitle(lines) {
  // After page number line, next meaningful Turkish title line.
  // Skip empty and pure page number.
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const t = norm(lines[i]);
    if (!t) continue;
    if (/^\d+$/.test(t)) continue;
    if (/^(Temel Özellikler|Basic Features)$/i.test(t)) continue;
    // Pick the first uppercase/language line that isn't English subtitle
    if (/[ğüşöçıİ]/i.test(t) || /Servis|Benmari|Teşhir|Ünitesi|Soğuk|Gazlı|Elektrikli/i.test(t)) {
      return t;
    }
  }
  return "";
}

function extractBullets(lines) {
  const out = [];
  for (const l of lines) {
    const t = norm(l);
    if (!t) continue;
    if (!t.startsWith("•")) continue;
    // keep Turkish bullet lines; drop pure English duplicates if present
    if (/works with|body and|cooling system|refrigerant/i.test(t.toLowerCase())) continue;
    out.push(t.replace(/^•\s*/, ""));
  }
  return out;
}

function sliceBetween(lines, startRe, endRe) {
  const a = lines.findIndex((l) => startRe.test(l));
  if (a < 0) return [];
  const b = lines.findIndex((l, idx) => idx > a && endRe.test(l));
  const seg = lines.slice(a + 1, b > 0 ? b : undefined).map(norm).filter(Boolean);
  return seg;
}

function pickListAround(lines, labelRe, itemPred) {
  // Find label, then collect subsequent lines that match itemPred until next label-ish.
  const idx = lines.findIndex((l) => labelRe.test(l));
  if (idx < 0) return [];
  const out = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const t = norm(lines[i]);
    if (!t) continue;
    if (/^(Ürün Kodu|Product Code|Fiyat|Price|Ağırlık|Weight|Ebat|Dims\.|Teknik|Technical|Enerji|Energy|Gerilim|Voltage|Gaz|Gas)\b/i.test(t)) {
      // stop when we hit another section header (but allow immediate duplicates)
      if (out.length) break;
      continue;
    }
    if (itemPred(t)) out.push(t);
    else if (out.length) break;
  }
  return out;
}

function parseServicePage(page, body) {
  const lines = body.split(/\r?\n/);
  const title = pageTitle(lines) || `Pimak Servis Hatları s.${page}`;
  const bullets = extractBullets(lines);

  let prices = pickListAround(lines, /^Fiyat\b/i, (t) => isEuroLine(t)).map(parseEuro);
  const weights = pickListAround(lines, /^Ağırlık\b/i, (t) => /\bKg\b/i.test(t)).map(parseKg);
  const dims = pickListAround(lines, /^Ebat\b/i, (t) => isDimsLine(t)).map(parseDimsMm);

  // PDF layout varies: sometimes "Ürün Kodu" block is not aligned.
  // Extract code-like tokens from whole page, then pick last N by expected variant count.
  const scanEuros = lines.map(norm).filter(isEuroLine).map(parseEuro).filter((n) => n > 0);
  if (!prices.length && scanEuros.length) prices = scanEuros;

  const wantN = Math.max(prices.length, weights.length, dims.length, 0);
  const rawCodes = [];
  const seen = new Set();
  for (const l of lines) {
    const t = norm(l);
    if (!t) continue;
    if (t.includes(" / ") || /\bvolt|hz|mbar|gn\b|hp\b|kcal|kw\b/i.test(t)) continue;
    if (!/[0-9]/.test(t)) continue;
    if (!/^[A-Z0-9][A-Z0-9/.\-]{3,}$/.test(t)) continue;
    const key = t.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rawCodes.push(t);
  }
  const codes =
    wantN > 0 && rawCodes.length > wantN
      ? rawCodes.slice(rawCodes.length - wantN)
      : rawCodes;

  if (wantN > 0 && prices.length > wantN) {
    prices = prices.slice(prices.length - wantN);
  }

  const n = Math.max(codes.length, prices.length, weights.length, dims.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const code = norm(codes[i]);
    const liste = Number(prices[i] || 0);
    if (!code) continue;
    out.push({
      pdf_page: page,
      category: "servis-hatti",
      aile: "Servis Hatları",
      baslik: `${title} — ${code}`,
      urun_kodu: `PIMAK.${code.replace(/\s+/g, "")}`,
      liste_fiyati_eur: liste > 0 ? liste : null,
      agirlik_kg: weights[i] ?? null,
      ebat_mm: dims[i] ?? null,
      temel_ozellikler: bullets,
    });
  }
  return out;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Kaynak yok:", SRC);
    process.exit(1);
  }
  const txt = fs.readFileSync(SRC, "utf8");
  const pages = splitPages(txt).filter((p) => p.page >= 180 && p.page <= 185);
  const products = pages.flatMap((p) => parseServicePage(p.page, p.body));
  fs.writeFileSync(OUT, JSON.stringify(products, null, 2) + "\n", "utf8");
  console.log("OK", path.basename(OUT), "items:", products.length);
}

main();

