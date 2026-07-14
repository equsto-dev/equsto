/**
 * Mobil ajan — Android/iOS PWA, meta etiketleri, mobil UI kilitleri
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ROOT = process.env.AGENT_REPO_ROOT?.trim() || APP_ROOT;
const PUBLIC = path.join(ROOT, "public");

const BRAND_THEME = "#001e50";
const MOBILE_BREAKPOINT = 768;

const VERIFY_SCRIPTS = [
  "verify-whatsapp-cat-fab-kilit.mjs",
  "verify-pdp-buybox-kilit.mjs",
  "verify-topnav-kilit.mjs",
  "verify-home-pop-cats-kilit.mjs",
  "verify-home-hero-ads-kilit.mjs",
];

const LIVE_PATHS = ["/", "/shop/pisirme", "/pfos"];

/** @typedef {'critical'|'high'|'medium'|'low'|'info'} MobileIssueSeverity */
/** @typedef {'ios'|'android'|'pwa'|'viewport'|'assets'|'deep_link'|'ui_kilit'|'live'} MobilePlatform */

/**
 * @param {object} p
 * @returns {import('./mobile-agent-types.mjs').MobileIssue}
 */
export function makeIssue(p) {
  return {
    id: p.id,
    platform: p.platform,
    severity: p.severity,
    type: p.type,
    area: p.area || "",
    message: p.message,
    file: p.file || "",
    fix: p.fix || "",
    meta: p.meta || {},
  };
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function parseJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * @returns {{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }}
 */
export function auditPwaManifest() {
  const issues = [];
  const manifestPath = path.join(PUBLIC, "manifest.json");
  const altManifest = path.join(PUBLIC, "assets/manifest-CtzHFPu3.json");

  if (!fs.existsSync(manifestPath)) {
    issues.push(
      makeIssue({
        id: "pwa:manifest_missing",
        platform: "pwa",
        severity: "critical",
        type: "missing_file",
        area: "manifest",
        message: "public/manifest.json bulunamadı",
        file: "public/manifest.json",
        fix: "PWA manifest.json oluşturun veya sync-legacy-assets ile senkronize edin",
      }),
    );
    return { check: { status: "error", reason: "manifest yok" }, issues };
  }

  const manifest = parseJsonSafe(manifestPath);
  if (!manifest) {
    issues.push(
      makeIssue({
        id: "pwa:manifest_invalid",
        platform: "pwa",
        severity: "critical",
        type: "invalid_json",
        area: "manifest",
        message: "manifest.json geçersiz JSON",
        file: "public/manifest.json",
      }),
    );
    return { check: { status: "error" }, issues };
  }

  const required = ["name", "short_name", "start_url", "display", "theme_color", "icons"];
  for (const key of required) {
    if (!manifest[key]) {
      issues.push(
        makeIssue({
          id: `pwa:manifest_field_${key}`,
          platform: "pwa",
          severity: "high",
          type: "missing_field",
          area: "manifest",
          message: `manifest.json: '${key}' alanı eksik`,
          file: "public/manifest.json",
        }),
      );
    }
  }

  if (manifest.display !== "standalone" && manifest.display !== "fullscreen") {
    issues.push(
      makeIssue({
        id: "pwa:display_not_standalone",
        platform: "android",
        severity: "medium",
        type: "config",
        area: "manifest",
        message: `display: '${manifest.display}' — Android ana ekran için 'standalone' önerilir`,
        file: "public/manifest.json",
      }),
    );
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const hasPng512 = icons.some(
    (i) =>
      String(i.sizes || "").includes("512") &&
      (String(i.type || "").includes("png") || String(i.src || "").endsWith(".png")),
  );
  if (!hasPng512) {
    issues.push(
      makeIssue({
        id: "pwa:icon_png512_missing",
        platform: "android",
        severity: "high",
        type: "missing_asset",
        area: "icons",
        message: "Android için 512×512 PNG maskable ikon önerilir",
        file: "public/manifest.json",
        fix: "icons[] içine 512x512 PNG ekleyin (maskable purpose)",
      }),
    );
  }

  for (const icon of icons) {
    const src = String(icon.src || "");
    if (src.startsWith("/") && !src.startsWith("data:")) {
      const disk = path.join(PUBLIC, src.replace(/^\//, ""));
      if (!fs.existsSync(disk)) {
        issues.push(
          makeIssue({
            id: `pwa:icon_404:${src}`,
            platform: "pwa",
            severity: "high",
            type: "missing_asset",
            area: "icons",
            message: `Manifest ikonu diskte yok: ${src}`,
            file: "public/manifest.json",
            meta: { src },
          }),
        );
      }
    }
  }

  if (fs.existsSync(altManifest)) {
    const alt = parseJsonSafe(altManifest);
    if (alt) {
      if (alt.background_color !== manifest.background_color) {
        issues.push(
          makeIssue({
            id: "pwa:manifest_bg_conflict",
            platform: "pwa",
            severity: "medium",
            type: "config_conflict",
            area: "manifest",
            message: `İki manifest background_color farklı: ${manifest.background_color} vs ${alt.background_color}`,
            file: "public/manifest.json",
            meta: { alt: "public/assets/manifest-CtzHFPu3.json" },
          }),
        );
      }
    }
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "critical" || i.severity === "high")
        ? "warn"
        : "ok",
      path: "/manifest.json",
      display: manifest.display,
      theme_color: manifest.theme_color,
      icon_count: icons.length,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }}
 */
export function auditAppleIos() {
  const issues = [];
  const layoutPath = "app/layout.tsx";

  if (!fileExists(layoutPath)) {
    return {
      check: { status: "skipped", reason: "app/layout.tsx yok" },
      issues: [],
    };
  }

  const layout = readText(layoutPath);

  if (!layout.includes("viewportFit")) {
    issues.push(
      makeIssue({
        id: "ios:viewport_fit_missing",
        platform: "ios",
        severity: "high",
        type: "missing_meta",
        area: "viewport",
        message: "viewportFit: 'cover' eksik — iPhone çentik/safe-area sorunu",
        file: layoutPath,
        fix: "export const viewport = { viewportFit: 'cover', ... }",
      }),
    );
  }

  if (!layout.includes("metadata") || !layout.includes("icons")) {
    issues.push(
      makeIssue({
        id: "ios:metadata_icons_missing",
        platform: "ios",
        severity: "high",
        type: "missing_meta",
        area: "icons",
        message: "Next.js metadata.icons tanımlı değil — apple-touch-icon yok",
        file: layoutPath,
        fix: "metadata.icons ve apple-touch-icon (180×180) ekleyin",
      }),
    );
  }

  if (!layout.includes("appleWebApp") && !layout.includes("apple-mobile-web-app")) {
    issues.push(
      makeIssue({
        id: "ios:apple_web_app_missing",
        platform: "ios",
        severity: "medium",
        type: "missing_meta",
        area: "pwa",
        message: "apple-mobile-web-app-capable / metadata.appleWebApp eksik",
        file: layoutPath,
        fix: "metadata.appleWebApp = { capable: true, statusBarStyle: 'default' }",
      }),
    );
  }

  if (!layout.includes('rel="manifest"') && !layout.includes("manifest:")) {
    issues.push(
      makeIssue({
        id: "ios:next_manifest_unlinked",
        platform: "ios",
        severity: "high",
        type: "missing_link",
        area: "manifest",
        message: "Next.js App Router sayfalarında manifest bağlantısı yok",
        file: layoutPath,
        fix: "metadata.manifest = '/manifest.json' veya <link rel='manifest'>",
      }),
    );
  }

  if (layout.includes("eq-mobile.css")) {
    // good
  } else {
    issues.push(
      makeIssue({
        id: "ios:eq_mobile_css_missing",
        platform: "ios",
        severity: "medium",
        type: "missing_asset",
        area: "css",
        message: "eq-mobile.css root layout'ta yüklenmiyor",
        file: layoutPath,
      }),
    );
  }

  const themeJs = fileExists("public/theme.js") ? readText("public/theme.js") : "";
  if (themeJs.includes('meta[name="theme-color"]') && themeJs.includes("#ffffff")) {
    issues.push(
      makeIssue({
        id: "ios:theme_color_runtime_override",
        platform: "ios",
        severity: "low",
        type: "config_conflict",
        area: "theme-color",
        message: `theme.js çalışma anında theme-color'ı #ffffff/#1a1a1a yapıyor; manifest ${BRAND_THEME}`,
        file: "public/theme.js",
        meta: { brand: BRAND_THEME },
      }),
    );
  }

  const touchSizes = [180, 152, 120];
  for (const size of touchSizes) {
    const candidates = [
      `public/apple-touch-icon-${size}x${size}.png`,
      `public/images/apple-touch-icon-${size}x${size}.png`,
      size === 180 ? "public/apple-touch-icon.png" : null,
    ].filter(Boolean);
    if (!candidates.some((c) => fileExists(c))) {
      if (size === 180) {
        issues.push(
          makeIssue({
            id: "ios:touch_icon_180_missing",
            platform: "ios",
            severity: "high",
            type: "missing_asset",
            area: "icons",
            message: "apple-touch-icon (180×180) dosyası yok",
            fix: "public/apple-touch-icon.png veya metadata.icons.apple ekleyin",
          }),
        );
      }
      break;
    }
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "critical" || i.severity === "high")
        ? "warn"
        : "ok",
      viewport_fit: layout.includes("viewportFit"),
      eq_mobile_css: layout.includes("eq-mobile.css"),
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }}
 */
export function auditAndroid() {
  const issues = [];
  const manifestPath = path.join(PUBLIC, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? parseJsonSafe(manifestPath) : null;

  const assetlinks = path.join(PUBLIC, ".well-known/assetlinks.json");
  if (!fs.existsSync(assetlinks)) {
    issues.push(
      makeIssue({
        id: "android:assetlinks_missing",
        platform: "android",
        severity: "info",
        type: "not_configured",
        area: "deep_link",
        message: ".well-known/assetlinks.json yok — TWA/Play Store deep link henüz yapılandırılmamış",
        fix: "Native Android uygulama planlanıyorsa assetlinks.json ekleyin",
      }),
    );
  }

  if (manifest) {
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const maskable = icons.filter((i) => String(i.purpose || "").includes("maskable"));
    if (!maskable.length) {
      issues.push(
        makeIssue({
          id: "android:maskable_icon_missing",
          platform: "android",
          severity: "medium",
          type: "missing_asset",
          area: "icons",
          message: "Maskable ikon tanımlı değil — Android adaptive icon kırpılabilir",
          file: "public/manifest.json",
        }),
      );
    }

    if (!manifest.orientation) {
      issues.push(
        makeIssue({
          id: "android:orientation_unset",
          platform: "android",
          severity: "low",
          type: "config",
          area: "manifest",
          message: "manifest.orientation tanımlı değil (portrait-primary önerilir)",
          file: "public/manifest.json",
        }),
      );
    }
  }

  const swFiles = ["sw.js", "service-worker.js", "public/sw.js"].filter((f) =>
    fileExists(f.replace(/^public\//, "")),
  );
  if (!swFiles.length) {
    issues.push(
      makeIssue({
        id: "android:no_service_worker",
        platform: "android",
        severity: "info",
        type: "not_configured",
        area: "pwa",
        message: "Service worker yok — tam PWA/offline kurulumu yapılmamış (bilinçli olabilir)",
      }),
    );
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "high") ? "warn" : "ok",
      twa_ready: fs.existsSync(assetlinks),
      service_worker: swFiles.length > 0,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }}
 */
export function auditLegacyHtmlManifests() {
  const issues = [];
  let htmlCount = 0;
  let brokenManifest = 0;

  const htmlFiles = fs.readdirSync(PUBLIC).filter((f) => f.endsWith(".html"));
  for (const file of htmlFiles) {
    htmlCount++;
    const content = fs.readFileSync(path.join(PUBLIC, file), "utf8");
    const manifestMatch = content.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i);
    if (!manifestMatch) continue;

    const href = manifestMatch[1];
    const diskPath = href.startsWith("/")
      ? path.join(PUBLIC, href.replace(/^\//, ""))
      : path.join(PUBLIC, file, "..", href);

    if (!fs.existsSync(diskPath)) {
      brokenManifest++;
      issues.push(
        makeIssue({
          id: `legacy:manifest_404:${file}`,
          platform: "pwa",
          severity: "high",
          type: "broken_link",
          area: "legacy_html",
          message: `${file} → manifest 404: ${href}`,
          file: `public/${file}`,
          fix: "Manifest yolunu güncelleyin veya eksik dosyayı ekleyin",
        }),
      );
    }
  }

  // Eski Vite hash'leri yalnızca HTML hâlâ onları gösteriyorsa sorun say
  if (fileExists("public/pfos.html")) {
    const pfosHtml = readText("public/pfos.html");
    const staleHash = "manifest-BfAPr90J.json";
    if (pfosHtml.includes(staleHash)) {
      issues.push(
        makeIssue({
          id: "legacy:pfos_manifest_hash_stale",
          platform: "pwa",
          severity: "high",
          type: "broken_link",
          area: "legacy_html",
          message: "pfos.html eski hash manifest kullanıyor (manifest-BfAPr90J.json yok)",
          file: "public/pfos.html",
          fix: "/manifest.json kullanın",
        }),
      );
    }
  }

  return {
    check: {
      status: brokenManifest > 0 || issues.some((i) => i.id === "legacy:pfos_manifest_hash_stale")
        ? "error"
        : "ok",
      html_files: htmlCount,
      broken_manifest_links: brokenManifest,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }}
 */
export function auditMobileAssets() {
  const issues = [];
  const required = [
    "public/eq-mobile.css",
    "public/theme.css",
    "public/nav.js",
    "public/contact.js",
    "public/eq-product-page-inline.js",
  ];

  let missing = 0;
  for (const rel of required) {
    if (!fileExists(rel)) {
      missing++;
      issues.push(
        makeIssue({
          id: `assets:missing:${rel}`,
          platform: "viewport",
          severity: "high",
          type: "missing_file",
          area: "mobile_chrome",
          message: `Mobil katman dosyası eksik: ${rel}`,
          file: rel,
        }),
      );
    }
  }

  if (fileExists("public/eq-mobile.css")) {
    const css = readText("public/eq-mobile.css");
    if (!css.includes("safe-area-inset")) {
      issues.push(
        makeIssue({
          id: "viewport:no_safe_area",
          platform: "ios",
          severity: "medium",
          type: "css_gap",
          area: "safe_area",
          message: "eq-mobile.css safe-area-inset kullanmıyor",
          file: "public/eq-mobile.css",
        }),
      );
    }
    if (!css.includes(`${MOBILE_BREAKPOINT}px`)) {
      issues.push(
        makeIssue({
          id: "viewport:no_768_breakpoint",
          platform: "viewport",
          severity: "medium",
          type: "css_gap",
          area: "breakpoint",
          message: `eq-mobile.css ${MOBILE_BREAKPOINT}px breakpoint bulunamadı`,
          file: "public/eq-mobile.css",
        }),
      );
    }
    if (!css.includes("eq-pdp-mobile-buybar") && !css.includes("pdp-mobile-buybar")) {
      issues.push(
        makeIssue({
          id: "viewport:no_pdp_buybar",
          platform: "viewport",
          severity: "low",
          type: "css_gap",
          area: "pdp",
          message: "Mobil PDP sticky buybar CSS kuralı bulunamadı",
          file: "public/eq-mobile.css",
        }),
      );
    }
  }

  return {
    check: {
      status: missing > 0 ? "error" : "ok",
      required_missing: missing,
      breakpoint_px: MOBILE_BREAKPOINT,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }}
 */
export function auditDeepLinks() {
  const issues = [];
  const aasa = path.join(PUBLIC, ".well-known/apple-app-site-association");
  const assetlinks = path.join(PUBLIC, ".well-known/assetlinks.json");

  if (!fs.existsSync(aasa)) {
    issues.push(
      makeIssue({
        id: "ios:universal_links_missing",
        platform: "ios",
        severity: "info",
        type: "not_configured",
        area: "deep_link",
        message: "apple-app-site-association yok — iOS Universal Links yapılandırılmamış",
      }),
    );
  }

  const repoText = [readText("app/layout.tsx"), readText("package.json")].join("\n");
  if (!/apps\.apple\.com|play\.google\.com/i.test(repoText)) {
    issues.push(
      makeIssue({
        id: "native:no_store_links",
        platform: "android",
        severity: "info",
        type: "not_configured",
        area: "app_store",
        message: "App Store / Play Store bağlantısı tanımlı değil (yalnızca web PWA)",
      }),
    );
  }

  return {
    check: {
      status: "ok",
      universal_links: fs.existsSync(aasa),
      android_assetlinks: fs.existsSync(assetlinks),
    },
    issues,
  };
}

function runVerifyScript(scriptName) {
  return new Promise((resolve) => {
    const scriptPath = path.join(APP_ROOT, "scripts", scriptName);
    if (!fs.existsSync(scriptPath)) {
      resolve({ script: scriptName, ok: false, skipped: true, output: "script yok" });
      return;
    }
    let output = "";
    const child = spawn(process.execPath, [scriptPath], {
      cwd: ROOT,
      env: { ...process.env, AGENT_REPO_ROOT: ROOT },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (c) => {
      output += String(c);
    });
    child.stderr?.on("data", (c) => {
      output += String(c);
    });
    child.on("close", (code) => {
      resolve({ script: scriptName, ok: code === 0, skipped: false, output: output.trim() });
    });
    child.on("error", (err) => {
      resolve({ script: scriptName, ok: false, skipped: false, output: err.message });
    });
  });
}

/**
 * @returns {Promise<{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }>}
 */
export async function auditMobileKilitScripts() {
  const issues = [];
  if (!fileExists("components/shop/ShopEqustoChrome.tsx")) {
    return {
      check: {
        status: "skipped",
        reason: "kaynak (components/) yok — AGENT_REPO_ROOT mount edin",
        passed: 0,
        failed: 0,
        skipped: VERIFY_SCRIPTS.length,
        total: VERIFY_SCRIPTS.length,
      },
      issues: [],
    };
  }
  const results = await Promise.all(VERIFY_SCRIPTS.map(runVerifyScript));

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of results) {
    if (r.skipped) {
      skipped++;
      continue;
    }
    if (r.ok) {
      passed++;
    } else {
      failed++;
      const shortName = r.script.replace("verify-", "").replace(".mjs", "");
      issues.push(
        makeIssue({
          id: `kilit:fail:${shortName}`,
          platform: "viewport",
          severity: "high",
          type: "kilit_regression",
          area: "ui_kilit",
          message: `Mobil kilit doğrulaması başarısız: ${r.script}`,
          file: `scripts/${r.script}`,
          fix: "npm run verify:" + shortName + " ile detaylı çıktı alın",
          meta: { output: r.output.slice(0, 300) },
        }),
      );
    }
  }

  return {
    check: {
      status: failed > 0 ? "error" : "ok",
      passed,
      failed,
      skipped,
      total: VERIFY_SCRIPTS.length,
    },
    issues,
  };
}

function extractHeadSignals(html) {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || html.slice(0, 8000);
  return {
    manifest: /<link[^>]+rel=["']manifest["']/i.test(head),
    viewport: /<meta[^>]+name=["']viewport["']/i.test(head),
    themeColor: /<meta[^>]+name=["']theme-color["']/i.test(head),
    appleTouchIcon: /<link[^>]+rel=["']apple-touch-icon["']/i.test(head),
    appleWebApp: /apple-mobile-web-app-capable/i.test(head),
    eqMobileCss: /eq-mobile\.css/i.test(html),
  };
}

/**
 * @param {string} [baseUrl]
 * @returns {Promise<{ check: object, issues: import('./mobile-agent-types.mjs').MobileIssue[] }>}
 */
export async function auditLiveMobileHead(baseUrl) {
  const issues = [];
  const base = (baseUrl || process.env.MOBILE_AGENT_BASE_URL || "https://equsto.com").replace(
    /\/$/,
    "",
  );

  if (process.env.MOBILE_AGENT_SKIP_LIVE === "1") {
    return {
      check: { status: "skipped", reason: "MOBILE_AGENT_SKIP_LIVE=1" },
      issues: [],
    };
  }

  const results = [];
  for (const p of LIVE_PATHS) {
    const url = `${base}${p}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "EqustoMobileAgent/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      const signals = extractHeadSignals(html);
      results.push({ path: p, status: res.status, ...signals });

      if (res.status !== 200) {
        issues.push(
          makeIssue({
            id: `live:http_${res.status}:${p}`,
            platform: "live",
            severity: "high",
            type: "http_error",
            area: "live_head",
            message: `Canlı ${p} → HTTP ${res.status}`,
            meta: { url },
          }),
        );
        continue;
      }

      if (!signals.manifest) {
        issues.push(
          makeIssue({
            id: `live:no_manifest:${p}`,
            platform: "live",
            severity: p === "/" ? "high" : "medium",
            type: "missing_link",
            area: "live_head",
            message: `Canlı ${p} HTML'de <link rel="manifest"> yok`,
            meta: { url },
            fix: "Next.js metadata.manifest ekleyin",
          }),
        );
      }
      if (!signals.viewport) {
        issues.push(
          makeIssue({
            id: `live:no_viewport:${p}`,
            platform: "live",
            severity: "high",
            type: "missing_meta",
            area: "live_head",
            message: `Canlı ${p} viewport meta eksik`,
            meta: { url },
          }),
        );
      }
      if (!signals.appleTouchIcon && p === "/") {
        issues.push(
          makeIssue({
            id: `live:no_apple_touch:${p}`,
            platform: "ios",
            severity: "medium",
            type: "missing_link",
            area: "live_head",
            message: `Canlı ana sayfada apple-touch-icon yok`,
            meta: { url },
          }),
        );
      }
      if (!signals.eqMobileCss && (p === "/" || p.startsWith("/shop"))) {
        issues.push(
          makeIssue({
            id: `live:no_eq_mobile_css:${p}`,
            platform: "viewport",
            severity: "medium",
            type: "missing_asset",
            area: "live_head",
            message: `Canlı ${p} eq-mobile.css yüklenmiyor`,
            meta: { url },
          }),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      issues.push(
        makeIssue({
          id: `live:fetch_fail:${p}`,
          platform: "live",
          severity: "medium",
          type: "fetch_error",
          area: "live_head",
          message: `Canlı ${p} alınamadı: ${msg}`,
          meta: { url: `${base}${p}` },
        }),
      );
      results.push({ path: p, error: msg });
    }
  }

  const fetchFailed = results.every((r) => r.error);
  return {
    check: {
      status: fetchFailed ? "skipped" : issues.length > 0 ? "warn" : "ok",
      base_url: base,
      paths: results,
    },
    issues,
  };
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

/**
 * @param {import('./mobile-agent-types.mjs').MobileIssue[]} issues
 */
export function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 9;
    const sb = SEVERITY_ORDER[b.severity] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.platform.localeCompare(b.platform);
  });
}

/**
 * @param {import('./mobile-agent-types.mjs').MobileIssue[]} issues
 */
export function summarizeIssues(issues) {
  const byPlatform = {};
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const byType = {};
  for (const i of issues) {
    byPlatform[i.platform] = (byPlatform[i.platform] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    byType[i.type] = (byType[i.type] || 0) + 1;
  }
  return {
    totalIssues: issues.length,
    ...bySeverity,
    byPlatform,
    byType,
  };
}

/**
 * @param {{ skipLive?: boolean, baseUrl?: string }} [opts]
 * @returns {Promise<import('./mobile-agent-types.mjs').MobileAgentReport>}
 */
export async function runMobileAgentChecks(opts = {}) {
  const started = Date.now();

  const pwa = auditPwaManifest();
  const ios = auditAppleIos();
  const android = auditAndroid();
  const legacy = auditLegacyHtmlManifests();
  const assets = auditMobileAssets();
  const deepLinks = auditDeepLinks();
  const kilit = await auditMobileKilitScripts();
  const live = opts.skipLive
    ? { check: { status: "skipped", reason: "skipLive" }, issues: [] }
    : await auditLiveMobileHead(opts.baseUrl);

  const allIssues = sortIssues([
    ...pwa.issues,
    ...ios.issues,
    ...android.issues,
    ...legacy.issues,
    ...assets.issues,
    ...deepLinks.issues,
    ...kilit.issues,
    ...live.issues,
  ]);

  const checks = {
    pwa_manifest: pwa.check,
    apple_ios: ios.check,
    android: android.check,
    legacy_html: legacy.check,
    mobile_assets: assets.check,
    deep_links: deepLinks.check,
    ui_kilit: kilit.check,
    live_head: live.check,
  };

  const actionable = allIssues.filter((i) => i.severity !== "info");
  const overallStatus = Object.values(checks).some((c) => c.status === "error")
    ? "error"
    : actionable.some((i) => i.severity === "critical" || i.severity === "high")
      ? "warn"
      : actionable.length > 0
        ? "info"
        : "ok";

  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    status: overallStatus,
    summary: summarizeIssues(allIssues),
    checks,
    issues: allIssues.slice(0, 200),
    issueCount: allIssues.length,
    aiSummary: null,
  };
}
