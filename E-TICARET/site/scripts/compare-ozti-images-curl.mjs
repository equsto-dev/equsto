/**
 * ax-images karşılaştırma (curl — Node fetch SSL sorunları için)
 *   node scripts/compare-ozti-images-curl.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const MIN_BYTES = 8000;
const TILE_PROBE_MAX = 120;

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function curlHead(kod) {
  const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
  const r = spawnSync("curl.exe", ["-sI", "-k", "--max-time", "12", url], {
    encoding: "utf8",
  });
  const m = /HTTP\/\S+\s+(\d+)/.exec(r.stdout || "");
  const code = parseInt(m ? m[1] : 0, 10);
  const cl = /content-length:\s*(\d+)/i.exec(r.stdout || "");
  return { code, len: cl ? parseInt(cl[1], 10) : 0 };
}

function isCatalogTile(filePath) {
  const r = spawnSync(
    "python",
    [
      "-c",
      "from PIL import Image; import sys; im=Image.open(sys.argv[1]); sys.exit(0 if im.size==(1200,1200) else 1)",
      filePath,
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );
  return r.status === 0;
}

function downloadKod(kod, dest) {
  const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
  spawnSync("curl.exe", ["-sk", "--max-time", "25", "-o", dest, url]);
}

const rows = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public/data/ekipmanlar.json"), "utf8"),
).filter((r) => /öztiryaki|oztiryaki/i.test(r.brand || ""));

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "public/images/catalog/ozti/_manifest.json"),
    "utf8",
  ),
);

const kods = [...new Set(rows.map((r) => normKod(r.sku || r.urun_kodu)).filter(Boolean))];

const s = {
  urun: kods.length,
  vitrin_gorsel_var: 0,
  vitrin_bos: 0,
  manifest: 0,
  yerel_web: 0,
  yerel_pdf: 0,
  cdn_200: 0,
  cdn_404: 0,
  cdn_diger: 0,
  cdn_ornek_1200_kare: 0,
  cdn_ornek_urun_foto: 0,
  vitrin_web_yolu: 0,
  vitrin_pdf_yolu: 0,
  vitrin_cdn_runtime: 0,
};

for (const row of rows) {
  const img = (row.images || [])[0] || "";
  if (img) {
    s.vitrin_gorsel_var++;
    if (/catalog\/ozti\/web\//i.test(img)) s.vitrin_web_yolu++;
    else if (/catalog\/ozti\/p\d+\//i.test(img)) s.vitrin_pdf_yolu++;
    else if (/ax-images|oztiryakiler/i.test(img)) s.vitrin_cdn_runtime++;
  } else s.vitrin_bos++;
}

let probed = 0;
const tmp = path.join(ROOT, "scripts/data/_ozti-cdn-probe.jpg");

for (let i = 0; i < kods.length; i++) {
  const kod = kods[i];
  const rel = manifest[kod] || "";
  if (rel) {
    s.manifest++;
    const lp = path.join(ROOT, "public", rel.replace(/^\//, ""));
    if (fs.existsSync(lp) && fs.statSync(lp).size >= MIN_BYTES) {
      if (/catalog\/ozti\/web\//i.test(rel)) s.yerel_web++;
      else if (/catalog\/ozti\/p\d+\//i.test(rel)) s.yerel_pdf++;
    }
  }

  const h = curlHead(kod);
  if (h.code === 200 && h.len >= MIN_BYTES) {
    s.cdn_200++;
    if (probed < TILE_PROBE_MAX) {
      downloadKod(kod, tmp);
      if (fs.existsSync(tmp) && fs.statSync(tmp).size >= MIN_BYTES) {
        if (isCatalogTile(tmp)) s.cdn_ornek_1200_kare++;
        else s.cdn_ornek_urun_foto++;
        probed++;
      }
      try {
        fs.unlinkSync(tmp);
      } catch {}
    }
  } else if (h.code === 404) s.cdn_404++;
  else s.cdn_diger++;

  if ((i + 1) % 400 === 0) process.stderr.write(` ${i + 1}/${kods.length}`);
}

if (probed > 0) {
  const tilePct = Math.round((s.cdn_ornek_1200_kare / probed) * 100);
  s.cdn_ornek_notu = `${probed} indirilen örnekte %${tilePct} katalog karesi (1200×1200)`;
}

const out = path.join(ROOT, "scripts/data/ozti-gorsel-karsilastirma.json");
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      tarih: new Date().toISOString(),
      cdn: `${AX}/{KOD}.jpg`,
      ...s,
    },
    null,
    2,
  ),
  "utf8",
);

console.log("\n=== Öztiryakiler.com.tr ax-images ↔ Equsto ===\n");
for (const [k, v] of Object.entries(s)) console.log(`  ${k}: ${v}`);
console.log("\nRapor:", path.relative(ROOT, out));
