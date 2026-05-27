/**
 * Canlı Öztiryakiler görsel URL doğrulama (eq-site-urls mantığı).
 *   node scripts/verify-ozti-live.mjs
 *   node scripts/verify-ozti-live.mjs --deployed  (equsto.com/eq-site-urls.js içinde oztiAx arar)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIVE_JS = "https://equsto.com/eq-site-urls.js?v=20260521oztiax";
const LIVE_DEPT = "https://equsto.com/data/dept/kahve.json";

function oztiAxImageFromWebPath(s) {
  const t = String(s || "").trim().replace(/\\/g, "/");
  const m = /^images\/catalog\/ozti\/web\/ozti-([a-z0-9-]+)\.(jpe?g|png|webp)$/i.exec(t);
  if (!m) return "";
  const parts = m[1].split("-").filter(Boolean);
  if (parts.length < 2) return "";
  const kod = parts.map((p) => p.toUpperCase()).join(".");
  return `https://oztiryakiler.com.tr/ax-images/images/${encodeURIComponent(kod)}.jpg`;
}

async function fetchText(url) {
  const { execFileSync } = await import("node:child_process");
  return execFileSync(
    "curl.exe",
    ["-k", "-sSL", "--max-time", "25", url],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
}

async function headOk(url) {
  const { execFileSync } = await import("node:child_process");
  try {
    const code = execFileSync(
      "curl.exe",
      ["-k", "-sSL", "-o", "NUL", "-w", "%{http_code}", "--max-time", "15", url],
      { encoding: "utf8" },
    ).trim();
    return code === "200";
  } catch {
    return false;
  }
}

async function main() {
  const checkDeployed = process.argv.includes("--deployed");

  if (checkDeployed) {
    const body = await fetchText(LIVE_JS);
    const has = body.includes("oztiAxImageFromWebPath");
    console.log("[live js]", LIVE_JS, "oztiAx:", has ? "OK" : "EKSIK — deploy gerekli");
    if (!has) process.exit(1);
  }

  const localJs = fs.readFileSync(path.join(ROOT, "public/eq-site-urls.js"), "utf8");
  console.log("[local js] oztiAx:", localJs.includes("oztiAxImageFromWebPath") ? "OK" : "EKSIK");

  const dept = JSON.parse(await fetchText(LIVE_DEPT));
  const oz = dept.filter((p) => /öztiryaki|oztiryaki/i.test(p.brand || ""));
  const withImg = oz.filter((p) => p.images?.length);
  let axOk = 0;
  let axFail = 0;
  let noAx = 0;

  for (const p of withImg.slice(0, 15)) {
    const raw = p.images[0];
    const ax = oztiAxImageFromWebPath(raw);
    if (!ax) {
      noAx++;
      continue;
    }
    const ok = await headOk(ax);
    if (ok) axOk++;
    else axFail++;
    console.log(ok ? "  OK" : " FAIL", p.urun_kodu || p.model, "→", ax);
  }

  console.log("\n[kahve ozti]", oz.length, "ürün,", withImg.length, "görsel yolu");
  console.log("[örnek 15] CDN HEAD ok:", axOk, "fail:", axFail, "pdf/yerel:", noAx);
  console.log("\nCanlı test: https://equsto.com/shop/kahve (deploy sonrası Ctrl+F5)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
