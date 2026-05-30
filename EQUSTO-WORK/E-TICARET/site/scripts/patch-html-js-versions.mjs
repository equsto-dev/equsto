#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const V = process.argv[2] || "20260529plpimgfix2";
const dir = path.join(ROOT, "public");
let n = 0;

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".html")) continue;
  const fp = path.join(dir, f);
  const orig = fs.readFileSync(fp, "utf8");
  const next = orig
    .replace(/\/eq-site-urls\.js\?v=[^"']+/g, `/eq-site-urls.js?v=${V}`)
    .replace(/\/eq-dept-plp\.js\?v=[^"']+/g, `/eq-dept-plp.js?v=${V}`);
  if (next !== orig) {
    fs.writeFileSync(fp, next, "utf8");
    console.log("updated", f);
    n++;
  }
}
console.log("total", n);
