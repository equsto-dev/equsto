/**
 * veri/prosogutma → market-reyon (EQ varyantları, Çağlayan ile aynı mantık)
 *
 *   node scripts/prosogutma-cek.mjs
 *   node scripts/import-prosogutma-market-reyon.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  eqBrandName,
  eqSku,
  extractProsoVariants,
  sortVariantsByOlculer,
  variantDisplayName,
  variantModelNo,
  variantSlugId,
} from "./lib/proso-variants.mjs";
import { loadProsoPriceIndex, PROSO_XLSX_DEFAULT } from "./lib/proso-display-price-list.mjs";

const execFileAsync = promisify(execFile);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../veri/prosogutma/products-tr.json");
const SRC_PAGES = path.resolve(ROOT, "../veri/prosogutma/urun-sayfalari");
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
  const slug = product.slug || "";
  const map = {
    lion: "proso-sutluk",
    rhino: "proso-sutluk",
    falcon: "proso-kisa-sutluk",
    tiger: "proso-sarkuteri",
    cobra: "proso-sarkuteri",
    scorpion: "proso-dikey-dondurucu",
    phoenix: "proso-ada-tipi",
    butterfly: "proso-butik",
    "soguk-hava": "proso-soguk-hava",
    split: "proso-sogutma-sistemleri",
  };
  for (const [k, tip] of Object.entries(map)) {
    if (slug.includes(k)) return tip;
  }
  return "proso-diger";
}

function formatSpecs(product, variants = []) {
  const lines = [];
  for (const attr of product.attributes || []) {
    lines.push(`${attr.label}: ${attr.value}`);
  }
  if (variants.length) {
    lines.push("", "Ölçü varyantları:");
    for (const v of variants.slice(0, 24)) {
      const dim =
        v.derinlik_mm > 0 && v.yukseklik_mm > 0
          ? `${v.genislik_mm}×${v.derinlik_mm}×${v.yukseklik_mm} mm`
          : v.yukseklik_mm > 0
            ? `${v.genislik_mm}×${v.yukseklik_mm} mm`
            : `${v.genislik_mm} mm`;
      lines.push(`• ${v.modelKod || ""} — ${dim}`.trim());
    }
    if (variants.length > 24) lines.push(`… +${variants.length - 24} varyant`);
  }
  for (const tab of product.tabs || []) {
    if (!tab.name) continue;
    lines.push("", `--- ${tab.name} ---`);
    for (const l of tab.links || []) {
      if (l.href) lines.push(l.text ? `${l.text}: ${l.href}` : l.href);
    }
  }
  lines.push("", "Kaynak: prosogutma.com");
  return lines.join("\n").trim();
}

function teknikOzellikler(product) {
  return (product.attributes || []).map((a) => `${a.label}: ${a.value}`);
}

function loadProducts() {
  if (fs.existsSync(SRC)) {
    return JSON.parse(fs.readFileSync(SRC, "utf8"));
  }
  if (!fs.existsSync(SRC_PAGES)) return [];
  return fs
    .readdirSync(SRC_PAGES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(SRC_PAGES, f), "utf8")));
}

function toUrunRecord(product) {
  return {
    slug: product.slug,
    baslik: product.baslik || product.title || product.slug,
    ozellikler: (product.attributes || []).map((a) => ({
      baslik: a.label,
      aciklama: a.value,
    })),
    teknik: {
      tablolar: product.teknik?.tablolar || [],
      pdfText: product.pdfText || product.teknik?.pdfText || "",
    },
    pdfText: product.pdfText || product.teknik?.pdfText || "",
    linkKaynak: product.url || "",
  };
}

async function downloadUrl(url, dest) {
  if (dryRun) return true;
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fsp.access(dest);
    return true;
  } catch {
    /* */
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "EqustoImport/1.0" },
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return false;
    await fsp.writeFile(dest, buf);
    return true;
  } catch {
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
}

