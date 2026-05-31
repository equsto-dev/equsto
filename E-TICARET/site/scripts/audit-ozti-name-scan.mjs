/** Name-scan vs stored oem_brand */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripOztiNameLead } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PREFIXES = [
  "Electrolux Professional", "ROBOT COUPE", "Rational", "Winterhalter", "Hobart", "Hoshizaki",
  "Unox", "WMF", "Nuova Simonelli", "NUOSI", "Bravilor Bonamat", "BRAVILOR", "Ateşe", "ATS",
  "FAC", "SANTOS", "Electrolux", "İnoksan", "Zanussi", "SIMAG", "Vitrifrigo", "Berkel", "Dualit",
  "MenuMaster", "Imperia", "Hamilton Beach", "Swedlinghaus", "Vesta", "Bartscher", "Copmak",
  "Blanco", "Alkan", "Tribeca", "Fantom", "PlateMate", "Meiko", "Miele", "Colged", "Smeg",
  "Fimar", "Dito Sama", "Sammic", "Angelo Po", "Empero", "Gtech", "Samixir",
];

function fold(s) {
  return String(s || "").toLocaleLowerCase("tr");
}

function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findOem(name) {
  const scan = stripOztiNameLead(name);
  const nu = scan.toLocaleUpperCase("tr");
  if (/\bRATIONAL\b/.test(nu)) return "Rational";
  for (const p of PREFIXES) {
    const pl = fold(p);
    if (fold(scan).startsWith(pl)) return p;
    if (pl.length >= 4 && new RegExp(`(^|\\s)${escRe(p)}(\\s|$|[./,-])`, "i").test(scan)) return p;
  }
  return "";
}

const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/ekipmanlar.json"), "utf8"));
const oz = rows.filter((r) => /öztiryakiler|oztiryakiler/i.test(r.brand || ""));
const extra = {};
const samples = {};
for (const r of oz) {
  if (r.oem_brand && r.oem_brand !== "Öztiryakiler") continue;
  const f = findOem(r.name);
  if (f) {
    extra[f] = (extra[f] || 0) + 1;
    if (!samples[f]) samples[f] = r.name?.slice(0, 70);
  }
}
console.log("Name-scan extra OEM (stored=Oztiryakiler):");
Object.entries(extra)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(v, k, "|", samples[k]));
console.log("total extra rows:", Object.values(extra).reduce((a, b) => a + b, 0));
