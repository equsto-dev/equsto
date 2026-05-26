import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEPT_PLP_HTML,
  injectDeptPlpInlineCss,
} from "./dept-plp-inline-css.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "data");
const dst = path.join(root, "dist", "data");

/** Canlı zip (pack-canli-site) zaten data/images + oztiryakiler-images hariç; ayrı deploy:data-images zip. */
const HEAVY_DATA_DIRS = new Set(["images", "oztiryakiler-images"]);
const INCLUDE_HEAVY_DATA =
  process.env.EQUSTO_COPY_DATA_INCLUDE_IMAGES === "1" &&
  process.env.EQUSTO_COPY_DATA_SKIP_IMAGES !== "1";
const SKIP_HEAVY_DATA =
  !INCLUDE_HEAVY_DATA ||
  process.env.EQUSTO_COPY_DATA_SKIP_IMAGES === "1";

if (fs.existsSync(src)) {
  try {
    fs.mkdirSync(dst, { recursive: true });
    const cpOpts = {
      recursive: true,
      filter(s) {
        if (!SKIP_HEAVY_DATA) return true;
        const rel = path.relative(src, s);
        if (!rel || rel === ".") return true;
        const top = rel.split(path.sep)[0];
        return !HEAVY_DATA_DIRS.has(top);
      },
    };
    fs.cpSync(src, dst, cpOpts);
    const skipNote = SKIP_HEAVY_DATA
      ? " (data/images + data/oztiryakiler-images atlandı — deploy:data-images / EQUSTO_COPY_DATA_INCLUDE_IMAGES=1)"
      : "";
    console.log("[copy-data-to-dist] public/data → dist/data kopyalandı." + skipNote);
  } catch (e) {
    if (e && (e.code === "ENOSPC" || e.code === "EINPROGRESS")) {
      console.error(
        "[copy-data-to-dist] Disk dolu — dist veya gereksiz kopyayı silin ya da daha büyük sürücüye taşıyın.",
        '\nÖrnek: Remove-Item -Recurse -Force dist ; $env:EQUSTO_COPY_DATA_SKIP_IMAGES="1"; npm run build'
      );
    }
    throw e;
  }
} else {
  console.warn("[copy-data-to-dist] public/data yok, atlanıyor.");
}

// SEO statikleri: vite root=public oldugunda publicDir tanimsiz, bu dosyalar dist'e
// otomatik kopyalanmaz. Burada elle kopyaliyoruz.
const seoFiles = [
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "og-cover.jpg",
  "llms.txt",
  "llms-full.txt",
  "eq-pfos-programmatic-seo.js",
  "eq-analytics.js",
  "bulut-mutfak-kurulumu.html",
  "cafe-kurulumu.html",
  "catering-mutfagi.html",
  "fine-dining-kurulumu.html",
  "all-day-dining-kurulumu.html",
  "fast-food-kurulumu.html",
];
for (const name of seoFiles) {
  const s = path.join(root, "public", name);
  const d = path.join(root, "dist", name);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`[copy-data-to-dist] public/${name} → dist/${name} kopyalandı.`);
  } else {
    console.warn(`[copy-data-to-dist] public/${name} yok, atlanıyor.`);
  }
}

const publicRoot = path.join(root, "public");
const distRoot = path.join(root, "dist");

/** Vite MPA çıktısı HTML'de /theme.js, /nav.js vb. kök yollar bırakır; bu dosyalar dist'e otomatik düşmez. */
for (const ent of fs.readdirSync(publicRoot, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  const n = ent.name;
  if (n.endsWith(".js")) {
    const s = path.join(publicRoot, n);
    const d = path.join(distRoot, n);
    fs.copyFileSync(s, d);
    console.log(`[copy-data-to-dist] public/${n} → dist/${n} kopyalandı.`);
  }
}
// file:// uyari scripti (dist'te de olsun)
const guardSrc = path.join(publicRoot, "eq-file-protocol-guard.js");
if (fs.existsSync(guardSrc)) {
  fs.copyFileSync(guardSrc, path.join(distRoot, "eq-file-protocol-guard.js"));
}

for (const name of [
  "theme.css",
  "contact.css",
  "bar-module.css",
  "auth.css",
  "eq-youtube-embed.css",
  "eq-home-mutbex.css",
  "eq-dept-plp.css",
]) {
  const s = path.join(publicRoot, name);
  const d = path.join(distRoot, name);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`[copy-data-to-dist] public/${name} → dist/${name} kopyalandı.`);
  }
}

for (const name of ["logo-v2.png", "equsto-bize-ulasin-isimlik.png", "_redirects"]) {
  const s = path.join(publicRoot, name);
  const d = path.join(distRoot, name);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`[copy-data-to-dist] public/${name} → dist/${name} kopyalandı.`);
  }
}

const i18nSrc = path.join(publicRoot, "i18n");
const i18nDst = path.join(distRoot, "i18n");
if (fs.existsSync(i18nSrc)) {
  fs.mkdirSync(i18nDst, { recursive: true });
  fs.cpSync(i18nSrc, i18nDst, { recursive: true });
  console.log("[copy-data-to-dist] public/i18n → dist/i18n kopyalandı.");
} else {
  console.warn("[copy-data-to-dist] public/i18n yok, atlanıyor.");
}

const enSrc = path.join(publicRoot, "en");
const enDst = path.join(distRoot, "en");
if (fs.existsSync(enSrc)) {
  fs.mkdirSync(enDst, { recursive: true });
  fs.cpSync(enSrc, enDst, { recursive: true });
  console.log("[copy-data-to-dist] public/en → dist/en kopyalandı.");
}

