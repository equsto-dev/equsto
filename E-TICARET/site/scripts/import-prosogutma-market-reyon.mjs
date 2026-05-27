/**
 * veri/prosogutma → market-reyon kataloğu (Proso Profesyonel Soğutma)
 *
 *   node scripts/import-prosogutma-market-reyon.mjs
 *   node scripts/import-prosogutma-market-reyon.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../veri/prosogutma/products-tr.json");
const SRC_MEDIA = path.resolve(ROOT, "../veri/prosogutma/media/products");
const OUT_DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const OUT_NAV = path.join(ROOT, "public/data/prosogutma-market-reyon-catalogue.json");
const OUT_IMG = path.join(ROOT, "public/data/prosogutma-market");
const CURL = process.env.CURL_PATH || "curl.exe";

const dryRun = process.argv.includes("--dry-run");
const BRAND = "Proso Profesyonel Soğutma";

const KABIN_TIP = {
  sütlükler: "proso-sutluk",
  sutlukler: "proso-sutluk",
  "kısa sütlükler": "proso-kisa-sutluk",
  "sarküteri reyonları": "proso-sarkuteri",
  "sarkuteri reyonlari": "proso-sarkuteri",
  "dikey dondurucular": "proso-dikey-dondurucu",
  "derin dondurucular": "proso-dikey-dondurucu",
  "ada tipi dondurucular": "proso-ada-tipi",
  "plug-in kabinler": "proso-plugin",
  butik: "proso-butik",
  "soğuk hava depoları": "proso-soguk-hava",
  "soguk hava depolari": "proso-soguk-hava",
  "soğutma sistemleri": "proso-sogutma-sistemleri",
  "sogutma sistemleri": "proso-sogutma-sistemleri",
  "şişe soğutucular": "proso-sise-sogutucu",
  "sise sogutucular": "proso-sise-sogutucu",
};

const NAV_PROSO = [
  ["proso-sutluk", "Sütlükler"],
  ["proso-kisa-sutluk", "Kısa Sütlükler"],
  ["proso-sarkuteri", "Şarküteri Reyonları"],
  ["proso-dikey-dondurucu", "Dikey Dondurucular"],
  ["proso-ada-tipi", "Ada Tipi"],
  ["proso-plugin", "Plug-in Kabinler"],
  ["proso-butik", "Butik"],
  ["proso-soguk-hava", "Soğuk Hava Depoları"],
  ["proso-sogutma-sistemleri", "Soğutma Sistemleri"],
  ["proso-sise-sogutucu", "Şişe Soğutucular"],
];

const IMG_EXT = /\.(webp|jpe?g|png|gif|svg|pdf)$/i;

function norm(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function detectTip(product) {
  for (const attr of product.attributes || []) {
    if (/kabin/i.test(attr.label)) {
      const key = norm(attr.value);
      if (KABIN_TIP[key]) return KABIN_TIP[key];
      for (const [k, tip] of Object.entries(KABIN_TIP)) {
        if (key.includes(k)) return tip;
      }
    }
  }
  const cat = product.categories?.[0];
  if (cat?.url) {
    const slug = cat.url.split("/").filter(Boolean).pop() || "";
    const map = {
      sutlukler: "proso-sutluk",
      "kisa-sutlukler": "proso-kisa-sutluk",
      "sarkuteri-reyonlari": "proso-sarkuteri",
      "dikey-dondurucular": "proso-dikey-dondurucu",
      "ada-tipi-dondurucular": "proso-ada-tipi",
      "plug-in-kabinler": "proso-plugin",
      butik: "proso-butik",
      "soguk-hava-depolari": "proso-soguk-hava",
      "sogutma-sistemleri": "proso-sogutma-sistemleri",
      "sise-sogutucular": "proso-sise-sogutucu",
    };
    if (map[slug]) return map[slug];
  }
  return "proso-diger";
}

function formatSpecs(product) {
  const lines = [];
  for (const attr of product.attributes || []) {
    lines.push(`${attr.label}: ${attr.value}`);
  }
  if (lines.length) lines.push("");
  for (const tab of product.tabs || []) {
    if (!tab.name) continue;
    lines.push(`--- ${tab.name} ---`);
    if (tab.links?.length) {
      for (const l of tab.links) {
        if (l.href && l.text) lines.push(`${l.text}: ${l.href}`);
        else if (l.href) lines.push(l.href);
      }
    } else if (tab.html) {
      const text = tab.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text && text.length < 500) lines.push(text);
    }
    lines.push("");
  }
  lines.push("Kaynak: prosogutma.com");
  return lines.join("\n").trim();
}

function teknikOzellikler(product) {
  const out = [];
  for (const attr of product.attributes || []) {
    out.push(`${attr.label}: ${attr.value}`);
  }
  return out;
}

async function downloadUrl(url, dest) {
  if (dryRun) return true;
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fsp.access(dest);
    return true;
  } catch {
    /* indir */
  }
  try {
    const { stdout } = await execFileAsync(
      CURL,
      ["-sL", "--max-time", "90", "-A", "EqustoImport/1.0", url],
      { maxBuffer: 64 * 1024 * 1024, encoding: "buffer" }
    );
    if (!stdout?.length) return false;
    await fsp.writeFile(dest, stdout);
    return true;
  } catch {
    return false;
  }
}

