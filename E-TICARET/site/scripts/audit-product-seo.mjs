/**
 * FAZ 1 — Ürün teknik SEO audit
 *   node scripts/audit-product-seo.mjs
 *   node scripts/audit-product-seo.mjs --sample=200
 *   node scripts/audit-product-seo.mjs --live --sample=100   # HTTP + JSON-LD örneklem
 *   node scripts/audit-product-seo.mjs --live --concurrency=8
 *
 * Offline: katalog alanları, slug, duplicate title, breadcrumb path tahmini
 * Live (--live): sitemap ürün URL örneklemesi → HTTP + canonical + Product/Breadcrumb JSON-LD
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ORIGIN,
  SHOP_DEPTS,
  catalogSlug,
  loadEkipmanlar,
  productPageUrl,
  resolveDept,
} from "./lib/sitemap-entities.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts", "out");
const ORIGIN_LIVE = process.env.SEO_AUDIT_ORIGIN || ORIGIN;

function argInt(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const n = Number(hit.split("=")[1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const LIVE = process.argv.includes("--live");
const SAMPLE = argInt("sample", LIVE ? 120 : 0);
const CONCURRENCY = argInt("concurrency", 6);

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(file, header, rows) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const lines = [header.join(",")];
  for (const r of rows) lines.push(header.map((h) => csvEscape(r[h])).join(","));
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
}

function simulateTitle(row) {
  const name = String(row.name || "").trim().replace(/\.$/, "");
  const brand = String(row.brand || "").trim();
  const sku = String(row.sku || row.id || row.model || row.urun_kodu || "").trim();
  const brandShort = brand.split(/\s+/)[0] || brand;
  let core = name;
  if (
    brandShort &&
    !core.toLocaleLowerCase("tr-TR").includes(brandShort.toLocaleLowerCase("tr-TR"))
  ) {
    core = `${brandShort} ${core}`;
  }
  const suffix = " | Equsto";
  const reservedCode = sku ? ` · ${sku}` : "";
  const maxCore = Math.max(20, 70 - suffix.length - reservedCode.length);
  if (core.length > maxCore) core = `${core.slice(0, maxCore - 1).trimEnd()}…`;
  const finalCode =
    sku && !core.toLocaleLowerCase("tr-TR").includes(sku.toLocaleLowerCase("tr-TR"))
      ? ` · ${sku}`
      : "";
  return `${core}${finalCode}${suffix}`;
}

function pickSample(urls, n) {
  if (!n || n >= urls.length) return urls;
  const step = Math.max(1, Math.floor(urls.length / n));
  const out = [];
  for (let i = 0; i < urls.length && out.length < n; i += step) out.push(urls[i]);
  return out;
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      /* ignore */
    }
  }
  return blocks;
}

function flattenGraph(blocks) {
  const nodes = [];
  for (const b of blocks) {
    if (!b) continue;
    if (Array.isArray(b)) nodes.push(...b);
    else if (b["@graph"]) nodes.push(...b["@graph"]);
    else nodes.push(b);
  }
  return nodes;
}

function findType(nodes, type) {
  return nodes.find((n) => {
    const t = n["@type"];
    if (Array.isArray(t)) return t.includes(type);
    return t === type;
  });
}

function breadcrumbOk(node) {
  if (!node) return false;
  const els = node.itemListElement;
  if (!Array.isArray(els) || !els.length) return false;
  return els.every((el) => {
    const item = el.item;
    if (!item) return false;
    if (typeof item === "string") return item.startsWith("http");
    return Boolean(item["@id"] || item.id || item.url || item.name);
  });
}

async function auditLiveUrl(url) {
  const row = {
    url,
    http: "",
    finalUrl: "",
    canonical: "",
    canonicalSelf: "",
    hasProduct: "",
    hasOffer: "",
    offerPrice: "",
    hasBreadcrumb: "",
    breadcrumbItemOk: "",
    error: "",
  };
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "EqustoProductSeoAudit/1.0" },
      signal: AbortSignal.timeout(25000),
    });
    row.http = String(res.status);
    row.finalUrl = res.url;
    const html = await res.text();
    const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    row.canonical = canon?.[1] || "";
    const clean = row.finalUrl.split("?")[0].replace(/\/$/, "");
    const canClean = row.canonical.split("?")[0].replace(/\/$/, "");
    row.canonicalSelf = row.canonical ? String(clean === canClean) : "missing";

    const nodes = flattenGraph(extractJsonLdBlocks(html));
    const product = findType(nodes, "Product");
    const crumb = findType(nodes, "BreadcrumbList");
    row.hasProduct = String(Boolean(product));
    row.hasBreadcrumb = String(Boolean(crumb));
    row.breadcrumbItemOk = String(breadcrumbOk(crumb));
    if (product?.offers) {
      const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      row.hasOffer = "true";
      row.offerPrice = offers?.price != null ? String(offers.price) : "";
    } else {
      row.hasOffer = "false";
    }
  } catch (e) {
    row.error = e instanceof Error ? e.message : String(e);
    row.http = row.http || "ERR";
  }
  return row;
}

