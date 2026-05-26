/** Katalog JSON + kucuk data dosyalari (~120MB) -> equsto-data-veri.zip */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "dist", "data");
const outZip = path.join(root, "equsto-data-veri.zip");
const stage = path.join(root, ".stage-data-veri");

const SKIP = new Set(["images", "oztiryakiler-images"]);

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyTree(from, to, sub = "") {
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    if (sub === "" && SKIP.has(ent.name)) continue;
    const sp = path.join(from, ent.name);
    const dp = path.join(to, sub, ent.name);
    if (ent.isDirectory()) {
      fs.mkdirSync(dp, { recursive: true });
      copyTree(sp, to, path.join(sub, ent.name));
    } else {
      fs.mkdirSync(path.dirname(dp), { recursive: true });
      fs.copyFileSync(sp, dp);
    }
  }
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
fs.mkdirSync(path.join(stage, "data"), { recursive: true });
copyTree(src, path.join(stage, "data"), "");
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\data' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
rmrf(stage);
const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(1);
console.log("\n[pack] " + outZip + " (" + mb + " MB)");
console.log("[pack] cPanel: public_html -> yukle -> extract -> public_html/data/ olmali");
