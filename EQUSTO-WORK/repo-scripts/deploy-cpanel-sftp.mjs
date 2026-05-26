/**
 * cPanel public_html ? SFTP ile otomatik yukleme (.env CPANEL_SFTP_*).
 *
 * Ornekler:
 *   npm run deploy:cpanel:check
 *   npm run deploy:cpanel:sogutma
 *   npm run deploy:cpanel:push
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./lib/load-env.mjs";
import { connectDeploy, deployConfigFromEnv, remotePath } from "./lib/cpanel-transport.mjs";

const root = loadEnv();
const dist = path.join(root, "dist");

const SKIP_PREFIXES = ["data/oztiryakiler-images/"];

const PRESETS = {
  sogutma: [
    "sogutma.html",
    "theme.css",
    "theme.js",
    "equsto-logo.js",
    "images/equsto-logo.png",
    "images/equsto-logo-white.png",
    "eq-i18n.js",
    "eq-site-urls.js",
    "nav.js",
    "eq-home-mutbex.css",
    "eq-dept-plp.css",
    "eq-dept-plp.js",
    "eq-fiyatlar-bridge.js",
    "eq-dept-cm-facets.js",
    "eq-dept-tips.js",
    "eq-dept-plp-config.js",
    "ecom-cart.js",
    "ecom-data.js",
    "data/dept/sogutma.json",
    "data/fiyatlar.json",
  ],
  "cat-drawer": ["nav.js", "theme.css"],
  seo: [
    "sitemap.xml",
    "sitemap-priority.xml",
    "robots.txt",
    "pfos.html",
    "bar-design.html",
  ],
  "seo-guides": [
    ".htaccess",
    "sitemap.xml",
    "sitemap-priority.xml",
    "robots.txt",
    "steakhouse-kurulumu.html",
    "bulut-mutfak-kurulumu.html",
    "cafe-kurulumu.html",
    "catering-mutfagi.html",
    "fine-dining-kurulumu.html",
    "all-day-dining-kurulumu.html",
    "fast-food-kurulumu.html",
    "en/steakhouse-setup.html",
    "en/cloud-kitchen-setup.html",
    "en/cafe-setup.html",
    "en/catering-kitchen-setup.html",
    "en/fine-dining-setup.html",
    "en/all-day-dining-setup.html",
    "en/fast-food-setup.html",
    "bar-design.html",
    "data/eq-category-seo.json",
  ],
  admin: [
    "admin.html",
    "admin-config.js",
    "admin-gate.js",
    "admin-eticaret-kategori.js",
    "ecom-data.js",
    "theme.css",
    "theme.js",
    "equsto-logo.js",
    "images/equsto-logo.png",
    "images/equsto-logo-white.png",
    "eq-site-urls.js",
    "contact.css",
    "contact.js",
    "admin-eticaret.js",
    "admin-eticaret-api.js",
    "data/fiyatlar.json",
  ],
  "admin-kategori": [
    "admin.html",
    "index.html",
    "admin-eticaret-kategori.js",
    "admin-eticaret-kategori-overrides.js",
    "admin-eticaret-kategori-ui.js",
    "eq-dept-tips.js",
    "eq-category-overrides.js",
    "data/product-category-overrides.json",
    "admin-gate.js",
    "eq-site-urls.js",
    "ecom-data.js",
    "admin-eticaret.js",
    "admin-eticaret-api.js",
  ],
  "shop-chrome": [
    "images/equsto-logo.png",
    "images/equsto-logo-white.png",
    "index.html",
    "pisirme.html",
    "sogutma.html",
    "kahve.html",
    "yikama.html",
    "hazirlik.html",
    "icecek.html",
    "tezgah.html",
    "dolap.html",
    "davlumbaz.html",
    "tasima.html",
    "araba.html",
    "istif.html",
    "product.html",
    "theme.css",
    "theme.js",
    "equsto-logo.js",
    "nav.js",
    "contact.css",
    "contact.js",
    "eq-site-urls.js",
  ],
  images: null,
  "yuksel-pdf": [
    "data/ekipmanlar.json",
    "data/ekipmanlar-file-fallback.js",
    "data/dept/pisirme.json",
    "data/dept/sogutma.json",
    "data/dept/kahve.json",
    "data/dept/yikama.json",
    "data/dept/hazirlik.json",
    "data/dept/icecek.json",
    "data/dept/tezgah.json",
    "data/dept/dolap.json",
    "data/dept/davlumbaz.json",
    "data/dept/tasima.json",
    "data/dept/araba.json",
    "data/dept/istif.json",
  ],
  "dept-plp": [
    "images/equsto-logo.png",
    "images/equsto-logo-white.png",
    "pisirme.html",
    "sogutma.html",
    "kahve.html",
    "yikama.html",
    "hazirlik.html",
    "icecek.html",
    "tezgah.html",
    "dolap.html",
    "davlumbaz.html",
    "tasima.html",
    "araba.html",
    "istif.html",
    ".htaccess",
    "theme.css",
    "theme.js",
    "nav.js",
    "contact.js",
    "contact.css",
    "eq-site-urls.js",
    "eq-i18n.js",
    "equsto-logo.js",
    "eq-home-mutbex.css",
    "eq-dept-plp.css",
    "eq-dept-plp.js",
    "eq-fiyatlar-bridge.js",
    "eq-dept-cm-facets.js",
    "eq-dept-tips.js",
    "eq-dept-plp-config.js",
    "ecom-cart.js",
    "ecom-data.js",
    "product.html",
    "eq-shop-catalog-bootstrap.js",
    "eq-filter-column.js",
    "eq-display-terminology.js",
    "eq-product-card-tint.js",
    "data/fiyatlar.json",
    "data/ekipmanlar.json",
    "data/dept/pisirme.json",
    "data/dept/sogutma.json",
    "data/dept/kahve.json",
    "data/dept/yikama.json",
    "data/dept/hazirlik.json",
    "data/dept/icecek.json",
    "data/dept/tezgah.json",
    "data/dept/dolap.json",
    "data/dept/davlumbaz.json",
    "data/dept/tasima.json",
    "data/dept/araba.json",
    "data/dept/istif.json",
  ],
};

function parseArgs(argv) {
  const out = { dryRun: false, full: false, check: false, info: false, preset: null, files: [], syncImages: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--full") out.full = true;
    else if (a === "--check") out.check = true;
    else if (a === "--info") out.info = true;
    else if (a === "--sync-images") out.syncImages = true;
    else if (a === "--preset" && argv[i + 1]) out.preset = argv[++i];
    else if (a === "--file-list" && argv[i + 1]) {
      const listPath = path.isAbsolute(argv[i + 1]) ? argv[i + 1] : path.join(root, argv[++i]);
      if (fs.existsSync(listPath)) {
        out.files = fs
          .readFileSync(listPath, "utf8")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
      }
    } else if (a === "--files") {
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) out.files.push(argv[++i]);
    } else if (!a.startsWith("--")) out.files.push(a);
  }
  return out;
}

function shouldSkipRel(rel) {
  const n = rel.replace(/\\/g, "/");
  return SKIP_PREFIXES.some((p) => n.startsWith(p));
}

function listDistFiles(baseDir, baseRel = "") {
  const out = [];
  if (!fs.existsSync(baseDir)) return out;
  for (const ent of fs.readdirSync(baseDir, { withFileTypes: true })) {
    const rel = baseRel ? `${baseRel}/${ent.name}` : ent.name;
    const fp = path.join(baseDir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkipRel(rel + "/")) continue;
      out.push(...listDistFiles(fp, rel));
    } else if (!shouldSkipRel(rel)) {
      out.push(rel.replace(/\\/g, "/"));
    }
  }
  return out;
}


function loadDeployConfig() {
  try {
    return deployConfigFromEnv();
  } catch (e) {
    if (e.code === "ENV_MISSING") {
      console.error("[cpanel-deploy]", e.message);
      console.error("  Kurulum: deploy/CPANEL-SFTP-KURULUM.md");
    } else {
      console.error("[cpanel-deploy]", e.message || e);
    }
    process.exit(1);
  }
}

async function listRemote(transport, remoteDir, sub = "") {
  if (transport.mode === "ftp") {
    return transport.list(sub || ".");
  }
  const dir = sub ? remotePath(remoteDir, sub) : remoteDir;
  return transport.list(dir);
}

async function statRemote(transport, remoteDir, rel) {
  if (transport.mode === "ftp") {
    return transport.stat(rel);
  }
  return transport.stat(remotePath(remoteDir, rel));
}

async function uploadRemote(transport, remoteDir, local, rel) {
  const abs = remotePath(remoteDir, rel);
  await transport.upload(local, abs);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let files = [];
  if (args.check || args.info) {
    files = [];
  } else if (args.full) {
    if (!fs.existsSync(dist)) {
      console.error("[cpanel-deploy] dist/ yok ? once: npm run build");
      process.exit(1);
    }
    files = listDistFiles(dist);
  } else if (args.preset === "atalay-images") {
    const imgDir = path.join(root, "public", "data", "images");
    if (!fs.existsSync(imgDir)) {
      console.error("[cpanel-deploy] public/data/images yok");
      process.exit(1);
    }
    files = fs
      .readdirSync(imgDir)
      .filter((n) => /^atalay-e-.+\.jpg$/i.test(n))
      .map((n) => "data/images/" + n);
  } else if (args.preset === "yuksel-images") {
    const imgDir = path.join(root, "public", "data", "images");
    if (!fs.existsSync(imgDir)) {
      console.error("[cpanel-deploy] public/data/images yok");
      process.exit(1);
    }
    files = fs
      .readdirSync(imgDir)
      .filter((n) => /^yuksel/i.test(n))
      .map((n) => "data/images/" + n);
    const mapPath = path.join(root, "public", "data", "yuksel-missing-images.json");
    if (fs.existsSync(mapPath)) {
      files.push("data/yuksel-missing-images.json");
    }
    console.log("[cpanel-deploy] Yüksel PDF görselleri:", files.length, "dosya");
  } else if (args.preset === "atalay-fiyat") {
    const atalayDir = path.join(root, "public", "data", "fiyat-listeleri", "atalay", "2025-yerli");
    if (!fs.existsSync(atalayDir)) {
      console.error("[cpanel-deploy] Once: npm run import:atalay-2025");
      process.exit(1);
    }
    const rels = listDistFiles(atalayDir);
    files = rels.map((rel) => "data/fiyat-listeleri/atalay/2025-yerli/" + rel);
    console.log("[cpanel-deploy] Atalay fiyat listesi:", files.length, "dosya");
  } else if (args.preset === "images" || args.syncImages) {
    const imgDir = path.join(root, "public", "data", "images");
    if (!fs.existsSync(imgDir)) {
      console.error("[cpanel-deploy] public/data/images yok");
      process.exit(1);
    }
    files = listDistFiles(imgDir).map((rel) => "data/images/" + rel);
    console.log("[cpanel-deploy] Urun fotolari:", files.length, "dosya (~3 GB ilk yukleme)");
    console.log("[cpanel-deploy] Ilk kurulum icin daha hizli: npm run deploy:data-images ? cPanel Extract");
  } else if (args.preset) {
    const preset = PRESETS[args.preset];
    if (preset === null) {
      console.error("[cpanel-deploy] preset=images icin: --preset images veya --sync-images");
      process.exit(1);
    }
    if (!preset) {
      console.error("[cpanel-deploy] Bilinmeyen preset:", args.preset, Object.keys(PRESETS).join(", "));
      process.exit(1);
    }
    files = preset;
  } else if (args.files.length) {
    files = args.files.map((f) => f.replace(/\\/g, "/"));
  } else {
    console.error("Kullanim: --check | --full | --preset sogutma | --files a.html b.js");
    process.exit(1);
  }

  let transport;
  try {
    const cfg = loadDeployConfig();
    const remoteDir = cfg.remoteDir;
    console.log(
      "[cpanel-deploy] Baglaniyor:",
      cfg.user + "@" + cfg.host + ":" + cfg.port,
      cfg.useFtp ? "(FTP)" : "(SFTP)"
    );
    console.log("[cpanel-deploy] Uzak klasor:", remoteDir);
    transport = await connectDeploy(cfg);
    console.log("[cpanel-deploy] Baglanti OK ?", transport.label);

    if (args.check) {
      const list = await listRemote(transport, remoteDir);
      console.log("[cpanel-deploy] public_html ornek:", list.slice(0, 8).map((e) => e.name).join(", "));
      return;
    }

    if (args.info) {
      const list = await listRemote(transport, remoteDir);
      console.log("[cpanel-deploy] public_html:", list.length, "oge");
      console.log(
        "[cpanel-deploy] Kok:",
        list.slice(0, 20).map((e) => `${e.name}${e.type === "d" ? "/" : ""}`).join(", ")
      );

      async function probe(rel) {
        try {
          const st = await statRemote(transport, remoteDir, rel);
          const sz = st.size != null ? `${(st.size / 1024).toFixed(1)} KB` : st.type;
          console.log(`  [OK] ${rel} ? ${sz}`);
          return true;
        } catch (_) {
          console.log(`  [YOK] ${rel}`);
          return false;
        }
      }

      await probe("sogutma.html");
      await probe("yikama.html");
      await probe("data/ekipmanlar.json");
      await probe("nav.js");
      await probe("eq-dept-plp.js");

      try {
        const imgs = await listRemote(transport, remoteDir, "data/images");
        const imgCount = imgs.filter((e) => e.type !== "d").length;
        console.log(`  [data/images] ${imgCount} dosya (ilk sayim; alt klasorler dahil degil)`);
      } catch (_) {
        console.log("  [YOK] data/images/ ? urun fotolari klasoru yok (404 nedeni)");
      }

      try {
        const dept = await listRemote(transport, remoteDir, "data/dept");
        console.log("  [data/dept]", dept.map((e) => e.name).join(", "));
      } catch (_) {
        console.log("  [YOK] data/dept/");
      }
      return;
    }

    let ok = 0;
    let skip = 0;
    let synced = 0;
    const isImages = args.preset === "images" || args.syncImages;
    for (let fi = 0; fi < files.length; fi++) {
      const rel = files[fi];
      const pub = path.join(root, "public", rel);
      const local = path.join(dist, rel);
      const relNorm = rel.replace(/\\/g, "/");
      let src = local;
      if (relNorm.startsWith("data/") && fs.existsSync(pub)) {
        src = pub;
      } else if (rel === "index.html" && fs.existsSync(pub)) {
        src = pub;
      } else if (rel === ".htaccess" && fs.existsSync(pub)) {
        src = pub;
      } else if (!fs.existsSync(local)) {
        if (fs.existsSync(pub)) src = pub;
        else {
          console.warn("[cpanel-deploy] ATLANDI (dosya yok):", rel);
          skip++;
          continue;
        }
      }
      const remote = remotePath(remoteDir, rel);
      if (args.dryRun) {
        console.log("[dry-run]", rel, "->", remote);
        ok++;
        continue;
      }
      if (isImages) {
        try {
          const st = await statRemote(transport, remoteDir, rel);
          const locSz = fs.statSync(src).size;
          if (st && st.size === locSz) {
            skip++;
            if ((fi + 1) % 500 === 0) console.log("[sync]", fi + 1, "/", files.length, "atlandi (zaten var)");
            continue;
          }
        } catch (_) {}
      }
      try {
        await uploadRemote(transport, remoteDir, src, rel);
      } catch (upErr) {
        if (/553|permission denied|not permitted/i.test(String(upErr.message))) {
          console.warn("[cpanel-deploy] ATLANDI (izin):", rel);
          skip++;
          continue;
        }
        throw upErr;
      }
      synced++;
      ok++;
      if (isImages && synced % 200 === 0) {
        console.log("[sync]", synced, "yeni yuklendi,", skip, "zaten vardi,", fi + 1, "/", files.length);
      } else if (!isImages) {
        const kb = (fs.statSync(src).size / 1024).toFixed(1);
        console.log("[yuklendi]", rel, `(${kb} KB)`);
      }
    }
    console.log(`\n[cpanel-deploy] Bitti: ${ok} dosya${skip ? `, ${skip} atlandi` : ""}`);
    if (!args.dryRun) {
      console.log("[cpanel-deploy] Cloudflare Purge + tarayici Ctrl+F5 onerilir.");
    }
  } finally {
    if (transport) await transport.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error("[cpanel-deploy] Hata:", e.message || e);
  if (/auth|password|denied/i.test(String(e.message))) {
    console.error("  FTP sifresi / kullanici adi kontrol edin. equsto.com: port 21 (FTP), SFTP (22) kapali olabilir.");
  }
  if (/ECONNREFUSED/.test(String(e.message))) {
    console.error("  .env: CPANEL_SFTP_PORT=21 veya CPANEL_USE_FTP=1");
  }
  process.exit(1);
});
