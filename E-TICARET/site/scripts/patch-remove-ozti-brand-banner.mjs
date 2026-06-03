#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib/vitrin/bodies/index.ts");
const raw = fs.readFileSync(target, "utf8");
const prefix = "export const IndexBodyHtml = ";
const start = raw.indexOf(prefix);
const html = JSON.parse(raw.slice(start + prefix.length, raw.lastIndexOf(";")));

const marker = '<section class="eq-home-band eq-mx-o-4"';
const i = html.indexOf(marker);
if (i < 0) {
  console.error("section not found");
  process.exit(1);
}
const j = html.indexOf("</section>", html.indexOf("eq-brand-banner--vitrin", i));
if (j < 0) {
  console.error("closing tag not found");
  process.exit(1);
}
const next = html.slice(0, i) + html.slice(j + "</section>".length).replace(/^\s*\r?\n/, "");
fs.writeFileSync(target, `${prefix}${JSON.stringify(next)};\n`, "utf8");
console.log("[patch-remove-ozti-brand-banner] OK");
