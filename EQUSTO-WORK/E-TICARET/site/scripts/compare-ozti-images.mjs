/**
 * Öztiryakiler: equsto vitrin görselleri ↔ oztiryakiler.com.tr/ax-images
 *   node scripts/compare-ozti-images.mjs
 *   node scripts/compare-ozti-images.mjs --limit 500
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIP = path.join(ROOT, "public/data/ekipmanlar.json");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const MIN_BYTES = 8000;
const CONCURRENCY = 16;

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function parseArgs() {
  const limit = parseInt(
    process.argv.find((a, i) => process.argv[i - 1] === "--limit") || "0",
    10,
  );
  return { limit: limit > 0 ? limit : 0 };
}

function localPath(rel) {
  if (!rel) return "";
  return path.join(ROOT, "public", String(rel).replace(/^\//, ""));
}

function isCatalogTile(filePath) {
  try {
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
  } catch {
    return false;
  }
}

async function probeCdn(kod) {
  const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
  try {
    const r = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return { cdn: "404", bytes: 0 };
    const len = parseInt(r.headers.get("content-length") || "0", 10);
    if (len > 0 && len < MIN_BYTES) return { cdn: "kucuk", bytes: len };
    if (len === 0) {
      const g = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!g.ok) return { cdn: "404", bytes: 0 };
      const buf = Buffer.from(await g.arrayBuffer());
      if (buf.length < MIN_BYTES) return { cdn: "kucuk", bytes: buf.length };
      const tmp = path.join(ROOT, "scripts/data/_ozti-probe-tmp.jpg");
      fs.writeFileSync(tmp, buf);
      const tile = isCatalogTile(tmp);
      try {
        fs.unlinkSync(tmp);
      } catch {}
      return tile
        ? { cdn: "katalog-kare-1200", bytes: buf.length }
        : { cdn: "urun-gorseli", bytes: buf.length };
    }
    return { cdn: "var-head", bytes: len };
  } catch {
    return { cdn: "hata", bytes: 0 };
  }
}

async function main() {
  const { limit } = parseArgs();
  const rows = JSON.parse(fs.readFileSync(EKIP, "utf8")).filter((r) =>
    /öztiryaki|oztiryaki/i.test(r.brand || ""),
  );
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  const kods = [...new Set(rows.map((r) => normKod(r.sku || r.urun_kodu)).filter(Boolean))];
  const sample = limit > 0 ? kods.slice(0, limit) : kods;

  const stats = {
    urun: kods.length,
    orneklenen: sample.length,
    vitrin_images_dolu: 0,
    vitrin_bos: 0,
    manifest_var: 0,
    yerel_web_dosya: 0,
    yerel_pdf: 0,
    yerel_web_urun_foto: 0,
    yerel_web_katalog_kare: 0,
    cdn_404: 0,
    cdn_katalog_kare: 0,
    cdn_urun_gorseli: 0,
    cdn_var_head: 0,
    cdn_kucuk: 0,
    cdn_hata: 0,
    eslesme_ikisi_urun: 0,
    sadece_yerel: 0,
    sadece_cdn: 0,
    ikisi_yok: 0,
  };

  for (const row of rows) {
    if ((row.images || []).length) stats.vitrin_images_dolu++;
    else stats.vitrin_bos++;
  }

  let qi = 0;
  async function worker() {
    while (qi < sample.length) {
      const i = qi++;
      const kod = sample[i];
      const rel = manifest[kod] || "";
      const lp = localPath(rel);
      let localKind = "yok";
      if (rel && fs.existsSync(lp) && fs.statSync(lp).size >= MIN_BYTES) {
        stats.manifest_var++;
        if (/\/web\//i.test(rel)) {
          stats.yerel_web_dosya++;
          if (isCatalogTile(lp)) {
            stats.yerel_web_katalog_kare++;
            localKind = "web-kare";
          } else {
            stats.yerel_web_urun_foto++;
            localKind = "web-urun";
          }
        } else if (/\/p\d+\//i.test(rel)) {
          stats.yerel_pdf++;
          localKind = "pdf";
        } else localKind = "diger";
      } else if (rel) localKind = "manifest-ama-dosya-yok";

      const cdn = await probeCdn(kod);
      const cdnKey = {
        "404": "cdn_404",
        kucuk: "cdn_kucuk",
        "katalog-kare-1200": "cdn_katalog_kare",
        "urun-gorseli": "cdn_urun_gorseli",
        "var-head": "cdn_var_head",
        hata: "cdn_hata",
      }[cdn.cdn];
      if (cdnKey) stats[cdnKey]++;

      const cdnOk = cdn.cdn === "urun-gorseli" || cdn.cdn === "var-head";
      const localOk = localKind === "web-urun" || localKind === "pdf";
      if (cdnOk && localOk) stats.eslesme_ikisi_urun++;
      else if (localOk && !cdnOk) stats.sadece_yerel++;
      else if (cdnOk && !localOk) stats.sadece_cdn++;
      else if (!cdnOk && !localOk) stats.ikisi_yok++;

      if ((i + 1) % 200 === 0)
        console.log(`[compare] ${i + 1}/${sample.length}…`);
    }
  }

  console.log("[compare] Öztiryakiler görsel karşılaştırması");
  console.log("  CDN:", AX + "/{KOD}.jpg");
  console.log("  Mağaza ürün:", stats.urun);
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  const out = path.join(ROOT, "scripts/data/ozti-gorsel-karsilastirma.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        tarih: new Date().toISOString(),
        cdn_base: AX,
        ...stats,
        notlar: [
          "CDN çoğu kodda 1200×1200 katalog sayfası döndürür (ürün fotoğrafı değil).",
          "Equsto vitrin: yerel web (gerçek foto) veya PDF kırpımı; boşsa CDN denenir (eq-site-urls.js).",
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log("\n=== ÖZET ===");
  for (const [k, v] of Object.entries(stats)) {
    if (typeof v === "number") console.log(`  ${k}: ${v}`);
  }
  console.log("\nRapor:", path.relative(ROOT, out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