function offlineAudit(rows) {
  const findings = [];
  const titleMap = new Map();
  let missingBrand = 0;
  let missingImage = 0;
  let missingSlug = 0;
  let missingName = 0;
  let badDept = 0;
  const urls = [];

  for (const row of rows) {
    const name = String(row.name || "").trim();
    const dept = resolveDept(row);
    const slug = catalogSlug(row);
    const tr = productPageUrl(row, "");
    if (tr) urls.push(tr);

    if (!name) {
      missingName += 1;
      findings.push({ severity: "error", code: "missing_name", sku: row.sku || "", detail: "name boş" });
    }
    if (!slug) {
      missingSlug += 1;
      findings.push({ severity: "error", code: "missing_slug", sku: row.sku || name, detail: "slug yok" });
    }
    if (!SHOP_DEPTS.includes(dept)) {
      badDept += 1;
      findings.push({
        severity: "warn",
        code: "bad_dept",
        sku: row.sku || slug,
        detail: `dept=${dept}`,
      });
    }
    if (!row.brand) missingBrand += 1;
    if (!row.images || !row.images.length) missingImage += 1;

    if (name) {
      const title = simulateTitle(row);
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title).push(slug || row.sku || "?");
    }
  }

  const dupTitles = [...titleMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  return {
    urls,
    missingBrand,
    missingImage,
    missingSlug,
    missingName,
    badDept,
    dupTitles,
    findings,
  };
}

async function main() {
  console.log("[seo:product-audit] loading catalog…");
  const PUBLIC = path.join(ROOT, "public");
  const rows = loadEkipmanlar(PUBLIC);
  const shopRows = rows.filter((r) => SHOP_DEPTS.includes(resolveDept(r)));
  const off = offlineAudit(shopRows);

  const summary = {
    generatedAt: new Date().toISOString(),
    origin: ORIGIN_LIVE,
    catalogRows: rows.length,
    shopRows: shopRows.length,
    productUrls: off.urls.length,
    offline: {
      missingName: off.missingName,
      missingSlug: off.missingSlug,
      missingBrand: off.missingBrand,
      missingImage: off.missingImage,
      badDept: off.badDept,
      duplicateTitles: off.dupTitles.length,
    },
    live: null,
  };

  writeCsv(
    path.join(OUT_DIR, "product-seo-duplicate-titles.csv"),
    ["count", "title", "slugs"],
    off.dupTitles.slice(0, 500).map(([title, slugs]) => ({
      count: slugs.length,
      title,
      slugs: slugs.slice(0, 12).join("|"),
    })),
  );

  writeCsv(
    path.join(OUT_DIR, "product-seo-offline-findings.csv"),
    ["severity", "code", "sku", "detail"],
    off.findings.slice(0, 5000),
  );

  if (LIVE) {
    const sampleUrls = pickSample(off.urls, SAMPLE || 120).map((u) =>
      u.replace(ORIGIN, ORIGIN_LIVE),
    );
    console.log(`[seo:product-audit] live sample=${sampleUrls.length} concurrency=${CONCURRENCY}`);
    const liveRows = await mapPool(sampleUrls, CONCURRENCY, (url) => auditLiveUrl(url));
    writeCsv(
      path.join(OUT_DIR, "product-seo-live-sample.csv"),
      [
        "url",
        "http",
        "finalUrl",
        "canonical",
        "canonicalSelf",
        "hasProduct",
        "hasOffer",
        "offerPrice",
        "hasBreadcrumb",
        "breadcrumbItemOk",
        "error",
      ],
      liveRows,
    );

    const httpBad = liveRows.filter((r) => r.http !== "200").length;
    const canonBad = liveRows.filter((r) => r.canonicalSelf === "false" || r.canonicalSelf === "missing").length;
    const noProduct = liveRows.filter((r) => r.hasProduct === "false").length;
    const crumbBad = liveRows.filter((r) => r.breadcrumbItemOk === "false").length;
    summary.live = {
      sample: liveRows.length,
      httpNot200: httpBad,
      canonicalIssues: canonBad,
      missingProductJsonLd: noProduct,
      breadcrumbIssues: crumbBad,
    };
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summaryPath = path.join(OUT_DIR, "product-seo-audit-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  console.log("[seo:product-audit] summary", JSON.stringify(summary, null, 2));
  console.log(`[seo:product-audit] → ${summaryPath}`);
  console.log(`[seo:product-audit] → ${path.join(OUT_DIR, "product-seo-duplicate-titles.csv")}`);
  if (LIVE) console.log(`[seo:product-audit] → ${path.join(OUT_DIR, "product-seo-live-sample.csv")}`);

  const hard =
    summary.offline.missingSlug > 0 ||
    summary.offline.missingName > 0 ||
    (summary.live &&
      (summary.live.httpNot200 > 0 ||
        summary.live.missingProductJsonLd > Math.max(2, summary.live.sample * 0.05)));
  process.exit(hard ? 1 : 0);
}

main().catch((e) => {
  console.error("[seo:product-audit]", e);
  process.exit(1);
});
