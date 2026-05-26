import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const D = "\u0064iv";
const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-dept-hero-strip.js");
let s = fs.readFileSync(p, "utf8");
const start = s.indexOf(`'<${D} class="hero-banner hero-banner--slim">'`);
if (start < 0) {
  console.log("[patch-dept] banner block not found");
  process.exit(1);
}
const actualEnd = s.indexOf(`'</${D}>' +`, start) + `'</${D}>' +`.length;
const neu =
  `      '<${D} class="hero-banner hero-banner--slim eq-world-first-banner">' +\n` +
  `        '<p class="hero-platform-line" data-i18n="home.banner_platform">Equsto Endüstriyel Mutfak &amp; Gastronomi Platformu</p>' +\n` +
  `        '<h1 class="hero-h1 eq-wf-headline" data-i18n="home.banner_world_first">DÜNYADA BİR İLK!</h1>' +\n` +
  `      '</${D}>' +`;
s = s.slice(0, start) + neu + s.slice(actualEnd);
fs.writeFileSync(p, s);
console.log("[patch-dept] eq-dept-hero-strip.js updated");
