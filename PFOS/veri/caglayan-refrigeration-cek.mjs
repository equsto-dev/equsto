#!/usr/bin/env node
/**
 * Çağlayan Refrigeration (caglayanrefrigeration.com/tr) ürün kataloğu çekici.
 * Çıktı: veri/proje-veri/caglayan-refrigeration/
 *
 *   node veri/caglayan-refrigeration-cek.mjs
 *   node veri/caglayan-refrigeration-cek.mjs --no-images
 *   node veri/caglayan-refrigeration-cek.mjs --slug papatya-nv
 */
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "proje-veri", "caglayan-refrigeration");
const API = "https://caglayanrefrigeration.com/wp-json";
const SITE = "https://caglayanrefrigeration.com";
const UA = "Mozilla/5.0 (PFOS veri; +https://equsto.com)";

const args = process.argv.slice(2);
const skipImages = args.includes("--no-images");
const slugFilter = args.includes("--slug")
  ? args[args.indexOf("--slug") + 1]
  : null;

const SKIP_IMG_RE =
  /(favicon|logo|dummy\.png|revslider|product-bg|fresh\.webp|three-circle|category-line|transparent\.png|assets\/assets|elementor\/css|\.css$)/i;
const IMG_EXT_RE = /\.(webp|jpe?g|png|gif|pdf)(\?|$)/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}

function toTrUrl(url) {
  if (!url) return url;
  if (url.includes("/tr/")) return url.split("?")[0];
  return url.replace(SITE, `${SITE}/tr`).split("?")[0];
}

function absUrl(u) {
  if (!u) return null;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http")) return u.split("?")[0];
  if (u.startsWith("/")) return `${SITE}${u}`;
  return u;
}

function slugFromUrl(url) {
  const p = url.replace(/\/$/, "").split("/");
  return p[p.length - 1] || "urun";
}

async function apiGetAll(restPath) {
  const out = [];
  let page = 1;
  while (true) {
    const sep = restPath.includes("?") ? "&" : "?";
    const url = `${API}${restPath}${sep}page=${page}&per_page=100`;
    let res = null;
    let data = null;
    for (let attempt = 1; attempt <= 6; attempt++) {
      res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) {
        data = await res.json();
        break;
      }
      if (res.status >= 500 && attempt < 6) {
        await sleep(1000 * attempt);
        continue;
      }
      throw new Error(`API ${restPath} p${page} ${res.status}`);
    }
    if (!Array.isArray(data) || !data.length) break;
    out.push(...data);
    const totalPages = Number(res.headers.get("X-WP-TotalPages") || 1);
    if (page >= totalPages) break;
    page++;
    await sleep(400);
  }
  return out;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9", Accept: "text/html" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function extractMain(html) {
  const m = html.match(/<div class="wd-single-project[\s\S]*?<\/main>/i);
  return m ? m[0] : html;
}

function extractImages(html) {
  const urls = new Set();
  const patterns = [
    /data-lazyload="([^"]+)"/gi,
    /href="(https:\/\/caglayanrefrigeration\.com\/wp-content\/uploads\/[^"]+)"/gi,
    /src="(https:\/\/caglayanrefrigeration\.com\/wp-content\/uploads\/[^"]+)"/gi,
    /src="(\/\/caglayanrefrigeration\.com\/wp-content\/uploads\/[^"]+)"/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const u = absUrl(m[1]);
      if (u && IMG_EXT_RE.test(u) && !SKIP_IMG_RE.test(u)) urls.add(bestSizeUrl(u));
    }
  }
  return [...urls];
}

function bestSizeUrl(u) {
  return u.replace(/-\d+x\d+(\.(webp|jpe?g|png))$/i, "$1");
}

