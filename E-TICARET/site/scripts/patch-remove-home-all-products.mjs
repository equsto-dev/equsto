#!/usr/bin/env node
/** index.ts — "Tüm Ürünler" ana ürün ızgarası (prod-grid) kaldırır. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib/vitrin/bodies/index.ts");
const raw = fs.readFileSync(target, "utf8");
const prefix = "export const IndexBodyHtml = ";
const start = raw.indexOf(prefix);
const end = raw.lastIndexOf(";\n");
if (start < 0 || end < 0) throw new Error("IndexBodyHtml not found");

const html = JSON.parse(raw.slice(start + prefix.length, end));
const mainStart = html.indexOf('<main class="main eq-mx-o-2');
if (mainStart < 0) {
  console.log("[patch-remove-home-all-products] main block yok");
  process.exit(0);
}
const mainEnd = html.indexOf("</main>", mainStart) + "</main>".length;
const next = html.slice(0, mainStart) + html.slice(mainEnd);
fs.writeFileSync(target, `${prefix}${JSON.stringify(next)};\n`, "utf8");
console.log("[patch-remove-home-all-products] OK");
