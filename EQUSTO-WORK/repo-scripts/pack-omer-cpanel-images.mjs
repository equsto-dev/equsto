/**
 * .tmp-omer-images → cPanel yükleme ZIP’leri (marka bazlı)
 *
 * Kaynak:
 *   .tmp-omer-images/oztiryakiler/images   (~1.7k dosya)
 *   .tmp-omer-images/kariyer/images         (~13.7k dosya)
 *
 * Hedef ZIP (proje kökü):
 *   equsto-ozti-fotolari-cpanel.zip
 *   equsto-kariyer-fotolari-cpanel.zip
 *
 * cPanel: ZIP’i public_html/data/ içine yükle → Extract
 *         → public_html/data/images/*.jpg
 *
 * Kullanım:
 *   node scripts/pack-omer-cpanel-images.mjs kariyer
 *   node scripts/pack-omer-cpanel-images.mjs ozti
 *   node scripts/pack-omer-cpanel-images.mjs all
 *   npm run deploy:cpanel:kariyer
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP_OMER = path.join(ROOT, ".tmp-omer-images");

const SEVEN_ZIP = [
  "C:\\Program Files\\7-Zip\\7z.exe",
  "C:\\Program Files (x86)\\7-Zip\\7z.exe",
].find((p) => fs.existsSync(p));

const BRANDS = {
  ozti: {
    label: "Öztiryakiler",
    imagesDir: path.join(TMP_OMER, "oztiryakiler", "images"),
    outZip: path.join(ROOT, "equsto-ozti-fotolari-cpanel.zip"),
    extractHint: "Equsto-ömer/Öztiryakiler/oztiryakiler.7z",
  },
  kariyer: {
    label: "Kariyer Mutfak",
    imagesDir: path.join(TMP_OMER, "kariyer", "images"),
    outZip: path.join(ROOT, "equsto-kariyer-fotolari-cpanel.zip"),
    extractHint: "Equsto-ömer/Kariyer Mutfak/kariyer_mutfak.7z",
  },
};

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((n) => {
    try {
      return fs.statSync(path.join(dir, n)).isFile();
    } catch (_) {
      return false;
    }
  }).length;
}

function packWith7z(imagesDir, outZip) {
  if (fs.existsSync(outZip)) {
    try {
      fs.unlinkSync(outZip);
    } catch (e) {
      const alt = outZip.replace(/\.zip$/i, "-yeni.zip");
      console.warn("[cpanel-pack] Kilitli, alternatif:", alt);
      return packWith7z(imagesDir, alt);
    }
  }
  const parent = path.dirname(imagesDir);
  const folder = path.basename(imagesDir);
  console.log("[cpanel-pack] 7z:", outZip);
  execSync(`"${SEVEN_ZIP}" a -tzip -mx=1 "${outZip}" "${folder}/*"`, {
    cwd: parent,
    stdio: "inherit",
  });
  return outZip;
}

function packWithPowerShell(imagesDir, outZip) {
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  const ps = `Compress-Archive -LiteralPath '${imagesDir.replace(/'/g, "''")}' -DestinationPath '${outZip.replace(/'/g, "''")}' -CompressionLevel Fastest -Force`;
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
  return outZip;
}

function packBrand(id) {
  const b = BRANDS[id];
  if (!b) {
    console.error("[cpanel-pack] Bilinmeyen marka:", id, "→ ozti | kariyer | all");
    process.exit(1);
  }
  if (!fs.existsSync(b.imagesDir)) {
    console.error("[cpanel-pack] images/ yok:", b.imagesDir);
    console.error("  Önce: npm run data:images:omer  (7z açılıp .tmp-omer-images dolar)");
    process.exit(1);
  }
  const n = countFiles(b.imagesDir);
  if (!n) {
    console.error("[cpanel-pack] Klasör boş:", b.imagesDir);
    process.exit(1);
  }
  console.log("\n[cpanel-pack]", b.label);
  console.log("  Kaynak:", b.imagesDir);
  console.log("  Dosya:", n);

  const out =
    SEVEN_ZIP != null ? packWith7z(b.imagesDir, b.outZip) : packWithPowerShell(b.imagesDir, b.outZip);

  const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(0);
  console.log("  ZIP:", out, "(" + mb + " MB)");
  console.log("  cPanel: ZIP → public_html/data/ → Extract → data/images/ dolmalı\n");
  return { id, label: b.label, files: n, zip: out, mb };
}

function writeReadme(results) {
  const p = path.join(TMP_OMER, "CPANEL-YUKLEME.txt");
  const listed = [];
  for (const id of Object.keys(BRANDS)) {
    const b = BRANDS[id];
    const hit = results.find((r) => r.id === id);
    if (hit) {
      listed.push(hit);
      continue;
    }
    if (fs.existsSync(b.outZip)) {
      listed.push({
        id,
        label: b.label,
        files: countFiles(b.imagesDir),
        zip: b.outZip,
        mb: (fs.statSync(b.outZip).size / (1024 * 1024)).toFixed(0),
      });
    }
  }
  const lines = [
    "Equsto — Ömer görsel arşivi → cPanel",
    "=====================================",
    "",
    "Kaynak klasörler (yerel):",
    "  .tmp-omer-images/oztiryakiler/images/",
    "  .tmp-omer-images/kariyer/images/",
    "",
    "cPanel adımları (her ZIP için):",
    "  1) Dosya Yöneticisi → public_html/data/",
    "  2) ZIP yükle",
    "  3) Extract (içinde 'images' klasörü çıkar)",
    "  4) Sonuç: public_html/data/images/dosya.jpg",
    "",
    "Yanlış: public_html/data/images/images/...  (çift images)",
    "",
    "Hazır ZIP'ler (proje kökü):",
  ];
  for (const r of listed) {
    lines.push(`  ${path.basename(r.zip)}  — ${r.label}, ${r.files} dosya, ~${r.mb} MB`);
  }
  lines.push("", "Yenilemek için: npm run deploy:cpanel:omer-images", "");
  fs.writeFileSync(p, lines.join("\n"), "utf8");
  console.log("[cpanel-pack] Talimat:", p);
}

const arg = (process.argv[2] || "all").toLowerCase();
const ids = arg === "all" ? ["ozti", "kariyer"] : [arg];
const results = [];
for (const id of ids) {
  results.push(packBrand(id));
}
writeReadme(results);
