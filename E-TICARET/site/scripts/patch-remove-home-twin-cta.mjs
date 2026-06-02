#!/usr/bin/env node
/** index.ts — eq-cm-twin-wrap (Proje Fabrikası + Mr. Equsto ikili kart) kaldırır. */
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
const twinStart = html.indexOf('<section class="eq-home-band eq-cm-twin-wrap');
if (twinStart < 0) {
  console.log("[patch-remove-home-twin-cta] twin section yok");
  process.exit(0);
}
const twinEnd = html.indexOf("</section>", html.indexOf("eq-twin-contact")) + "</section>".length;
const next = html.slice(0, twinStart) + html.slice(twinEnd);
fs.writeFileSync(target, `export const IndexBodyHtml = ${JSON.stringify(next)};\n`, "utf8");
console.log("[patch-remove-home-twin-cta] OK");