function copyLocalMediaDir(slug) {
  const srcDir = path.join(SRC_MEDIA, slug);
  const destDir = path.join(OUT_IMG, slug);
  if (!fs.existsSync(srcDir)) return 0;
  if (!dryRun) fs.mkdirSync(destDir, { recursive: true });
  let n = 0;
  for (const sub of ["images", "svgs", "pdfs", "videos"]) {
    const sd = path.join(srcDir, sub);
    if (!fs.existsSync(sd)) continue;
    for (const f of fs.readdirSync(sd)) {
      if (!IMG_EXT.test(f)) continue;
      const from = path.join(sd, f);
      const to = path.join(destDir, f);
      if (!dryRun) fs.copyFileSync(from, to);
      n++;
    }
  }
  return n;
}

async function collectImages(product) {
  const slug = product.slug;
  const relPaths = [];
  const seen = new Set();

  function addRel(filename) {
    const rel = `prosogutma-market/${slug}/${filename}`;
    if (seen.has(rel)) return;
    seen.add(rel);
    relPaths.push(rel);
  }

  copyLocalMediaDir(slug);

  const destDir = path.join(OUT_IMG, slug);
  const gallery = product.gallery?.[0];
  if (gallery?.src) {
    const base = path.basename(new URL(gallery.src).pathname);
    const dest = path.join(destDir, base);
    const ok = await downloadUrl(gallery.src, dest);
    if (ok) addRel(base);
    else if (/^https?:\/\//i.test(gallery.src)) {
      try {
        await fsp.access(dest);
        addRel(base);
      } catch {
        relPaths.push(gallery.src);
      }
    }
  }

  for (const tab of product.tabs || []) {
    for (const img of tab.images || []) {
      if (!img.src || !img.src.includes("/wp-content/uploads/")) continue;
      const base = path.basename(new URL(img.src).pathname);
      if (!IMG_EXT.test(base)) continue;
      const dest = path.join(destDir, base);
      const ok = await downloadUrl(img.src, dest);
      if (ok) addRel(base);
    }
    for (const link of tab.links || []) {
      if (!link.href?.includes("/wp-content/uploads/")) continue;
      const base = path.basename(new URL(link.href).pathname);
      if (!IMG_EXT.test(base)) continue;
      const dest = path.join(destDir, base);
      await downloadUrl(link.href, dest);
      if (!seen.has(`prosogutma-market/${slug}/${base}`)) addRel(base);
    }
  }

  return relPaths;
}

function buildRow(product) {
  const tip = detectTip(product);
  const name = product.title || product.slug;
  return {
    id: `proso__${product.slug}`,
    slug: product.slug,
    dept: "market-reyon",
    brand: BRAND,
    name,
    category: tip,
    series: name.split(/\s+/)[0]?.toUpperCase() || name,
    tileId: tip,
    price: "Teklif için iletişim",
    fiyat_bekleniyor: true,
    specs: formatSpecs(product),
    teknik_ozellikler: teknikOzellikler(product),
    sku: `PROSO-${product.slug}`.toUpperCase().slice(0, 48),
    model: name,
    kaynak: "prosogutma",
    linkKaynak: product.url || "",
    equstoPage: `/shop/market-reyonlari/${product.slug}`,
    prosoTabs: (product.tabs || []).map((t) => ({
      name: t.name,
      links: t.links || [],
    })),
  };
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Kaynak yok:", SRC);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(SRC, "utf8"));
  let existing = [];
  if (fs.existsSync(OUT_DEPT)) {
    existing = JSON.parse(fs.readFileSync(OUT_DEPT, "utf8"));
    existing = existing.filter((r) => r.kaynak !== "prosogutma");
  }

  const rows = [];
  for (const p of products) {
    if (!p.slug || p.error) continue;
    const row = buildRow(p);
    row.images = await collectImages(p);
    if (!row.images?.length) delete row.images;
    rows.push(row);
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const merged = [...existing, ...rows];

  const navSubs = [
    { label: "Tüm Proso kataloğu", tip: "proso-tumu", href: "/shop/market-reyonlari?tip=proso-tumu" },
    ...NAV_PROSO.map(([tip, label]) => ({
      label,
      tip,
      href: `/shop/market-reyonlari?tip=${tip}`,
    })),
  ];

  if (!dryRun) {
    fs.mkdirSync(path.dirname(OUT_DEPT), { recursive: true });
    fs.mkdirSync(OUT_IMG, { recursive: true });
    fs.writeFileSync(OUT_DEPT, JSON.stringify(merged, null, 0), "utf8");
    fs.writeFileSync(
      OUT_NAV,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          brand: BRAND,
          subs: navSubs,
          productCount: rows.length,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  console.log(
    dryRun ? "[dry-run]" : "[ok]",
    "Proso:",
    rows.length,
    "| mevcut (diğer marka):",
    existing.length,
    "| toplam:",
    merged.length
  );
  console.log("→", OUT_DEPT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
