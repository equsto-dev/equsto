/**
 * prosogutma.com — WordPress ürün REST çıktısını sayfa sayfa indirir.
 *
 * Kaynak: GET https://prosogutma.com/wp-json/wp/v2/product?per_page=...&page=...
 *
 * Kullanım (proje kökünden):
 *   node scripts/fetch-proso-products.mjs
 *   node scripts/fetch-proso-products.mjs --max-pages=2   (deneme: 2 sayfa)
 *
 * Proso REST API'si Polylang üzerinden hem TR hem EN ürünleri tek listede döner
 * (143 ürün). Her ürün için linke bakarak `lang` alanı türetilir (`/urun/` -> tr,
 * `/en/urun/` -> en).
 *
 * Kategori sözlüğü (id -> slug, name) ve featured_media -> görsel URL eşlemesi
 * payload içine eklenir; içerik gövdesi (content/excerpt) Elementor `html_block`
 * shortcode'u içerdiği için REST tarafından boş döner — ham haliyle saklanır.
 *
 * TLS hatası (kurumsal proxy / eksik zincir) için geçici:
 *   set PROSO_TLS_INSECURE=1   (Windows CMD)
 *   $env:PROSO_TLS_INSECURE='1'   (PowerShell)
 *
 * Not: Bu script yalnızca teknik erişim sağlar; içerik / görsel kullanımı için
 * Proso Profesyonel Soğutma izin ve kullanım koşulları geçerlidir.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const HOST = "https://prosogutma.com";
const PRODUCT_EP = HOST + "/wp-json/wp/v2/product";
const CATEGORY_EP = HOST + "/wp-json/wp/v2/product_cat";
const BRAND_EP = HOST + "/wp-json/wp/v2/product_brand";
const MEDIA_EP = HOST + "/wp-json/wp/v2/media";
const PER_PAGE = 50;
const OUT = path.join(ROOT, "public", "data", "proso-wp-products.json");

function argNum(name, def) {
  const a = process.argv.find((x) => x.startsWith(name + "="));
  if (!a) return def;
  const v = parseInt(a.split("=")[1], 10);
  return Number.isFinite(v) ? v : def;
}

const maxPages = argNum("--max-pages", 0); // 0 = tüm sayfalar

const insecure =
  process.env.PROSO_TLS_INSECURE === "1" ||
  process.env.PROSO_TLS_INSECURE === "true";

function httpsGetJson(urlStr, redirectLeft = 8) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "EqustoCatalogFetcher/1.0",
        Host: u.hostname,
      },
      rejectUnauthorized: !insecure,
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const code = res.statusCode || 0;
        if (
          (code === 301 || code === 302 || code === 307 || code === 308) &&
          res.headers.location
        ) {
          if (redirectLeft <= 0) {
            reject(new Error("Çok fazla yönlendirme"));
            return;
          }
          const next = new URL(res.headers.location, urlStr).href;
          httpsGetJson(next, redirectLeft - 1).then(resolve).catch(reject);
          return;
        }
        if (code !== 200) {
          reject(new Error("HTTP " + code + " " + body.slice(0, 200)));
          return;
        }
        try {
          resolve({ json: JSON.parse(body), headers: res.headers });
        } catch (e) {
          reject(new Error("JSON parse: " + e.message));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function detectLang(link) {
  if (!link || typeof link !== "string") return null;
  if (link.includes("/en/urun/")) return "en";
  if (link.includes("/urun/")) return "tr";
  return null;
}

function simplifyProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    id: p.id,
    slug: p.slug,
    link: p.link,
    lang: detectLang(p.link),
    title: p.title && p.title.rendered,
    excerpt: p.excerpt && p.excerpt.rendered,
    content: p.content && p.content.rendered,
    product_cat: p.product_cat || [],
    product_brand: p.product_brand || [],
    featured_media: p.featured_media || 0,
    date: p.date,
    modified: p.modified,
  }));
}

async function fetchPaged(baseUrl, extraQs = "") {
  const out = [];
  let page = 1;
  let totalPages = 1;
  let reportedTotal = null;
  for (;;) {
    const url = `${baseUrl}?per_page=${PER_PAGE}&page=${page}${extraQs}`;
    process.stderr.write(`GET ${url}\n`);
    const { json, headers } = await httpsGetJson(url);
    const batch = Array.isArray(json) ? json : [];
    if (batch.length === 0) break;
    out.push(...batch);
    const tp = parseInt(headers["x-wp-totalpages"] || "1", 10);
    totalPages = Number.isFinite(tp) ? tp : 1;
    if (page === 1) {
      const tt = parseInt(headers["x-wp-total"] || "0", 10);
      reportedTotal = Number.isFinite(tt) && tt > 0 ? tt : null;
    }
    if (maxPages > 0 && page >= maxPages) break;
    if (page >= totalPages) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 400));
  }
  return { items: out, totalPages, reportedTotal };
}

async function fetchMediaUrls(ids) {
  const map = {};
  const unique = [...new Set(ids.filter((x) => Number.isInteger(x) && x > 0))];
  // WP REST supports `include=` to batch fetch up to 100 IDs at a time
  const CHUNK = 50;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const url = `${MEDIA_EP}?per_page=${slice.length}&include=${slice.join(",")}&_fields=id,source_url,mime_type,alt_text,media_details`;
    process.stderr.write(`GET media [${slice.length}]\n`);
    const { json } = await httpsGetJson(url);
    if (!Array.isArray(json)) continue;
    for (const m of json) {
      const sizes = (m.media_details && m.media_details.sizes) || {};
      const woo =
        (sizes.woocommerce_single && sizes.woocommerce_single.source_url) ||
        (sizes.medium_large && sizes.medium_large.source_url) ||
        (sizes.medium && sizes.medium.source_url) ||
        null;
      map[m.id] = {
        sourceUrl: m.source_url || null,
        woocommerceSingleUrl: woo,
        mimeType: m.mime_type || null,
        altText: m.alt_text || null,
      };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return map;
}

function termsAsMap(items) {
  const map = {};
  for (const t of items) {
    map[t.id] = {
      slug: t.slug,
      name: t.name,
      parent: t.parent || 0,
      count: t.count || 0,
    };
  }
  return map;
}

async function main() {
  if (insecure) {
    console.warn(
      "[uyarı] PROSO_TLS_INSECURE=1 — TLS doğrulaması kapalı (yalnızca geliştirme).",
    );
  }

  console.log("Ürünler indiriliyor…");
  const prodRes = await fetchPaged(
    PRODUCT_EP,
    "&_fields=id,slug,link,title,excerpt,content,product_cat,product_brand,featured_media,date,modified",
  );
  const products = simplifyProducts(prodRes.items);
  console.log(
    `Ürünler: ${products.length} (API toplam: ${prodRes.reportedTotal ?? "?"})`,
  );

  console.log("Kategoriler indiriliyor…");
  let categories = {};
  try {
    const catRes = await fetchPaged(CATEGORY_EP, "&hide_empty=false");
    categories = termsAsMap(catRes.items);
  } catch (e) {
    console.warn("Kategori indirme hatası:", e.message || e);
  }

  console.log("Markalar indiriliyor…");
  let brands = {};
  try {
    const brRes = await fetchPaged(BRAND_EP, "&hide_empty=false");
    brands = termsAsMap(brRes.items);
  } catch (e) {
    // brand taxonomy bazı kurulumlarda kayıtlı olmayabilir
    console.warn("Marka indirme atlandı:", e.message || e);
  }

  console.log("Görseller (featured media) çözümleniyor…");
  let media = {};
  try {
    media = await fetchMediaUrls(products.map((p) => p.featured_media));
  } catch (e) {
    console.warn("Görsel indirme hatası:", e.message || e);
  }

  // Her ürüne çözümlenmiş image URL eklenir.
  for (const p of products) {
    const m = media[p.featured_media];
    p.imageUrl = (m && (m.woocommerceSingleUrl || m.sourceUrl)) || null;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const payload = {
    source: HOST,
    fetchedAt: new Date().toISOString(),
    count: products.length,
    wpReportedTotal: prodRes.reportedTotal,
    wpTotalPages: prodRes.totalPages,
    categories,
    brands,
    products,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("Yazıldı:", OUT);
  console.log("Ürün sayısı:", products.length);
}

main().catch((e) => {
  console.error(e.message || e);
  if (
    String(e.message || e).includes("certificate") ||
    String(e.message || e).includes("TLS")
  ) {
    console.error(
      "\nTLS hatası: CMD'de geçici olarak\n  set PROSO_TLS_INSECURE=1\nsonra komutu tekrar çalıştırın.\n",
    );
  }
  process.exit(1);
});
