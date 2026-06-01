/**
 * Build public/data/i18n/products-en-by-id.json from catalog (rule-based EN).
 * Run: npm run i18n:products
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  translateProductFields,
} from "./lib/product-i18n-en.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(siteDir, "public/data/i18n/products-en-by-id.json");
const ekipmanlarPath = path.join(siteDir, "public/data/ekipmanlar.json");
const deptDir = path.join(siteDir, "public/data/dept");
const specTermsPath = path.join(siteDir, "public/data/i18n/spec-terms-en.json");

/** @type {[string, string][]} */
let specTerms = [];
if (fs.existsSync(specTermsPath)) {
  const j = JSON.parse(fs.readFileSync(specTermsPath, "utf8"));
  specTerms = (j.terms || []).slice().sort((a, b) => b[0].length - a[0].length);
}

/** @type {Map<string, object>} */
const byId = new Map();

function ingestList(list, source) {
  if (!Array.isArray(list)) return;
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const id = String(row.id || "").trim();
    if (!id) continue;
    const tr = {
      name: row.name || "",
      specs: row.specs || "",
      aciklama: row.aciklama || row.description || "",
    };
    let en = translateProductFields(tr);
    if (specTerms.length && en.specs_en) {
      let s = en.specs_en;
      for (const [from, to] of specTerms) {
        if (from && s.indexOf(from) !== -1) s = s.split(from).join(to);
      }
      en = { ...en, specs_en: s };
    }
    const entry = {};
    if (en.name_en && en.name_en !== tr.name) entry.n = en.name_en;
    else if (en.name_en) entry.n = en.name_en;
    if (en.specs_en) entry.s = en.specs_en;
    if (en.description_en) entry.d = en.description_en;
    if (!entry.n && !entry.s && !entry.d) continue;
    entry._src = source;
    byId.set(id, entry);
  }
}

if (fs.existsSync(ekipmanlarPath)) {
  console.log("Reading", ekipmanlarPath);
  ingestList(JSON.parse(fs.readFileSync(ekipmanlarPath, "utf8")), "ekipmanlar");
}

if (fs.existsSync(deptDir)) {
  for (const f of fs.readdirSync(deptDir)) {
    if (!f.endsWith(".json")) continue;
    const p = path.join(deptDir, f);
    ingestList(JSON.parse(fs.readFileSync(p, "utf8")), "dept:" + f);
  }
}

const compact = Object.create(null);
for (const [id, v] of byId) {
  const { n, s, d } = v;
  compact[id] = d ? { n, s, d } : s ? { n, s } : { n };
}

const payload = {
  v: 1,
  generated: new Date().toISOString().slice(0, 10),
  count: Object.keys(compact).length,
  byId: compact,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload));

const mb = (Buffer.byteLength(JSON.stringify(payload)) / 1024 / 1024).toFixed(2);
console.log("Wrote", outPath, "—", payload.count, "products,", mb, "MB");

const sampleId = Object.keys(compact).find((k) => /hha60/i.test(k) || /8823/i.test(k));
if (sampleId) {
  console.log("Sample", sampleId, ":", JSON.stringify(compact[sampleId], null, 0).slice(0, 400));
}
