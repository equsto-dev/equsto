/**
 * PFOS scrape → Equsto market-reyon kataloğu
 *
 *   node scripts/import-caglayan-market-reyon.mjs
 *   node scripts/import-caglayan-market-reyon.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(
  ROOT,
  "../../PFOS/veri/proje-veri/caglayan-refrigeration"
);
const OUT_DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const OUT_NAV = path.join(ROOT, "public/data/caglayan-market-reyon-catalogue.json");
const OUT_IMG = path.join(ROOT, "public/data/caglayan-market");
const KATALOG = path.join(SRC, "katalog.json");
const URUN_DIR = path.join(SRC, "urun-sayfalari");

const dryRun = process.argv.includes("--dry-run");
const BRAND = "Çağlayan Refrigeration";

/** Nav vitrin serileri (eq-dept-tips ile uyumlu) */
const NAV_SERIES = [
  ["nilufer", "caglayan-nilufer", "Nilüfer"],
  ["lotus", "caglayan-lotus", "Lotus"],
  ["nergis", "caglayan-nergis", "Nergis"],
  ["lale", "caglayan-lale", "Lale"],
  ["inci", "caglayan-inci", "İnci"],
  ["hercai", "caglayan-hercai", "Hercai"],
  ["reyhan", "caglayan-reyhan", "Reyhan"],
  ["sardunya", "caglayan-sardunya", "Sardunya"],
  ["gardenya", "caglayan-gardenya", "Gardenya"],
  ["anemon", "caglayan-anemon", "Anemon"],
  ["akasya", "caglayan-akasya", "Akasya"],
];

const IMG_EXT = /\.(webp|jpe?g|png|gif|pdf)$/i;

function detectSeries(slug, baslik) {
  const s = String(slug || "").toLowerCase();
  const t = String(baslik || "").toLowerCase();
  for (const [key, tileId, label] of NAV_SERIES) {
    if (s === key || s.startsWith(key + "-") || t.includes(key)) {
      return { series: label.toUpperCase(), tileId, category: tileId };
    }
  }
  const root = s.split("-")[0];
  return {
    series: (baslik || slug || "").toUpperCase().slice(0, 40),
    tileId: "",
    category: root ? `caglayan-${root}` : "caglayan",
  };
}

function formatSpecs(urun) {
  const lines = [];
  const oz = (urun.ozellikler || []).filter((o) => o.aciklama);
  if (oz.length) {
    lines.push("Özellikler:");
    for (const o of oz) {
      lines.push(o.baslik ? `• ${o.baslik}: ${o.aciklama}` : `• ${o.aciklama}`);
    }
    lines.push("");
  }
  const tek = urun.teknik || {};
  for (const tab of tek.tablolar || []) {
    if (tab.basliklar?.length) lines.push(tab.basliklar.join(" | "));
    for (const row of tab.satirlar || []) {
      if (row.length) lines.push(row.join(" | "));
    }
    lines.push("");
  }
  for (const sek of tek.sekmeler || []) {
    if (sek.baslik) lines.push(`--- ${sek.baslik} ---`);
    for (const tab of sek.tablolar || []) {
      if (tab.basliklar?.length) lines.push(tab.basliklar.join(" | "));
      for (const row of tab.satirlar || []) {
        if (row.length) lines.push(row.join(" | "));
      }
      lines.push("");
    }
  }
  if (urun.linkKaynak) {
    lines.push(`Kaynak: ${urun.linkKaynak}`);
  }
  return lines.join("\n").trim() || "Teknik detay için teklif isteyin.";
}

function collectImages(urun) {
  const out = [];
  const seen = new Set();
  function add(rel) {
    if (!rel || seen.has(rel)) return;
    if (!IMG_EXT.test(rel)) return;
    seen.add(rel);
    out.push(`caglayan-market/${urun.slug}/${path.basename(rel)}`);
  }
  if (urun.kapakYol) add(urun.kapakYol.replace(/^gorseller\//, ""));
  const g = urun.gorseller || {};
  for (const bucket of ["urun", "teknikCizim", "tum"]) {
    for (const item of g[bucket] || []) {
      const rel = item.dosya || item.url;
      if (typeof rel === "string" && rel.includes("/")) {
        add(rel.replace(/^gorseller\//, ""));
      }
    }
  }
  return out;
}

function copyImages(slug) {
  const srcDir = path.join(SRC, "gorseller", slug);
  const destDir = path.join(OUT_IMG, slug);
  if (!fs.existsSync(srcDir)) return 0;
  if (!dryRun) fs.mkdirSync(destDir, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(srcDir)) {
    if (!IMG_EXT.test(f)) continue;
    const from = path.join(srcDir, f);
    const to = path.join(destDir, f);
    if (!dryRun) fs.copyFileSync(from, to);
    n++;
  }
  return n;
}

function buildRow(urun) {
  const { series, tileId, category } = detectSeries(urun.slug, urun.baslik);
  const images = collectImages(urun);
  const imgCount = copyImages(urun.slug);
  const name = urun.baslik || urun.slug;
  return {
    id: urun.slug,
    slug: urun.slug,
    dept: "market-reyon",
    brand: BRAND,
    name,
    category,
    series,
    tileId: tileId || undefined,
    price: "Teklif için iletişim",
    fiyat_bekleniyor: true,
    specs: formatSpecs(urun),
    images: images.length ? images : undefined,
    sku: `CAG-${urun.slug}`.toUpperCase().slice(0, 48),
    model: name,
    kaynak: "caglayan-refrigeration",
    linkKaynak: urun.linkKaynak || "",
    caglayanTip: urun.tip,
    equstoPage: `/shop/market-reyonlari/${urun.slug}`,
    _importImgCount: imgCount,
  };
}

function main() {
  if (!fs.existsSync(KATALOG)) {
    console.error("Katalog yok:", KATALOG);
    process.exit(1);
  }
  const katalog = JSON.parse(fs.readFileSync(KATALOG, "utf8"));
  const files = fs.readdirSync(URUN_DIR).filter((f) => f.endsWith(".json"));
  const rows = [];
  let skippedSeri = 0;

  for (const file of files) {
    const urun = JSON.parse(fs.readFileSync(path.join(URUN_DIR, file), "utf8"));
    if (!urun.slug) continue;
    if (urun.tip === "seri") {
      skippedSeri++;
      continue;
    }
    if (urun.tip !== "model" && urun.tip !== "urun") continue;
    rows.push(buildRow(urun));
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const navSubs = NAV_SERIES.map(([, tip, label]) => ({
    label: label.toUpperCase(),
    tip,
  }));
  navSubs.push({ label: "Tüm Çağlayan kataloğu", tip: "" });

  if (!dryRun) {
    fs.mkdirSync(path.dirname(OUT_DEPT), { recursive: true });
    fs.mkdirSync(OUT_IMG, { recursive: true });
    fs.writeFileSync(OUT_DEPT, JSON.stringify(rows, null, 0), "utf8");
    fs.writeFileSync(
      OUT_NAV,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          subs: navSubs,
          productCount: rows.length,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const imgs = rows.reduce((s, r) => s + (r._importImgCount || 0), 0);
  console.log(
    dryRun ? "[dry-run]" : "[ok]",
    "ürün:",
    rows.length,
    "| atlanan seri:",
    skippedSeri,
    "| görsel dosyası:",
    imgs
  );
  console.log("→", OUT_DEPT);
}

main();
