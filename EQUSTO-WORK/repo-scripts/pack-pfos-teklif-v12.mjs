/**
 * PFOS teklif Excel v12 — canlı yama.
 *   node scripts/pack-pfos-teklif-v12.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-pfos-teklif-v12.zip");
const stage = path.join(root, ".deploy-stage-pfos-teklif-v12");

const FILES = [
  "pfos-teklif-excel.js",
  "pfos-teklif-ui.js",
  "data/templates/equsto_teklif_v14.xlsx",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function resolveSrc(rel) {
  const d = path.join(dist, rel);
  if (fs.existsSync(d)) return d;
  const p = path.join(pub, rel);
  if (fs.existsSync(p)) return p;
  return null;
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

for (const rel of FILES) {
  const src = resolveSrc(rel);
  if (!src) {
    console.error("[pack-pfos-teklif-v12] Eksik:", rel);
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[pack-pfos-teklif-v12]", rel);
}

fs.writeFileSync(
  path.join(stage, "CPANEL-PFOS-TEKLIF-V12.txt"),
  `PFOS teklif formatı v12
=====================
1. public_html köküne extract.
2. pfos.html üzerindeki "Excel indir" butonunu test edin.
3. Şablon: data/templates/equsto_teklif_v14.xlsx
`,
  "utf8",
);

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const kb = (fs.statSync(outZip).size / 1024).toFixed(1);
console.log("\n[pack-pfos-teklif-v12] Hazir:", outZip, `(${kb} KB)`);
rmrf(stage);
