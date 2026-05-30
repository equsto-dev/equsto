#!/usr/bin/env node
/** urun-sayfalari/*.json → products-tr.json */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../veri/prosogutma");
const pages = path.join(ROOT, "urun-sayfalari");
const out = path.join(ROOT, "products-tr.json");

const products = fs
  .readdirSync(pages)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(pages, f), "utf8")))
  .filter((p) => p.slug && !p.error);

products.sort((a, b) => String(a.title || a.slug).localeCompare(String(b.title || b.slug), "tr"));
fs.writeFileSync(out, JSON.stringify(products, null, 2), "utf8");
console.log("→", out, "|", products.length);
