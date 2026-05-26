/**
 * Bar Design video CTA + IMT300 urun sayfasi — cPanel public_html.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = path.join(root, ".besos-imt-stage");
const outZip = path.join(root, "equsto-besos-imt300.zip");

const files = [
  { src: "public/bar-design.html", dst: "bar-design.html" },
  { src: "public/imt300.html", dst: "imt300.html" },
  { src: "public/i18n/tr.json", dst: "i18n/tr.json" },
  { src: "public/i18n/en.json", dst: "i18n/en.json" },
  { src: "public/data/imt300-product.json", dst: "data/imt300-product.json" },
];

const imageDir = path.join(root, "public/images/imt300");

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
for (const f of files) {
  const s = path.join(root, f.src);
  if (!fs.existsSync(s)) {
    console.error("[pack-besos-imt] Eksik:", s);
    process.exit(1);
  }
  const d = path.join(stage, f.dst);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(s, d);
}

if (fs.existsSync(imageDir)) {
  const destImg = path.join(stage, "images/imt300");
  fs.mkdirSync(destImg, { recursive: true });
  for (const name of fs.readdirSync(imageDir)) {
    fs.copyFileSync(path.join(imageDir, name), path.join(destImg, name));
  }
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" }
);
rmrf(stage);

console.log(`[pack-besos-imt] ${outZip}`);
console.log("[pack-besos-imt] public_html → ZIP yukle → cikar (alt klasorler korunur).");