const imgSrc = path.join(publicRoot, "images");
const imgDst = path.join(distRoot, "images");
if (fs.existsSync(imgSrc)) {
  fs.mkdirSync(imgDst, { recursive: true });
  fs.cpSync(imgSrc, imgDst, { recursive: true });
  console.log("[copy-data-to-dist] public/images → dist/images kopyalandı.");
} else {
  console.warn("[copy-data-to-dist] public/images yok, atlanıyor.");
}

/** Schema / OG: index.html → https://equsto.com/logo/equsto-logo.png */
const logoDstDir = path.join(distRoot, "logo");
fs.mkdirSync(logoDstDir, { recursive: true });
for (const logoName of ["equsto-logo.png", "equsto-logo.svg"]) {
  const s = path.join(imgSrc, logoName);
  const d = path.join(logoDstDir, logoName);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`[copy-data-to-dist] public/images/${logoName} → dist/logo/${logoName}`);
  }
}

const deptPlpCssText = fs.existsSync(path.join(publicRoot, "eq-dept-plp.css"))
  ? fs.readFileSync(path.join(publicRoot, "eq-dept-plp.css"), "utf8")
  : "";

for (const html of ["contact.html", "imt300.html", "bar-module.html", ...DEPT_PLP_HTML]) {
  const s = path.join(publicRoot, html);
  const d = path.join(distRoot, html);
  if (fs.existsSync(s)) {
    let text = fs.readFileSync(s, "utf8");
    if (DEPT_PLP_HTML.includes(html) && deptPlpCssText) {
      text = injectDeptPlpInlineCss(text, deptPlpCssText);
    }
    fs.writeFileSync(d, text, "utf8");
    console.log(`[copy-data-to-dist] public/${html} → dist/${html} kopyalandı.`);
  }
}

const prerenderSrc = path.join(root, "public", "seo", "prerender");
const prerenderDst = path.join(root, "dist", "seo", "prerender");
if (fs.existsSync(prerenderSrc)) {
  fs.mkdirSync(prerenderDst, { recursive: true });
  fs.cpSync(prerenderSrc, prerenderDst, { recursive: true });
  console.log("[copy-data-to-dist] public/seo/prerender → dist/seo/prerender kopyalandı.");
}

/** Ana sayfa vitrin: /images/besos/* ve /images/imt300/* (Vite hash → sabit dosya adı) */
function copyStableHeroImages() {
  const assetsDir = path.join(distRoot, "assets");
  if (!fs.existsSync(assetsDir)) {
    console.warn("[copy-data-to-dist] dist/assets yok — vitrin görselleri atlandı (npm run build).");
    return;
  }
  const files = fs.readdirSync(assetsDir);
  const besosMap = [
    { glob: "besos-ice-bar-", out: "besos-ice-bar.png" },
    { glob: "besos-ice-mint-", out: "besos-ice-mint.png" },
  ];
  const besosOut = path.join(distRoot, "images", "besos");
  fs.mkdirSync(besosOut, { recursive: true });
  for (const { glob, out } of besosMap) {
    const hit = files.find((f) => f.startsWith(glob) && f.endsWith(".png"));
    if (hit) {
      fs.copyFileSync(path.join(assetsDir, hit), path.join(besosOut, out));
      console.log("[copy-data-to-dist] images/besos/" + out);
    }
  }
  const imtMap = [
    { glob: "imt300-1-", out: "imt300-1.jpg", ext: ".jpg" },
    { glob: "imt300-2-", out: "imt300-2.png", ext: ".png" },
  ];
  const imtOut = path.join(distRoot, "images", "imt300");
  fs.mkdirSync(imtOut, { recursive: true });
  for (const { glob, out, ext } of imtMap) {
    const hit = files.find((f) => f.startsWith(glob) && f.endsWith(ext));
    if (hit) {
      fs.copyFileSync(path.join(assetsDir, hit), path.join(imtOut, out));
      console.log("[copy-data-to-dist] images/imt300/" + out);
    }
  }
}
copyStableHeroImages();

for (const rel of [
  "dist/bar-design-cocktailstations.css",
  "dist/eq-bar-design-cocktailstations.js",
  "dist/data/cocktailstations-catalogue.json",
  "dist/data/cocktailstations-landing.json",
  "dist/data/cocktailstations-images",
]) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("[copy-data-to-dist] Cocktailstations kalıntısı silindi:", rel);
  }
}
const assetsDir = path.join(distRoot, "assets");
if (fs.existsSync(assetsDir)) {
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.startsWith("bar-design-") || !name.endsWith(".css")) continue;
    const fp = path.join(assetsDir, name);
    const text = fs.readFileSync(fp, "utf8");
    if (text.includes("bd-cs-seri") || text.includes("bd-cs-strip")) {
      fs.unlinkSync(fp);
      console.log("[copy-data-to-dist] Cocktailstations CSS bundle silindi: assets/" + name);
    }
  }
}

const htPublic = path.join(root, "public", ".htaccess");
const htExample = path.join(root, "deploy", "cpanel-htaccess.example");
const htaccessSrc = fs.existsSync(htPublic) ? htPublic : htExample;
const htaccessDst = path.join(distRoot, ".htaccess");
if (fs.existsSync(htaccessSrc)) {
  fs.copyFileSync(htaccessSrc, htaccessDst);
  console.log(
    "[copy-data-to-dist]",
    (fs.existsSync(htPublic) ? "public/.htaccess" : "deploy/cpanel-htaccess.example") + " → dist/.htaccess",
  );
}