function parseTables(html) {
  const tables = [];
  for (const block of html.matchAll(/<table class="wd-el-table">([\s\S]*?)<\/table>/gi)) {
    const tHtml = block[1];
    const headers = [];
    for (const th of tHtml.matchAll(/<thead[\s\S]*?<\/thead>/gi)) {
      for (const cell of th[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)) {
        const t = stripTags(cell[1]);
        if (t) headers.push(...t.split(/\s{2,}/).filter(Boolean));
      }
    }
    const satirlar = [];
    for (const tr of tHtml.matchAll(/<tbody[\s\S]*?<\/tbody>/gi)) {
      for (const row of tr[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const cells = [];
        for (const cell of row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)) {
          const t = stripTags(cell[1]);
          if (t) cells.push(t);
        }
        if (cells.length) satirlar.push(cells);
      }
    }
    if (satirlar.length) tables.push({ basliklar: headers, satirlar });
  }
  return tables;
}

function parseTabs(html) {
  const sekmeler = [];
  const tabBlocks = html.match(/<div class="wd-tabs tabs-design-alt">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi) || [];
  for (const block of tabBlocks) {
    const titles = [...block.matchAll(/wd-tabs-title[^>]*>([\s\S]*?)<\/span>/gi)].map((m) =>
      stripTags(m[1])
    );
    const contents = [...block.matchAll(/<div class="wd-tab-content[^"]*"[\s\S]*?>([\s\S]*?)<\/div>\s*(?=<div class="wd-tab-content|<\/div>\s*<\/div>\s*<\/div>)/gi)];
    titles.forEach((title, i) => {
      const chunk = contents[i]?.[1] || block;
      const gorseller = extractImages(chunk).filter((u) => /Kesit|kesit|drawing|Drawing|HD|LM|FG/i.test(u) || true);
      const tablolar = parseTables(chunk);
      sekmeler.push({
        baslik: title || `Sekme ${i + 1}`,
        gorseller,
        tablolar,
      });
    });
  }
  return sekmeler;
}

