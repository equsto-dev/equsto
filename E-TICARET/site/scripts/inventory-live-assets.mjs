/**
 * Canlı sitede kullanılan / kullanılmayan malzeme envanteri.
 *   node scripts/inventory-live-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(siteDir, "public");

const SCAN_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".html", ".json", ".md",
]);
const SKIP_DIR = new Set([
  "node_modules", ".next", ".git", "prisma/generated", "dist", "coverage",
]);

/** Kodda geçen /public yolları */
const PATH_RE =
  /(?:["'`(]|url\()\/?((?:data|images|assets|shop|i18n|docs|partials|feeds)[/][^"'`\s)]+)/gi;

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, out);
    else if (SCAN_EXT.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}

function walkPublic(dir, base = publicDir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPublic(p, base, out);
    else {
      const st = fs.statSync(p);
      out.push({
        rel: path.relative(base, p).replace(/\\/g, "/"),
        bytes: st.size,
      });
    }
  }
  return out;
}

function topFolder(rel) {
  return rel.includes("/") ? rel.split("/")[0] : rel;
}

function secondLevel(rel) {
  const parts = rel.split("/");
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

function addRef(refs, raw) {
  let s = String(raw || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  if (!s || s.startsWith("http")) return;
  refs.add(s);
}

// --- public envanter ---
const publicFiles = walkPublic(publicDir);
const byTop = {};
const byDataSub = {};
for (const f of publicFiles) {
  const top = topFolder(f.rel);
  byTop[top] = byTop[top] || { count: 0, bytes: 0 };
  byTop[top].count++;
  byTop[top].bytes += f.bytes;
  if (top === "data") {
    const sub = secondLevel(f.rel);
    byDataSub[sub] = byDataSub[sub] || { count: 0, bytes: 0 };
    byDataSub[sub].count++;
    byDataSub[sub].bytes += f.bytes;
  }
}

// --- kod referansları ---
const refs = new Set();
const sourceFiles = walkFiles(siteDir).filter(
  (p) => !p.includes(`${path.sep}public${path.sep}`)
);
for (const file of sourceFiles) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  let m;
  PATH_RE.lastIndex = 0;
  while ((m = PATH_RE.exec(text))) addRef(refs, m[1]);
  // kök public JS dosyaları (/eq-*.js)
  const jsRe = /["'`]\/(eq-[a-z0-9-]+\.js[^"'`]*)["'`]/gi;
  while ((m = jsRe.exec(text))) addRef(refs, m[1]);
  const cssRe = /["'`]\/([a-z0-9-]+\.css[^"'`]*)["'`]/gi;
  while ((m = cssRe.exec(text))) {
    const v = m[1];
    if (v.startsWith("eq-") || v.includes("theme") || v.includes("contact")) addRef(refs, v);
  }
}

// public içi cross-ref (legacy JS)
for (const file of walkFiles(publicDir)) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  let m;
  PATH_RE.lastIndex = 0;
  while ((m = PATH_RE.exec(text))) addRef(refs, m[1]);
}

// --- eşleşme ---
const publicSet = new Set(publicFiles.map((f) => f.rel));
const referenced = [];
const unreferenced = [];
for (const f of publicFiles) {
  const hit =
    refs.has(f.rel) ||
    [...refs].some((r) => f.rel.startsWith(r) || r.startsWith(f.rel));
  (hit ? referenced : unreferenced).push(f);
}

function sum(list) {
  return {
    count: list.length,
    mb: +(list.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1),
  };
}

const largeUnref = unreferenced
  .filter((f) => f.bytes > 500_000)
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 30)
  .map((f) => ({ rel: f.rel, mb: +(f.bytes / 1048576).toFixed(2) }));

const buildGenerated = [
  "i18n/en.json (scripts/build-i18n-en.mjs)",
  "i18n/pfos-labels-en.json (scripts/build-pfos-labels-en.mjs)",
  "data/geo-landings-en.json (scripts/build-geo-landings-en.mjs)",
  "lib/pfos/data/*.json → public/data (vercel-prebuild sync)",
  "sitemap*.xml (scripts/build-sitemap.mjs)",
];

const runtimeOnly = [
  "DATABASE_URL / DIRECT_URL (Vercel env)",
  "Meilisearch (MEILI_* env, varsa)",
  "Admin bearer / cron secret (Vercel env)",
  "Harici CDN: vitrum JSON (Besos modul PDP fetch)",
];

const repoOutsideSite = [
  "EQUSTO-WORK/E-TICARET/site/ — mirror kopya, Vercel root DEĞİL",
  "EQUSTO-WORK/PFOS/kaynaklar/ — arşiv (.dwg, .bak, Excel)",
  "E-TICARET/veri/ — kaynak medya (prosogutma vb.)",
  "equsto-v2/ — eski/alternatif site",
  "dokuman/, veri/ (repo kökü) — dokümantasyon",
];

const report = {
  generatedAt: new Date().toISOString(),
  siteRoot: siteDir,
  deployRoot: "E-TICARET/site (Vercel Root Directory)",
  public: {
    totalFiles: publicFiles.length,
    totalMB: +(publicFiles.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1),
    byTopFolder: Object.entries(byTop)
      .map(([k, v]) => ({ folder: k, files: v.count, mb: +(v.bytes / 1048576).toFixed(1) }))
      .sort((a, b) => b.mb - a.mb),
    dataSubfolders: Object.entries(byDataSub)
      .map(([k, v]) => ({ path: k, files: v.count, mb: +(v.bytes / 1048576).toFixed(1) }))
      .sort((a, b) => b.mb - a.mb)
      .slice(0, 25),
  },
  codeReferences: {
    uniquePaths: refs.size,
    sample: [...refs].sort().slice(0, 40),
  },
  usageEstimate: {
    referenced: sum(referenced),
    unreferenced: sum(unreferenced),
    note: "Kaba tarama — dinamik URL, DB slug ve runtime birleştirme kaçabilir",
  },
  largeUnreferencedFiles: largeUnref,
  buildTimeGenerated: buildGenerated,
  runtimeNotInGit: runtimeOnly,
  repoNotDeployed: repoOutsideSite,
  criticalLiveAssets: [
    { path: "public/data/ekipmanlar.json", role: "Ana katalog (~17 MB)", inGit: true },
    { path: "public/data/geo-landings*.json", role: "GEO landing SSR", inGit: true },
    { path: "public/i18n/*.json", role: "TR/EN çeviri", inGit: true },
    { path: "public/images/", role: "Ürün/vitrin görselleri", inGit: true },
    { path: "public/eq-*.js, theme.js, nav.js", role: "Legacy vitrin/PLP/PDP", inGit: true },
    { path: "lib/vitrin/bodies/*.ts", role: "PFOS/home HTML gövdeleri", inGit: true },
    { path: "app/", role: "Next.js sayfalar + API", inGit: true },
  ],
};

const outJson = path.join(siteDir, "docs/inventory-live-assets.json");
const outMd = path.join(siteDir, "docs/INVENTORY-LIVE-ASSETS.md");
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + "\n");

