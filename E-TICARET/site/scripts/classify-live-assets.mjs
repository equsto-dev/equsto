/**
 * Adım 2 — Git / CDN / Repodan çıkar sınıflandırması
 *   node scripts/classify-live-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteDir, "../..");
const publicDir = path.join(siteDir, "public");

const CDN_THRESHOLD_MB = 1;
const REMOVE_PATTERNS = [
  /^data\/ekipmanlar\.json\.legacy-off$/,
  /^data\/ekipmanlar-full-archive\.json$/,
  /^data\/pfos-archive-extract\.json$/,
  /^data\/admin-auth\.json$/,
  /^data\/atalay-merge-log\.json$/,
  // *-KILIT.txt → GIT_KEEP (vercel-prebuild verify scriptleri)
];

const CDN_PREFIXES = [
  "images/",
  "data/caglayan-market/",
  "data/prosogutma-market/",
  "data/vitrum-drawings/",
  "data/advanced-cuisine-clear-ice/images/",
  "data/electrolux-professional/",
];

const GIT_DATA_KEEP = new Set([
  "data/ekipmanlar.json",
  "data/geo-landings.json",
  "data/geo-landings-en.json",
  "data/proje-akis.json",
  "data/fiyatlar.json",
  "data/tr-adres.json",
  "data/markalarimiz-brands.json",
  "data/homepage-vitrin.json",
  "data/footer-vitrin.json",
  "data/category-covers.json",
  "data/equsto-eur-try-rate.json",
  "data/pfos-referans",
  "data/dept",
  "data/referans-pilot",
]);

function walkPublic(dir, base = publicDir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPublic(p, base, out);
    else out.push({ rel: path.relative(base, p).replace(/\\/g, "/"), bytes: fs.statSync(p).size });
  }
  return out;
}

function loadCatalogPaths() {
  const refs = new Set();
  const p = path.join(publicDir, "data/ekipmanlar.json");
  if (!fs.existsSync(p)) return refs;
  const text = fs.readFileSync(p, "utf8");
  const re = /(?:\/|^)((?:images|data)\/[a-zA-Z0-9_\-./%]+?\.(?:jpg|jpeg|png|webp|gif|pdf|svg))/gi;
  let m;
  while ((m = re.exec(text))) refs.add(m[1].replace(/^\/+/, ""));
  return refs;
}

function bucketFile(rel, bytes, catalogRefs) {
  if (REMOVE_PATTERNS.some((re) => re.test(rel))) {
    return "REPO_REMOVE";
  }
  if (rel.endsWith(".legacy-off") || rel.includes("-archive.")) {
    return "REPO_REMOVE";
  }
  // kök legacy JS/CSS — Git
  if (!rel.includes("/") && /\.(js|css|html|txt|xml|svg|png|jpg|webp|json)$/i.test(rel)) {
    if (rel.startsWith("sitemap") || rel.startsWith("eq-") || rel.endsWith(".js") || rel.endsWith(".css")) {
      return "GIT_KEEP";
    }
  }
  if (rel.startsWith("i18n/") || rel.startsWith("partials/") || rel.startsWith("assets/")) {
    return "GIT_KEEP";
  }
  if (rel.startsWith("shop/")) return "GIT_KEEP";

  if (rel.startsWith("images/")) return "CDN_MIGRATE";

  for (const prefix of CDN_PREFIXES) {
    if (prefix === "images/") continue;
    if (rel.startsWith(prefix)) return "CDN_MIGRATE";
  }

  if (rel.startsWith("data/")) {
    const top = rel.split("/").slice(0, 2).join("/");
    if (GIT_DATA_KEEP.has(top) || GIT_DATA_KEEP.has(rel)) return "GIT_KEEP";
    if (rel.endsWith(".pdf") || bytes > CDN_THRESHOLD_MB * 1048576) return "CDN_MIGRATE";
    return "GIT_KEEP";
  }

  return bytes > 5 * 1048576 ? "CDN_MIGRATE" : "GIT_KEEP";
}

function sumBucket(files) {
  return {
    count: files.length,
    mb: +(files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1),
  };
}

const publicFiles = walkPublic(publicDir);
const catalogRefs = loadCatalogPaths();
const buckets = { GIT_KEEP: [], CDN_MIGRATE: [], REPO_REMOVE: [] };

for (const f of publicFiles) {
  const b = bucketFile(f.rel, f.bytes, catalogRefs);
  buckets[b].push(f);
}

const repoOutside = [];
function scanRepoPath(relPath, label) {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) return null;
  let count = 0;
  let bytes = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        count++;
        bytes += fs.statSync(p).size;
      }
    }
  };
  walk(abs);
  return { label, path: relPath, count, mb: +(bytes / 1048576).toFixed(1), action: "REPO_REMOVE" };
}

for (const p of [
  ["EQUSTO-WORK/E-TICARET/site", "Workspace mirror (deploy kökü değil)"],
  ["EQUSTO-WORK/PFOS/kaynaklar", "PFOS kaynak arşivi (.dwg, .bak, Excel)"],
  ["equsto-v2", "Eski alternatif site"],
  ["E-TICARET/veri", "Kaynak medya (prosogutma vb.)"],
]) {
  const r = scanRepoPath(p[0], p[1]);
  if (r) repoOutside.push(r);
}

const report = {
  generatedAt: new Date().toISOString(),
  catalogImageRefs: catalogRefs.size,
  public: {
    GIT_KEEP: sumBucket(buckets.GIT_KEEP),
    CDN_MIGRATE: sumBucket(buckets.CDN_MIGRATE),
    REPO_REMOVE: sumBucket(buckets.REPO_REMOVE),
  },
  repoOutsideSite: repoOutside,
  topCdnMigrate: buckets.CDN_MIGRATE.sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20)
    .map((f) => ({ rel: f.rel, mb: +(f.bytes / 1048576).toFixed(2) })),
  topRepoRemove: buckets.REPO_REMOVE.sort((a, b) => b.bytes - a.bytes)
    .slice(0, 15)
    .map((f) => ({ rel: f.rel, mb: +(f.bytes / 1048576).toFixed(2) })),
  recommendations: {
    phaseA: [
      "Repodan çıkar: mirror, PFOS arşiv, legacy-off/full-archive JSON, KILIT.txt dosyaları",
      ".gitignore güncelle; git rm --cached ile history'den kademeli temizlik (opsiyonel git filter-repo)",
    ],
    phaseB: [
      "CDN (Vercel Blob / R2): public/images/ (~1.5 GB) + büyük PDF klasörleri",
      "ekipmanlar.json içindeki image path'leri CDN base URL ile güncelle",
    ],
    phaseC: [
      "Git'te kal: app/, lib/, legacy JS/CSS, ekipmanlar.json, geo/proje-akis/i18n, küçük data JSON",
      "Build çıktıları: sitemap, en.json — commit veya CI artifact",
    ],
  },
};

const outJson = path.join(siteDir, "docs/asset-classification-step2.json");
const outMd = path.join(siteDir, "docs/ASSET-CLASSIFICATION-STEP2.md");

const md = `# Adım 2 — Git / CDN / Repodan çıkar

Oluşturulma: ${report.generatedAt}

Katalog JSON'dan tespit edilen görsel/PDF yolu: **${report.catalogImageRefs}**

## public/ sınıflandırması (${publicFiles.reduce((s,f)=>s+f.bytes,0)/1048576|0} MB toplam)

| Sepet | Dosya | MB | Açıklama |
|-------|------:|---:|----------|
| **GIT_KEEP** (Vercel deploy) | ${report.public.GIT_KEEP.count} | ${report.public.GIT_KEEP.mb} | Kod, legacy JS/CSS, kritik JSON, i18n, sitemap |
| **CDN_MIGRATE** | ${report.public.CDN_MIGRATE.count} | ${report.public.CDN_MIGRATE.mb} | images/ + büyük PDF/medya — object storage'a taşınacak |
| **REPO_REMOVE** | ${report.public.REPO_REMOVE.count} | ${report.public.REPO_REMOVE.mb} | Yedek/arşiv/kilit dosyaları — repoda tutulmamalı |

## Repoda var, canlı deploy dışı (çıkarılacak)

| Yol | Dosya | MB | Not |
|-----|------:|---:|-----|
${repoOutside.map((r) => `| \`${r.path}\` | ${r.count} | ${r.mb} | ${r.label} |`).join("\n")}

## CDN'e taşınacak — en büyük 20 dosya

${report.topCdnMigrate.map((f) => `- \`${f.rel}\` (${f.mb} MB)`).join("\n")}

## Repodan çıkar — public içi (ilk 15)

${report.topRepoRemove.map((f) => `- \`${f.rel}\` (${f.mb} MB)`).join("\n")}

## Uygulama fazları

### Faz A — Hemen (risk düşük, repo küçülür ~${repoOutside.reduce((s,r)=>s+r.mb,0).toFixed(0)}+ MB dış klasör)
${report.recommendations.phaseA.map((x) => `- ${x}`).join("\n")}

### Faz B — CDN (canlı davranış değişir, URL migration gerekir)
${report.recommendations.phaseB.map((x) => `- ${x}`).join("\n")}

### Faz C — Git'te kalır (değişmez)
${report.recommendations.phaseC.map((x) => `- ${x}`).join("\n")}

---
JSON: \`docs/asset-classification-step2.json\`
`;

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(outMd, md);
console.log("[classify] wrote", outMd);
console.log(JSON.stringify(report.public, null, 2));
console.log("repoOutside MB:", repoOutside.reduce((s, r) => s + r.mb, 0).toFixed(1));
