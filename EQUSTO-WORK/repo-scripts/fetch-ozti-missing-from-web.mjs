/**
 * ozti-missing-images.json → arşivde olmayan görselleri oztiryakiler.com.tr'den dene.
 *   node scripts/fetch-ozti-missing-from-web.mjs
 *   node scripts/fetch-ozti-missing-from-web.mjs --limit=20
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "public", "data", "ozti-missing-images.json");
const OUT = path.join(ROOT, "public", "data", "images");
const LOG = path.join(ROOT, "public", "data", "ozti-missing-fetch-log.json");

const insecure = process.env.OZTI_TLS_INSECURE === "1";
const limit = (() => {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1], 10) : 0;
})();

const AX = "https://oztiryakiler.com.tr/ax-images/images/";

function httpsGet(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { "User-Agent": "EqustoCatalogFetcher/1.0", Accept: "image/*" },
        rejectUnauthorized: !insecure,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            resolve(httpsGet(new URL(res.headers.location, url).href));
            return;
          }
          resolve({ status: res.statusCode || 0, buf });
        });
      },
    );
    req.on("error", () => resolve({ status: 0, buf: Buffer.alloc(0) }));
    req.setTimeout(20000, () => {
      req.destroy();
      resolve({ status: 0, buf: Buffer.alloc(0) });
    });
    req.end();
  });
}

async function tryDownload(sku, destName) {
  const code = String(sku || "").trim();
  if (!code) return null;
  for (const ext of ["jpg", "png", "jpeg"]) {
    const url = AX + code + "." + ext;
    const { status, buf } = await httpsGet(url);
    if (status === 200 && buf.length > 800) {
      const dest = path.join(OUT, destName);
      fs.writeFileSync(dest, buf);
      return { url, bytes: buf.length };
    }
  }
  return null;
}

async function main() {
  if (!fs.existsSync(REPORT)) {
    console.error("Önce: node scripts/report-ozti-missing-images.mjs");
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const todo = (report.allMissingFiles || []).filter((x) => x.status === "not-in-archive");
  const byFile = new Map();
  for (const row of todo) {
    if (!byFile.has(row.file)) byFile.set(row.file, row);
  }
  let items = [...byFile.values()];
  if (limit > 0) items = items.slice(0, limit);

  const results = { ok: [], fail: [] };
  console.log("[fetch-ozti] Denenecek benzersiz dosya:", items.length);

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    const dest = path.join(OUT, row.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      results.ok.push({ file: row.file, sku: row.sku, skipped: true });
      continue;
    }
    const hit = await tryDownload(row.sku, row.file);
    if (hit) {
      results.ok.push({ file: row.file, sku: row.sku, ...hit });
      if ((i + 1) % 10 === 0) console.log("…", i + 1, "/", items.length);
    } else {
      results.fail.push({ file: row.file, sku: row.sku, name: row.name, sourceUrl: row.sourceUrl });
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  fs.writeFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), results }, null, 2) + "\n", "utf8");
  console.log("[fetch-ozti] İndirilen:", results.ok.filter((x) => !x.skipped).length);
  console.log("[fetch-ozti] Başarısız:", results.fail.length);
  console.log("[fetch-ozti] Log:", LOG);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
