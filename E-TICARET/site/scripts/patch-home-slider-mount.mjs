#!/usr/bin/env node
/** index.ts içinden eq-mx-vitrin slider HTML bloğunu çıkarır, React mount bırakır. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "lib/vitrin/bodies/index.ts");

const raw = fs.readFileSync(target, "utf8");
const prefix = 'export const IndexBodyHtml = "';
const suffix = '";';
const start = raw.indexOf(prefix);
const end = raw.lastIndexOf(suffix);
if (start < 0 || end < 0) throw new Error("IndexBodyHtml export not found");

const html = JSON.parse(`"${raw.slice(start + prefix.length, end)}"`);

const sliderStart = html.indexOf('<section class="eq-mx-vitrin eq-decor-slider-only"');
const sliderEnd = html.indexOf("</section>", sliderStart);
if (sliderStart < 0 || sliderEnd < 0) {
  if (html.includes("eq-home-slider-mount")) {
    console.log("[patch-home-slider-mount] mount zaten var");
    process.exit(0);
  }
  throw new Error("eq-mx-vitrin slider section not found");
}

const mount =
  '<div id="eq-home-slider-mount" class="eq-home-slider-mount" aria-busy="true"></div>';
const next = html.slice(0, sliderStart) + mount + html.slice(sliderEnd + "</section>".length);

const out = `/** Auto-generated — slider: components/home/HomeMainSlider.tsx */\nexport const IndexBodyHtml = ${JSON.stringify(next)};\n`;
fs.writeFileSync(target, out, "utf8");
console.log("[patch-home-slider-mount] OK");
