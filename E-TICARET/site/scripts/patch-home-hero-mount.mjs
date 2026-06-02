#!/usr/bin/env node
/** index.ts içinden hero HTML bloğunu çıkarır, React mount noktası bırakır. */
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

const heroStart = html.indexOf('<section class="hero eq-home-hero-ads"');
const heroEnd = html.indexOf("</section>", heroStart);
if (heroStart < 0 || heroEnd < 0) throw new Error("hero eq-home-hero-ads section not found");

const mount =
  '<div id="eq-home-hero-mount" class="eq-home-hero-mount" aria-busy="true"></div>';
const next = html.slice(0, heroStart) + mount + html.slice(heroEnd + "</section>".length);

const out = `/** Auto-generated from public/index.html — hero kartları: components/home/HomeHeroAds.tsx */\nexport const IndexBodyHtml = ${JSON.stringify(next)};\n`;
fs.writeFileSync(target, out, "utf8");
console.log("[patch-home-hero-mount] OK");
