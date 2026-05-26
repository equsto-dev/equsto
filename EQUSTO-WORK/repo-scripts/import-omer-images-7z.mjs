/**
 * Equsto-ömer görsel arşivleri → public/data/images/
 *
 *   Equsto-ömer/Öztiryakiler/oztiryakiler.7z
 *   Equsto-ömer/Kariyer Mutfak/kariyer_mutfak.7z
 *
 * Kullanım (proje kökü):
 *   node scripts/import-omer-images-7z.mjs
 *   node scripts/import-omer-images-7z.mjs --skip-extract   (zaten açıldıysa)
 *   npm run data:images:omer
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SEVEN_ZIP = [
  "C:\\Program Files\\7-Zip\\7z.exe",
  "C:\\Program Files (x86)\\7-Zip\\7z.exe",
].find((p) => fs.existsSync(p));

const ARCHIVES = [
  {
    id: "ozti",
    label: "Öztiryakiler",
    archive: path.join(ROOT, "Equsto-ömer", "Öztiryakiler", "oztiryakiler.7z"),
    extractDir: path.join(ROOT, ".tmp-omer-images", "oztiryakiler"),
  },
  {
    id: "kariyer",
    label: "Kariyer Mutfak",
    archive: path.join(ROOT, "Equsto-ömer", "Kariyer Mutfak", "kariyer_mutfak.7z"),
    extractDir: path.join(ROOT, ".tmp-omer-images", "kariyer"),
  },
];

const OUT_IMAGES = path.join(ROOT, "public", "data", "images");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const REPORT = path.join(ROOT, "public", "data", "omer-image-import-report.json");

const SKIP_EXTRACT = process.argv.includes("--skip-extract");
const DRY_RUN = process.argv.includes("--dry-run");

function basename(rel) {
  return String(rel || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop();
}

function extract7z(archivePath, outDir) {
  if (!SEVEN_ZIP) {
    console.error("[import-omer] 7-Zip bulunamadı (7z.exe).");
    process.exit(1);
  }
  if (!fs.existsSync(archivePath)) {
    console.error("[import-omer] Arşiv yok:", archivePath);
    process.exit(1);
  }
  const marker = path.join(outDir, ".extract-done");
  if (fs.existsSync(marker)) {
    console.log("[import-omer] Zaten açılmış, atlanıyor:", outDir);
    return;
  }
  fs.mkdirSync(outDir, { recursive: true });
  console.log("[import-omer] 7z açılıyor:", archivePath);
  console.log("           →", outDir);
  execSync(`"${SEVEN_ZIP}" x "${archivePath}" -o"${outDir}" -y`, { stdio: "inherit" });
  fs.writeFileSync(marker, new Date().toISOString(), "utf8");
}

function findImagesFolder(extractDir) {
  const direct = path.join(extractDir, "images");
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
  for (const name of fs.readdirSync(extractDir)) {
    const p = path.join(extractDir, name, "images");
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  return null;
}

function copyFromExtracted(srcDir, report, label) {
  const files = fs.readdirSync(srcDir);
  let copied = 0;
  let skipped = 0;
  for (const name of files) {
    const src = path.join(srcDir, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(OUT_IMAGES, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      skipped++;
      continue;
    }
    if (!DRY_RUN) {
      fs.copyFileSync(src, dest);
    }
    copied++;
  }
  report.sources.push({ label, srcDir, files: files.length, copied, skippedExisting: skipped });
  report.totals.copied += copied;
  report.totals.skippedExisting += skipped;
}

function catalogImageStats() {
  const cat = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const needed = new Set();
  for (const p of cat) {
    for (const im of p.images || []) {
      const b = basename(im);
      if (b) needed.add(b);
    }
  }
  let hit = 0;
  for (const b of needed) {
    const p = path.join(OUT_IMAGES, b);
    if (fs.existsSync(p) && fs.statSync(p).size > 0) hit++;
  }
  return { products: cat.length, uniqueImages: needed.size, onDisk: hit, missing: needed.size - hit };
}

function main() {
  if (!SKIP_EXTRACT) {
    for (const a of ARCHIVES) extract7z(a.archive, a.extractDir);
  }

  fs.mkdirSync(OUT_IMAGES, { recursive: true });

  const report = {
    at: new Date().toISOString(),
    dryRun: DRY_RUN,
    outDir: OUT_IMAGES,
    sources: [],
    totals: { copied: 0, skippedExisting: 0 },
    catalogBefore: catalogImageStats(),
  };

  for (const a of ARCHIVES) {
    const imgDir = findImagesFolder(a.extractDir);
    if (!imgDir) {
      console.error("[import-omer] images/ klasörü bulunamadı:", a.extractDir);
      process.exit(1);
    }
    console.log("[import-omer] Kopyalanıyor:", a.label, "←", imgDir);
    copyFromExtracted(imgDir, report, a.label);
  }

  report.catalogAfter = catalogImageStats();
  if (!DRY_RUN) {
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n", "utf8");
  }

  console.log("\n[import-omer] Özet");
  console.log("  Yeni kopyalanan dosya:", report.totals.copied);
  console.log("  Zaten vardı (atlandı):", report.totals.skippedExisting);
  console.log(
    "  Katalog görselleri:",
    report.catalogAfter.onDisk + "/" + report.catalogAfter.uniqueImages,
    "eksik:",
    report.catalogAfter.missing,
  );
  if (!DRY_RUN) console.log("  Rapor:", REPORT);
}

main();
