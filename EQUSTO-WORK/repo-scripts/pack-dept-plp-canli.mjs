/**
 * Departman PLP hızlı yama ZIP — tam site yerine sadece grid/facet dosyaları.
 * cPanel public_html → Extract (üzerine yaz).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-dept-plp-yama.zip");
const stage = path.join(root, ".deploy-stage-dept-plp");

const FILES = [
  "eq-dept-plp.css",
  "eq-dept-plp.js",
  "eq-dept-cm-facets.js",
  "eq-dept-tips.js",
  "eq-dept-plp-config.js",
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
  "tezgah.html",
  "dolap.html",
  "davlumbaz.html",
  "tasima.html",
  "araba.html",
  "istif.html",
  "data/dept/pisirme.json",
  "data/dept/sogutma.json",
  "data/dept/kahve.json",
  "data/dept/yikama.json",
  "data/dept/hazirlik.json",
  "data/dept/icecek.json",
  "data/dept/tezgah.json",
  "data/dept/dolap.json",
  "data/dept/davlumbaz.json",
  "data/dept/tasima.json",
  "data/dept/araba.json",
  "data/dept/istif.json",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

if (!fs.existsSync(dist)) {
  console.error("[dept-plp-yama] dist/ yok. Once: npm run build");
  process.exit(1);
}

const missing = FILES.filter((f) => !fs.existsSync(path.join(dist, f)));
if (missing.length) {
  console.error("[dept-plp-yama] Eksik:", missing.join(", "));
  process.exit(1);
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
for (const f of FILES) {
  const src = path.join(dist, f);
  const dst = path.join(stage, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(`tar -a -cf "${outZip.replace(/\\/g, "/")}" -C "${stage.replace(/\\/g, "/")}" .`, {
  stdio: "inherit",
});
rmrf(stage);

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[dept-plp-yama] Hazir:", outZip);
console.log("[dept-plp-yama] Boyut:", mb, "MB — cPanel public_html Extract");
console.log("[dept-plp-yama] Sonra Cloudflare Purge + Ctrl+Shift+R");
