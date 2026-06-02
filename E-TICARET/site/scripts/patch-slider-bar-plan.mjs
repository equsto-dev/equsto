import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "lib/vitrin/bodies/index.ts");
const raw = fs.readFileSync(indexPath, "utf8");
const m = raw.match(/export const IndexBodyHtml = "([\s\S]*)";;;/);
if (!m) throw new Error("IndexBodyHtml not found");

const html = JSON.parse(`"${m[1]}"`);
const img = "/images/pfos/proje-fabrikasi-bar-plan.png?v=20260602bar-plan-contain";

const next = html
  .replace(
    /<img class="eq-mx-hero__slide-bg" src="\/images\/pfos\/proje-fabrikasi-eskiz\.jpg\?v=20260602eskiz-jpg"/,
    `<img class="eq-mx-hero__slide-bg" src="${img}"`
  )
  .replace(
    /<button type="button" class="eq-mx-hero__thumb is-active" aria-label="Proje Fabrikası"><img src="\/images\/pfos\/proje-fabrikasi-eskiz\.jpg\?v=20260602eskiz-jpg"/,
    `<button type="button" class="eq-mx-hero__thumb is-active" aria-label="Proje Fabrikası"><img src="${img}"`
  );

if (next === html) throw new Error("slider image paths not updated");

fs.writeFileSync(
  indexPath,
  `/** Auto-generated from public/index.html — do not edit by hand */\nexport const IndexBodyHtml = ${JSON.stringify(next)};\n`,
  "utf8"
);
console.log("updated slider pfos image");
