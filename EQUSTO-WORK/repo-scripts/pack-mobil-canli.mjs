/**
 * Mobil vitrin düzeltmesi — hızlı canlı yama (theme.css + index.html).
 * cPanel: public_html köküne extract.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outZip = path.join(root, "equsto-mobil-canli.zip");
const stage = path.join(root, ".deploy-stage-mobil");

const files = [
  { src: path.join(root, "dist", "theme.css"), rel: "theme.css" },
  { src: path.join(root, "dist", "nav.js"), rel: "nav.js" },
  { src: path.join(root, "dist", "index.html"), rel: "index.html" },
  { src: path.join(root, "dist", "bar-design.html"), rel: "bar-design.html" },
  { src: path.join(root, "dist", "bar-module.html"), rel: "bar-module.html" },
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

for (const f of files) {
  if (!fs.existsSync(f.src)) {
    console.error("[pack] Eksik:", f.src, "— önce npm run build");
    process.exit(1);
  }
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
for (const f of files) {
  const dst = path.join(stage, f.rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(f.src, dst);
  console.log("[pack]", f.rel);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack] Hazir:", outZip, `(${mb} MB)`);
console.log("[pack] cPanel public_html: theme.css + index.html üzerine yaz");
rmrf(stage);
