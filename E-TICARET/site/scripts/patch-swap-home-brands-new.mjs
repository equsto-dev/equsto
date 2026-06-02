#!/usr/bin/env node
/** Popüler markalar ↔ Yeni eklenen ekipmanlar sırasını değiştirir (yeni üstte). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib/vitrin/bodies/index.ts");
const raw = fs.readFileSync(target, "utf8");
const prefix = 'export const IndexBodyHtml = "';
const start = raw.indexOf(prefix);
const end = raw.lastIndexOf('";');
if (start < 0 || end < 0) throw new Error("IndexBodyHtml not found");

const html = JSON.parse(`"${raw.slice(start + prefix.length, end)}"`);

function extractSection(marker) {
  const i = html.indexOf(marker);
  if (i < 0) throw new Error(`section not found: ${marker}`);
  const secStart = html.lastIndexOf("<section", i);
  const secEnd = html.indexOf("</section>", i) + "</section>".length;
  return { start: secStart, end: secEnd, block: html.slice(secStart, secEnd) };
}

const brands = extractSection("eq-mx-o-4b");
const newer = extractSection("eq-mx-o-6");

if (newer.start < brands.start) {
  console.log("[patch-swap-home-brands-new] zaten yeni üstte");
  process.exit(0);
}

const before = html.slice(0, brands.start);
const between = html.slice(brands.end, newer.start);
const after = html.slice(newer.end);
const next = before + newer.block + between + brands.block + after;

fs.writeFileSync(target, `export const IndexBodyHtml = ${JSON.stringify(next)};\n`, "utf8");
console.log("[patch-swap-home-brands-new] OK — yeni eklenen üstte, markalar altta");