const md = `# Equsto — Canlı malzeme envanteri

Oluşturulma: ${report.generatedAt}

## Deploy kaynağı
- **Canlı kök:** \`E-TICARET/site\` → Vercel → equsto.com
- **public/ toplam:** ${report.public.totalFiles} dosya, **${report.public.totalMB} MB**

## public/ klasör dağılımı

| Klasör | Dosya | MB |
|--------|------:|---:|
${report.public.byTopFolder.map((r) => `| \`${r.folder}/\` | ${r.files} | ${r.mb} |`).join("\n")}

## public/data/ alt klasörler (ilk 25)

| Yol | Dosya | MB |
|-----|------:|---:|
${report.public.dataSubfolders.map((r) => `| \`${r.path}\` | ${r.files} | ${r.mb} |`).join("\n")}

## Kod referans taraması (kaba)
- Benzersiz public yol referansı: **${report.codeReferences.uniquePaths}**
- Referanslı (tahmini): **${report.usageEstimate.referenced.count}** dosya, ${report.usageEstimate.referenced.mb} MB
- Referanssız (tahmini): **${report.usageEstimate.unreferenced.count}** dosya, ${report.usageEstimate.unreferenced.mb} MB
- _${report.usageEstimate.note}_

## Kritik canlı varlıklar
${report.criticalLiveAssets.map((a) => `- \`${a.path}\` — ${a.role}`).join("\n")}

## Build sırasında üretilen (Git'te commit edilebilir)
${report.buildTimeGenerated.map((x) => `- ${x}`).join("\n")}

## Git'te olmaması gereken (runtime)
${report.runtimeNotInGit.map((x) => `- ${x}`).join("\n")}

## Repoda var, canlıda deploy edilmeyen
${report.repoNotDeployed.map((x) => `- ${x}`).join("\n")}

## Büyük referanssız dosyalar (>500 KB, ilk 30)
${report.largeUnreferencedFiles.length ? report.largeUnreferencedFiles.map((f) => `- \`${f.rel}\` (${f.mb} MB)`).join("\n") : "_Yok_"}

---
Tam JSON: \`docs/inventory-live-assets.json\`
`;

fs.writeFileSync(outMd, md);
console.log("[inventory] wrote", outMd);
console.log("[inventory] wrote", outJson);
console.log(JSON.stringify({ publicMB: report.public.totalMB, byTop: report.public.byTopFolder.slice(0, 8), ref: report.usageEstimate }, null, 2));