function copyLocalMediaDir(slug) {
  const srcDir = path.join(SRC_MEDIA, slug);
  const destDir = path.join(OUT_IMG, slug);
  if (!fs.existsSync(srcDir)) return 0;
  if (!dryRun) fs.mkdirSync(destDir, { recursive: true });
  let n = 0;
  for (const sub of ["images", "svgs", "pdfs", "videos", ""]) {
    const sd = sub ? path.join(srcDir, sub) : srcDir;
    if (!fs.existsSync(sd)) continue;
    for (const f of fs.readdirSync(sd)) {
      if (!IMG_EXT.test(f)) continue;
      const from = path.join(sd, f);
      if (!fs.statSync(from).isFile()) continue;
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
  const addRel = (filename) => {
    const rel = `prosogutma-market/${slug}/${filename}`;
    if (seen.has(rel)) return;
    seen.add(rel);
    relPaths.push(rel);
  };

  copyLocalMediaDir(slug);
  const destDir = path.join(OUT_IMG, slug);

  const gallery = product.gallery?.[0];
  if (gallery?.src) {
    const base = path.basename(new URL(gallery.src).pathname);
    const dest = path.join(destDir, base);
    if ((await downloadUrl(gallery.src, dest)) || fs.existsSync(dest)) addRel(base);
  }

  for (const tab of product.tabs || []) {
    for (const img of tab.images || []) {
      if (!img.src?.includes("/wp-content/uploads/")) continue;
      const base = path.basename(new URL(img.src).pathname);
      if (!IMG_EXT.test(base)) continue;
      const dest = path.join(destDir, base);
      if (await downloadUrl(img.src, dest)) addRel(base);
    }
    for (const link of tab.links || []) {
      if (!link.href?.includes("/wp-content/uploads/")) continue;
      const base = path.basename(new URL(link.href).pathname);
      if (!IMG_EXT.test(base)) continue;
      const dest = path.join(destDir, base);
      if (await downloadUrl(link.href, dest)) addRel(base);
    }
  }

  const pdfUrl = product.teknik?.pdfUrl;
  if (pdfUrl) {
    const base = path.basename(new URL(pdfUrl).pathname);
    const dest = path.join(destDir, base);
    if (await downloadUrl(pdfUrl, dest)) addRel(base);
  }

  return relPaths;
}

function buildRows(product, gallery, excelIndex) {
  const tip = detectTip(product);
  const name = product.title || product.baslik || product.slug;
  const series = name.split(/\s+/)[0]?.toUpperCase() || name;
  const urun = toUrunRecord(product);
  const variants = extractProsoVariants(urun, { excelIndex });

  const common = {
    dept: "market-reyon",
    brand: BRAND,
    category: tip,
    series,
    tileId: tip,
    price: "Teklif için iletişim",
    fiyat_bekleniyor: true,
    kaynak: "prosogutma",
    linkKaynak: product.url || "",
    prosoModelSlug: product.slug,
    prosoTabs: (product.tabs || []).map((t) => ({
      name: t.name,
      links: t.links || [],
    })),
    prosoKatalogPdf: gallery.find((r) => /\.pdf$/i.test(r)) || undefined,
    prosoKatalogUrl: product.teknik?.pdfUrl || undefined,
  };

  const makeRow = (id, displayName, model, olculer, extra = {}) => ({
    ...common,
    id,
    slug: id,
    name: displayName,
    model,
    images: gallery.length ? gallery : undefined,
    specs: formatSpecs(product, variants),
    teknik_ozellikler: teknikOzellikler(product),
    olculer,
    sku: extra.sku || `EQ-PROSO-${id}`.toUpperCase().slice(0, 56),
    equstoPage: `/shop/market-reyonlari/${id}`,
    ...extra,
  });

  if (!variants.length) {
    const brand = eqBrandName(name);
    return [
      makeRow(`proso__${product.slug}`, brand, `${brand} EQ1`, undefined, {
        prosoEqModel: brand,
        prosoEqNo: 1,
        sku: eqSku(name, 1),
        prosoModelSlug: product.slug,
      }),
    ];
  }

  const brand = eqBrandName(name);
  const sorted = sortVariantsByOlculer(variants);

  return sorted.map((v, index) => {
    const eqNo = index + 1;
    const id = `proso__${variantSlugId(product.slug, v)}`;
    const olculer = {
      genislik_mm: v.genislik_mm || undefined,
      derinlik_mm: v.derinlik_mm || undefined,
      yukseklik_mm: v.yukseklik_mm || undefined,
    };
    if (!olculer.derinlik_mm) delete olculer.derinlik_mm;
    if (!olculer.genislik_mm) delete olculer.genislik_mm;
    if (!olculer.yukseklik_mm) delete olculer.yukseklik_mm;

    return makeRow(
      id,
      variantDisplayName(name, v, eqNo),
      variantModelNo(name, v, eqNo),
      Object.keys(olculer).length ? olculer : undefined,
      {
        prosoModelKod: v.modelKod || undefined,
        prosoEqModel: brand,
        prosoEqNo: eqNo,
        prosoModelSlug: product.slug,
        sku: eqSku(name, eqNo),
      }
    );
  });
}

async function main() {
  const products = loadProducts().filter((p) => p.slug && !p.error);
  if (!products.length) {
    console.error("Kaynak yok. Önce: node scripts/prosogutma-cek.mjs");
    console.error("  ", SRC);
    process.exit(1);
  }

  let excelIndex = new Map();
  try {
    excelIndex = await loadProsoPriceIndex(PROSO_XLSX_DEFAULT);
    console.log("[proso-import] Excel genişlik indeksi:", excelIndex.size);
  } catch (e) {
    console.warn("[proso-import] Excel yüklenemedi, slug map devre dışı:", e.message);
  }

  let existing = [];
  if (fs.existsSync(OUT_DEPT)) {
    existing = JSON.parse(fs.readFileSync(OUT_DEPT, "utf8"));
    existing = existing.filter((r) => r.kaynak !== "prosogutma");
  }

  const rows = [];
  for (const p of products) {
    const gallery = await collectImages(p);
    rows.push(...buildRows(p, gallery, excelIndex));
  }

  rows.sort((a, b) =>
    String(a.prosoModelSlug || a.id).localeCompare(String(b.prosoModelSlug || b.id), "tr") ||
    (Number(a.prosoEqNo) || 0) - (Number(b.prosoEqNo) || 0)
  );

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
          parentProducts: products.length,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const withOlcu = rows.filter((r) => r.olculer).length;
  console.log(
    dryRun ? "[dry-run]" : "[ok]",
    "Proso satır:",
    rows.length,
    "| ölçülü:",
    withOlcu,
    "| ürün:",
    products.length,
    "| diğer marka:",
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
