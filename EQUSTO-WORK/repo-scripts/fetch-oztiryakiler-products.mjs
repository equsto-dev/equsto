/**
 * oztiryakiler.com.tr — WordPress ürün REST çıktısını sayfa sayfa indirir.
 *
 * Kaynak: GET https://www.oztiryakiler.com.tr/wp-json/wp/v2/product?per_page=...&page=...
 *
 * Kullanım (proje kökünden):
 *   node scripts/fetch-oztiryakiler-products.mjs
 *   node scripts/fetch-oztiryakiler-products.mjs --max-pages=2   (deneme: 2 sayfa)
 *
 * Her ürün için REST içeriğinden "Product Code" okunur; görsel URL şu desenle üretilir:
 *   https://oztiryakiler.com.tr/ax-images/images/{ProductCode}.jpg
 * Toplu indirme: npm run ozti:images
 *
 * TLS hatası (kurumsal proxy / eksik zincir) için geçici:
 *   set OZTI_TLS_INSECURE=1   (Windows CMD)
 *   $env:OZTI_TLS_INSECURE='1'   (PowerShell)
 *
 * Not: Toplu veri ticari kullanım, görseller ve metinler için Öztiryakiler izin /
 * kullanım koşulları geçerlidir; bu script yalnızca teknik erişim sağlar.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const BASE = "https://www.oztiryakiler.com.tr/wp-json/wp/v2/product";
const PER_PAGE = 50;
const OUT = path.join(ROOT, "public", "data", "oztiryakiler-wp-products.json");

function argNum(name, def) {
  const a = process.argv.find((x) => x.startsWith(name + "="));
  if (!a) return def;
  const v = parseInt(a.split("=")[1], 10);
  return Number.isFinite(v) ? v : def;
}

const maxPages = argNum("--max-pages", 0); // 0 = tüm sayfalar

const insecure = process.env.OZTI_TLS_INSECURE === "1" || process.env.OZTI_TLS_INSECURE === "true";

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
        if ((code === 301 || code === 302 || code === 307 || code === 308) && res.headers.location) {
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

const AX_IMAGE_BASE = "https://oztiryakiler.com.tr/ax-images/images/";

/** WordPress ürün tablosundan ürün kodunu çıkarır (Product Code / Ürün Kodu). */
function parseProductCodeFromContent(contentRendered) {
  if (!contentRendered || typeof contentRendered !== "string") return null;
  const m =
    contentRendered.match(/<th>\s*Product Code\s*<\/th>\s*<td>\s*([^<]+?)\s*<\/td>/i) ||
    contentRendered.match(/<th>\s*Ürün Kodu\s*<\/th>\s*<td>\s*([^<]+?)\s*<\/td>/i);
  if (!m) return null;
  const code = m[1].replace(/\s+/g, "").trim();
  return code.length ? code : null;
}

function simplify(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const contentRendered = p.content && p.content.rendered;
    const productCode = parseProductCodeFromContent(contentRendered);
    const imageUrl = productCode ? AX_IMAGE_BASE + productCode + ".jpg" : null;
    return {
      id: p.id,
      slug: p.slug,
      link: p.link,
      title: p.title && p.title.rendered,
      excerpt: p.excerpt && p.excerpt.rendered,
      product_cat: p.product_cat,
      featured_media: p.featured_media,
      date: p.date,
      productCode,
      imageUrl,
    };
  });
}

async function main() {
  if (insecure) {
    console.warn("[uyarı] OZTI_TLS_INSECURE=1 — TLS doğrulaması kapalı (yalnızca geliştirme).");
  }

  const all = [];
  let page = 1;
  let totalPages = 1;
  let wpReportedTotal = null;
  let wpTotalPages = null;

  for (;;) {
    const url = `${BASE}?per_page=${PER_PAGE}&page=${page}&_fields=id,slug,link,title,excerpt,product_cat,featured_media,date,content`;
    process.stderr.write(`Sayfa ${page} indiriliyor…\n`);
    const { json, headers } = await httpsGetJson(url);
    const batch = Array.isArray(json) ? json : [];
    if (batch.length === 0) break;

    all.push(...simplify(batch));

    const tp = parseInt(headers["x-wp-totalpages"] || "1", 10);
    totalPages = Number.isFinite(tp) ? tp : 1;
    if (page === 1) {
      const tt = parseInt(headers["x-wp-total"] || "0", 10);
      wpReportedTotal = Number.isFinite(tt) && tt > 0 ? tt : null;
      wpTotalPages = totalPages;
      if (wpReportedTotal != null) {
        console.log(`API bildirimi: ${wpReportedTotal} ürün, ${wpTotalPages} sayfa.`);
      }
    }

    if (maxPages > 0 && page >= maxPages) break;
    if (page >= totalPages) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const payload = {
    fetchedAt: new Date().toISOString(),
    count: all.length,
    products: all,
  };
  if (wpReportedTotal != null) payload.wpReportedTotal = wpReportedTotal;
  if (wpTotalPages != null) payload.wpTotalPages = wpTotalPages;
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("Yazıldı:", OUT);
  console.log("Ürün sayısı:", all.length);
}

main().catch((e) => {
  console.error(e.message || e);
  if (String(e.message || e).includes("certificate") || String(e.message || e).includes("TLS")) {
    console.error("\nTLS hatası: CMD'de geçici olarak\n  set OZTI_TLS_INSECURE=1\nsonra komutu tekrar çalıştırın.\n");
  }
  process.exit(1);
});
