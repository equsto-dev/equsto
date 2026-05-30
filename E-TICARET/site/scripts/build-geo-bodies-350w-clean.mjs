/**
 * geo-bodies-350w — 300–350 sözcük, 4 paragraf, tekrarsız cümleler.
 * CONTENT (build-geo-bodies-350w.mjs) + EXT birleştirilir; PAD/BOOST kullanılmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, string[]>} */
const { CONTENT } = await import("./build-geo-bodies-350w.mjs?export=CONTENT").catch(() => ({}));

// CONTENT is not exported — read source modules directly
const buildMod = await import("./build-geo-bodies-350w.mjs");
const { EXT } = await import("./geo-bodies-350w-ext.mjs");

// Re-read CONTENT from build file by dynamic import of a data-only export
const buildSrc = fs.readFileSync(path.join(__dirname, "build-geo-bodies-350w.mjs"), "utf8");
const contentMatch = buildSrc.match(/const CONTENT = (\{[\s\S]*?\n\});\n\nconst REQUIRED_KEYS/);
if (!contentMatch) throw new Error("CONTENT block not found");
const CONTENT_DATA = Function(`"use strict"; return (${contentMatch[1]});`)();

const REQUIRED_KEYS = [
  "steakhouse", "cafe", "catering", "fastfood", "finedining", "bulut", "allday",
  "marketKasap", "projelerHub", "projeIstanbul", "projeIzmir", "rehberM2",
  "rehberCatering500", "rehberDarkKitchen", "rehberRestoranChecklist", "rehberKafeAcilis",
  "seoTurkiye", "seoRestoranTeklif", "seoOtel", "seoOzti", "seoSogukOda", "seoHavuzlu",
  "seoPisirme", "seoTeklifPlatform", "seoBar", "seoEnIndustrial", "seoEnQuotation",
  "blogHub", "blogHubEn",
];

function wordCount(text) {
  const t = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function splitSentences(paragraph) {
  return paragraph
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9"']|[A-Za-z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqueSentences(paragraphs) {
  const seen = new Set();
  const out = [];
  for (const p of paragraphs) {
    for (const s of splitSentences(p)) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

function packParagraphs(sentences, targetWords = 325) {
  const paras = [];
  let current = [];
  let w = 0;
  for (const s of sentences) {
    const sw = wordCount(s);
    if (w + sw > 95 && current.length) {
      paras.push(current.join(" "));
      current = [];
      w = 0;
    }
    current.push(s);
    w += sw;
    if (paras.length === 3 && wordCount(current.join(" ")) + sw > 120) {
      paras.push(current.join(" "));
      current = [];
      w = 0;
      break;
    }
  }
  if (current.length) paras.push(current.join(" "));
  while (paras.length < 4 && sentences.length) {
    paras.push(sentences[sentences.length - 1]);
  }
  while (paras.length > 4) paras.pop();
  while (paras.length < 4) paras.push(paras[paras.length - 1] || "");
  let total = wordCount(paras.join(" "));
  if (total < 300) {
    // distribute remaining sentences
    const used = new Set(paras.flatMap(splitSentences).map((s) => s.toLowerCase()));
    for (const s of sentences) {
      if (wordCount(paras.join(" ")) >= 300) break;
      if (used.has(s.toLowerCase())) continue;
      paras[paras.length - 1] += " " + s;
      used.add(s.toLowerCase());
    }
  }
  if (wordCount(paras.join(" ")) > 350) {
    while (paras.length > 4) paras.pop();
    while (wordCount(paras.join(" ")) > 350 && paras[paras.length - 1]) {
      const parts = splitSentences(paras.pop());
      if (parts.length > 1) paras.push(parts.slice(0, -1).join(" "));
    }
  }
  return paras.slice(0, 4);
}

function buildBody(key) {
  const pool = uniqueSentences([...(CONTENT_DATA[key] || []), ...(EXT[key] || [])]);
  if (pool.length < 12) throw new Error(`${key}: yetersiz benzersiz cümle (${pool.length})`);
  const paras = packParagraphs(pool);
  const html = paras.map((p) => `<p>${p}</p>`).join("");
  const w = wordCount(html);
  if (w < 300 || w > 350) throw new Error(`${key}: ${w} sözcük (hedef 300-350)`);
  return html;
}

const bodies = {};
const errors = [];
for (const key of REQUIRED_KEYS) {
  try {
    bodies[key] = buildBody(key);
  } catch (e) {
    errors.push(String(e.message || e));
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

// Cross-profile duplicate sentence check
const globalSeen = new Map();
for (const [key, html] of Object.entries(bodies)) {
  for (const s of splitSentences(html.replace(/<[^>]+>/g, " "))) {
    const k = s.toLowerCase();
    if (globalSeen.has(k) && globalSeen.get(k) !== key) {
      console.warn(`[dup-across] ${key} ↔ ${globalSeen.get(k)}: ${s.slice(0, 60)}…`);
    } else {
      globalSeen.set(k, key);
    }
  }
}

const outPath = path.join(__dirname, "geo-bodies-350w.json");
fs.writeFileSync(outPath, JSON.stringify(bodies, null, 2) + "\n", "utf8");

for (const key of REQUIRED_KEYS) {
  console.log("OK", key, wordCount(bodies[key]));
}
console.log("Wrote", outPath);