function parseAccordions(html) {
  const akordeon = [];
  for (const item of html.matchAll(/<div class="wd-accordion-item">([\s\S]*?)<\/div>\s*<\/div>\s*(?=<div class="wd-accordion-item"|$)/gi)) {
    const chunk = item[1];
    const baslik = stripTags(chunk.match(/wd-accordion-title-text[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "");
    const content = chunk.match(/wd-accordion-content[\s\S]*/i)?.[0] || chunk;
    akordeon.push({
      baslik,
      sekmeler: parseTabs(content),
      tablolar: parseTables(content),
      gorseller: extractImages(content),
    });
  }
  return akordeon;
}

function parseIconBoxes(html) {
  const out = [];
  for (const box of html.matchAll(/elementor-icon-box-wrapper">([\s\S]*?)<\/div>\s*<\/div>/gi)) {
    const chunk = box[1];
    const title = stripTags(chunk.match(/elementor-icon-box-title[^>]*>([\s\S]*?)<\//i)?.[1] || "");
    const desc = stripTags(chunk.match(/elementor-icon-box-description[^>]*>([\s\S]*?)<\//i)?.[1] || "");
    if (title || desc) out.push({ baslik: title, aciklama: desc });
  }
  return out;
}

function parseChildren(html) {
  const cocuklar = [];
  for (const art of html.matchAll(/<article[^>]*class="[^"]*portfolio-entry[^"]*"[\s\S]*?<\/article>/gi)) {
    const href = art[0].match(/href="(https:\/\/caglayanrefrigeration\.com\/tr\/product\/[^"]+)"/i)?.[1];
    const ad = stripTags(art[0].match(/wd-entities-title[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "");
    const img = absUrl(
      art[0].match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
        art[0].match(/data-lazyload="([^"]+)"/i)?.[1]
    );
    if (href) {
      cocuklar.push({
        slug: slugFromUrl(href),
        ad,
        link: href,
        kapak: img ? bestSizeUrl(img) : null,
      });
    }
  }
  return cocuklar;
}

function parseProductPage(html, meta) {
  const main = extractMain(html);
  const h1 = stripTags(html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || meta.title);
  const cocuklar = parseChildren(main);
  const akordeon = parseAccordions(main);
  const tablolar = parseTables(main);
  const sekmeler = parseTabs(main);
  const ozellikler = parseIconBoxes(main);
  const gorseller = extractImages(main);
  const kapak =
    absUrl(html.match(/thumbnailUrl":"([^"]+)"/i)?.[1]) ||
    gorseller.find((u) => /Kapak|kapak/i.test(u)) ||
    gorseller[0] ||
    null;

  const teknikCizimler = gorseller.filter((u) => /Kesit|kesit|FG-|LM-|HD-/i.test(u));
  const urunGorselleri = gorseller.filter((u) => !teknikCizimler.includes(u));

  const leaf = akordeon.length > 0 || tablolar.length > 0 || sekmeler.some((s) => s.tablolar?.length);

  return {
    slug: meta.slug,
    wpId: meta.id,
    ad: h1 || meta.title,
    link: meta.trLink,
    linkEn: meta.link,
    kategoriWpIds: meta.categories,
    tip: leaf ? "model" : cocuklar.length ? "seri" : "urun",
    kapak,
    cocuklar,
    gorseller: {
      tum: gorseller,
      urun: urunGorselleri,
      teknikCizim: teknikCizimler,
    },
    ozellikler,
    teknik: {
      akordeon,
      sekmeler,
      tablolar,
    },
  };
}

async function downloadImage(url, destDir) {
  const fileName = path.basename(new URL(url).pathname);
  const dest = path.join(destDir, fileName);
  try {
    await access(dest);
    return path.relative(ROOT, dest).replace(/\\/g, "/");
  } catch {
    /* yok */
  }
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`IMG ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(destDir, { recursive: true });
  await writeFile(dest, buf);
  await sleep(80);
  return path.relative(ROOT, dest).replace(/\\/g, "/");
}

async function localizeImages(urun) {
  const dir = path.join(ROOT, "gorseller", urun.slug);
  const map = new Map();

  async function grab(url) {
    if (!url || map.has(url)) return;
    try {
      const rel = await downloadImage(url, dir);
      map.set(url, rel);
    } catch (e) {
      map.set(url, null);
      console.warn("  görsel atlandı:", url, e.message);
    }
  }

  if (urun.kapak) await grab(urun.kapak);
  for (const u of urun.gorseller.tum) await grab(u);

  const rel = (url) => (url ? map.get(url) ?? null : null);
  urun.kapakYol = rel(urun.kapak);
  urun.gorseller = {
    tum: urun.gorseller.tum.map((u) => ({ url: u, dosya: rel(u) })),
    urun: urun.gorseller.urun.map((u) => ({ url: u, dosya: rel(u) })),
    teknikCizim: urun.gorseller.teknikCizim.map((u) => ({ url: u, dosya: rel(u) })),
  };
  urun.cocuklar = urun.cocuklar.map((c) => ({
    ...c,
    kapakYol: rel(c.kapak),
  }));
}

async function main() {
  console.log("Çağlayan katalog çekiliyor…");
  await mkdir(ROOT, { recursive: true });

  const categories = await apiGetAll("/wp/v2/project-cat");
  const portfolio = await apiGetAll("/wp/v2/portfolio");

  const catById = Object.fromEntries(
    categories.map((c) => [
      c.id,
      {
        id: c.slug,
        wpId: c.id,
        ad: decodeHtml(c.name),
        adEn: c.slug,
        ustWpId: c.parent || null,
        urunSayisi: c.count,
      },
    ])
  );

  let items = portfolio.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: decodeHtml(p.title?.rendered || p.slug),
    link: p.link,
    trLink: toTrUrl(p.link),
    categories: p["project-cat"] || [],
    featured: null,
  }));

  if (slugFilter) {
    items = items.filter((i) => i.slug === slugFilter || i.trLink.includes(slugFilter));
    if (!items.length) {
      console.error("Slug bulunamadı:", slugFilter);
      process.exit(1);
    }
  }

  const urunler = [];
  let n = 0;
  for (const meta of items) {
    n++;
    process.stdout.write(`[${n}/${items.length}] ${meta.slug} … `);
    try {
      const html = await fetchHtml(meta.trLink);
      const urun = parseProductPage(html, meta);
      if (!urun.kapak && meta.featured) urun.kapak = meta.featured;
      if (!skipImages) await localizeImages(urun);
      urunler.push(urun);
      console.log(urun.tip, urun.gorseller.tum?.length ?? 0, "görsel");
    } catch (e) {
      console.log("HATA", e.message);
      urunler.push({
        slug: meta.slug,
        wpId: meta.id,
        ad: meta.title,
        link: meta.trLink,
        hata: e.message,
      });
    }
    await sleep(400);
  }

  // üst-alt ilişki
  const bySlug = Object.fromEntries(urunler.filter((u) => u.slug).map((u) => [u.slug, u]));
  for (const u of urunler) {
    if (!u.cocuklar?.length) continue;
    for (const c of u.cocuklar) {
      if (bySlug[c.slug]) bySlug[c.slug].ustSeriSlug = u.slug;
    }
  }

  const kategoriAgaci = categories
    .filter((c) => !c.parent)
    .map((c) => ({
      ...catById[c.id],
      alt: categories.filter((x) => x.parent === c.id).map((x) => catById[x.id]),
    }));

  const manifest = {
    kaynak: "https://caglayanrefrigeration.com/tr/",
    uretici: "Çağlayan Refrigeration",
    cekilmeTarihi: new Date().toISOString(),
    toplamUrun: urunler.length,
    kategoriler: Object.values(catById),
    kategoriAgaci,
    urunler,
  };

  const outJson = path.join(ROOT, "katalog.json");
  await writeFile(outJson, JSON.stringify(manifest, null, 2), "utf8");

  // ürün başına sayfa taslağı (ileride site sayfası için)
  const sayfalarDir = path.join(ROOT, "urun-sayfalari");
  await mkdir(sayfalarDir, { recursive: true });
  for (const u of urunler) {
    if (!u.slug || u.hata) continue;
    const page = {
      slug: u.slug,
      baslik: u.ad,
      tip: u.tip,
      ustSeriSlug: u.ustSeriSlug || null,
      kategoriler: (u.kategoriWpIds || [])
        .map((id) => catById[id]?.id)
        .filter(Boolean),
      kapak: u.kapak,
      kapakYol: u.kapakYol || null,
      linkKaynak: u.link,
      cocuklar: u.cocuklar,
      ozellikler: u.ozellikler,
      teknik: u.teknik,
      gorseller: u.gorseller,
    };
    await writeFile(
      path.join(sayfalarDir, `${u.slug}.json`),
      JSON.stringify(page, null, 2),
      "utf8"
    );
  }

  const idx = [
    "# Çağlayan Refrigeration — çekilmiş katalog",
    "",
    `Kaynak: [caglayanrefrigeration.com/tr](https://caglayanrefrigeration.com/tr/)`,
    `Çekilme: ${manifest.cekilmeTarihi}`,
    `Ürün sayısı: **${urunler.length}**`,
    "",
    "## Dosyalar",
    "",
    "| Dosya | Açıklama |",
    "|-------|----------|",
    "| `katalog.json` | Tüm ürünler, kategoriler, teknik tablolar |",
    "| `urun-sayfalari/*.json` | Ürün başına sayfa taslağı |",
    "| `gorseller/{slug}/` | İndirilen görseller |",
    "",
    "## Komut",
    "",
    "```bash",
    "node veri/caglayan-refrigeration-cek.mjs",
    "node veri/caglayan-refrigeration-cek.mjs --no-images",
    "node veri/caglayan-refrigeration-cek.mjs --slug papatya-nv",
    "```",
    "",
  ].join("\n");
  await writeFile(path.join(ROOT, "README.md"), idx, "utf8");

  console.log("\nBitti →", outJson);
  console.log("Ürün:", urunler.length, "| Görsel klasörü:", path.join(ROOT, "gorseller"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
