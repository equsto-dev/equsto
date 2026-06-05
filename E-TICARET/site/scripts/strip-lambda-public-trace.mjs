/**
 * Turbopack build: outputFileTracingExcludes uygulanmaz → public/ lambda'ya girer.
 * Tüm .nft.json dosyalarından statik public/ yollarını çıkarır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(siteDir, ".next", "server");

const STRIP_RE =
  /(?:^|[\\/])public[\\/](?:images|data|assets)(?:[\\/]|$)|electrolux-professional|[\\/]ozti[\\/]|[\\/]cafemarkt-images[\\/]/i;

function shouldStrip(rel) {
  return STRIP_RE.test(String(rel).replace(/\\/g, "/"));
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (ent.name.endsWith(".nft.json")) out.push(abs);
  }
}

const nftFiles = [];
walk(serverDir, nftFiles);
if (!nftFiles.length) {
  console.warn("[strip-lambda-public-trace] .nft.json bulunamadi — atlaniyor");
  process.exit(0);
}

let totalRemoved = 0;
for (const nftPath of nftFiles) {
  const raw = fs.readFileSync(nftPath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.files)) continue;
  const before = data.files.length;
  data.files = data.files.filter((f) => !shouldStrip(f));
  const removed = before - data.files.length;
  if (removed > 0) {
    totalRemoved += removed;
    fs.writeFileSync(nftPath, JSON.stringify(data));
    console.log(
      "[strip-lambda-public-trace]",
      path.relative(siteDir, nftPath),
      `-${removed}`,
    );
  }
}

console.log(
  "[strip-lambda-public-trace] OK —",
  nftFiles.length,
  "manifest,",
  totalRemoved,
  "public dosya cikarildi",
);

const cmsNft = path.join(serverDir, "app", "api", "cms", "route.js.nft.json");
if (fs.existsSync(cmsNft)) {
  const left = JSON.parse(fs.readFileSync(cmsNft, "utf8")).files.filter((f) =>
    shouldStrip(f),
  );
  if (left.length) {
    console.error(
      "[strip-lambda-public-trace] HATA: api/cms hâlâ public iceriyor:",
      left.slice(0, 5),
    );
    process.exit(1);
  }
}
