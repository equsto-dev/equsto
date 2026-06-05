import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(siteDir, ".next/server/app/api");

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "route.js.nft.json") out.push(p);
  }
}

const nfts = [];
walk(apiDir, nfts);
const rows = [];

for (const nft of nfts) {
  const j = JSON.parse(fs.readFileSync(nft, "utf8"));
  const dir = path.dirname(nft);
  let bytes = 0;
  let pub = 0;
  for (const f of j.files || []) {
    if (/public[/\\]/.test(f)) pub++;
    try {
      bytes += fs.statSync(path.join(dir, f)).size;
    } catch {
      /* missing traced file */
    }
  }
  const route = path
    .relative(apiDir, nft)
    .replace(/[/\\]route\.js\.nft\.json$/, "")
    .replace(/\\/g, "/");
  rows.push({ route, files: j.files.length, public: pub, mb: +(bytes / 1048576).toFixed(1) });
}

rows.sort((a, b) => b.mb - a.mb);
console.log("[audit-api-trace]", rows.length, "routes");
for (const r of rows) {
  const flag = r.mb > 50 || r.public > 0 ? " !" : "";
  console.log(`  ${r.mb}MB pub=${r.public} f=${r.files}${flag}  ${r.route}`);
}
const bad = rows.filter((r) => r.mb > 50 || r.public > 0);
if (bad.length) process.exit(1);
