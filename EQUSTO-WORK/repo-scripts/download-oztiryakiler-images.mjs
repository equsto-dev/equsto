/**
 * oztiryakiler-wp-products.json içindeki imageUrl alanlarından görselleri indirir.
 *
 * Çıktı: public/data/oztiryakiler-images/{id}.jpg
 * JSON güncellenir: her üründe localImage (örn. /data/oztiryakiler-images/123.jpg)
 *
 * Proje kökünden:
 *   node scripts/download-oztiryakiler-images.mjs
 *   node scripts/download-oztiryakiler-images.mjs --concurrency=8 --max=100
 *
 * TLS: fetch script ile aynı — OZTI_TLS_INSECURE=1
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const JSON_PATH = path.join(ROOT, "public", "data", "oztiryakiler-wp-products.json");
const OUT_DIR = path.join(ROOT, "public", "data", "oztiryakiler-images");
const ERR_PATH = path.join(ROOT, "public", "data", "oztiryakiler-image-errors.json");

const insecure = process.env.OZTI_TLS_INSECURE === "1" || process.env.OZTI_TLS_INSECURE === "true";

function argNum(name, def) {
  const a = process.argv.find((x) => x.startsWith(name + "="));
  if (!a) return def;
  const v = parseInt(a.split("=")[1], 10);
  return Number.isFinite(v) ? v : def;
}

const concurrency = Math.max(1, Math.min(24, argNum("--concurrency", 6)));
const maxItems = argNum("--max", 0); // 0 = tümü
const minBytes = argNum("--min-bytes", 512);

function httpsGetBinary(urlStr, redirectLeft = 8) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        Accept: "image/*,*/*",
        "User-Agent": "EqustoCatalogFetcher/1.0",
        Host: u.hostname,
      },
      rejectUnauthorized: !insecure,
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const code = res.statusCode || 0;
        if ((code === 301 || code === 302 || code === 307 || code === 308) && res.headers.location) {
          if (redirectLeft <= 0) {
            reject(new Error("Çok fazla yönlendirme"));
            return;
          }
          const next = new URL(res.headers.location, urlStr).href;
          httpsGetBinary(next, redirectLeft - 1).then(resolve).catch(reject);
          return;
        }
        resolve({ statusCode: code, buffer: buf });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function poolMap(items, limit, worker) {
  const ret = new Array(items.length);
  let i = 0;
  async function run() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      ret[idx] = await worker(items[idx], idx);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return ret;
}

async function main() {
  if (insecure) {
    console.warn("[uyarı] OZTI_TLS_INSECURE=1 — TLS doğrulaması kapalı (yalnızca geliştirme).");
  }
  if (!fs.existsSync(JSON_PATH)) {
    console.error("Bulunamadı:", JSON_PATH, "\nÖnce: npm run ozti:fetch");
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const products = payload.products;
  if (!Array.isArray(products)) {
    console.error("Geçersiz JSON: products dizisi yok.");
    process.exit(1);
  }

  let list = products.filter((p) => p.imageUrl);
  if (maxItems > 0) list = list.slice(0, maxItems);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const errors = [];
  let skipped = 0;
  let ok = 0;
  let fail = 0;

  const tasks = list.map((p) => ({ p, dest: path.join(OUT_DIR, `${p.id}.jpg`) }));

  await poolMap(tasks, concurrency, async ({ p, dest }) => {
    try {
      if (fs.existsSync(dest)) {
        const st = fs.statSync(dest);
        if (st.size >= minBytes) {
          p.localImage = `/data/oztiryakiler-images/${p.id}.jpg`;
          skipped++;
          return;
        }
      }

      const { statusCode, buffer } = await httpsGetBinary(p.imageUrl);
      if (statusCode !== 200 || buffer.length < minBytes) {
        errors.push({
          id: p.id,
          slug: p.slug,
          productCode: p.productCode,
          imageUrl: p.imageUrl,
          statusCode,
          bytes: buffer.length,
        });
        fail++;
        return;
      }

      fs.writeFileSync(dest, buffer);
      p.localImage = `/data/oztiryakiler-images/${p.id}.jpg`;
      ok++;
    } catch (e) {
      errors.push({
        id: p.id,
        slug: p.slug,
        productCode: p.productCode,
        imageUrl: p.imageUrl,
        error: String(e.message || e),
      });
      fail++;
    }
  });

  for (const p of products) {
    if (!p.imageUrl && !p.localImage) continue;
    const dest = path.join(OUT_DIR, `${p.id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size >= minBytes) {
      p.localImage = `/data/oztiryakiler-images/${p.id}.jpg`;
    }
  }

  payload.imageDownloadAt = new Date().toISOString();
  payload.imageStats = {
    attempted: list.length,
    downloadedOk: ok,
    skippedExisting: skipped,
    failed: fail,
    missingImageUrl: products.filter((x) => !x.imageUrl).length,
  };

  fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), "utf8");
  fs.writeFileSync(ERR_PATH, JSON.stringify(errors, null, 2), "utf8");

  console.log("Görseller:", OUT_DIR);
  console.log("İstatistik:", payload.imageStats);
  console.log("Hatalar:", errors.length, "→", ERR_PATH);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
