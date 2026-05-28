/**
 * PFOS gorseller/{slug}/*.pdf → public/data/caglayan-market/{slug}/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../../PFOS/veri/proje-veri/caglayan-refrigeration/gorseller");
const DEST = path.join(ROOT, "public/data/caglayan-market");

if (!fs.existsSync(SRC)) {
  console.error("Kaynak yok:", SRC);
  process.exit(1);
}

let files = 0;
for (const slug of fs.readdirSync(SRC)) {
  const srcDir = path.join(SRC, slug);
  if (!fs.statSync(srcDir).isDirectory()) continue;
  for (const f of fs.readdirSync(srcDir)) {
    if (!/\.pdf$/i.test(f) || /pdf-icon/i.test(f)) continue;
    const destDir = path.join(DEST, slug);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
    files++;
  }
}
console.log("[sync-caglayan-pdfs] kopyalanan PDF:", files, "→", DEST);
