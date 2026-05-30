#!/usr/bin/env node
/**
 * Atalay cafemarkt görselleri — GMC için 800×800 (-B) sürüm.
 * witcdn -K (250px) yerine -B kullanır; model eşleşmesine göre doğru SKU seçer.
 *
 *   node scripts/fetch-atalay-gmc-images.mjs --model="E AEI - 360"
 *   node scripts/fetch-atalay-gmc-images.mjs --fix-small
 *   node scripts/fetch-atalay-gmc-images.mjs --dry-run --limit=20
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-atalay.json");
const DEST_SUB = "images/catalog/atalay/cafemarkt";
const MIN_PX = 500;
const GMC_PX = 800;

const dryRun = process.argv.includes("--dry-run");
const fixSmall = process.argv.includes("--fix-small");
const modelArg = process.argv.find((a) => a.startsWith("--model="));
const modelFilter = modelArg ? modelArg.split("=")[1] : "";
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function modelNeedles(model) {
  const m = String(model || "").trim();
  const out = new Set();
  const add = (s) => {
    const n = normHay(s);
    if (n.length >= 3) out.add(n);
  };
  add(m);
  add(m.replace(/\s+/g, ""));
  add(m.replace(/\s*-\s*/g, "-"));
  if (/^E\s+/i.test(m)) add(m.replace(/^E\s+/i, "E"));
  const eMatch = m.match(/^E\s*(AEI|AGI|AAIE|ALI|AEF|AGF|ASB|AMP|AEO|AGO|AWO|ASFE|ASFG|AEK|AGK|AAT|AST)\s*-\s*(\d+)/i);
  if (eMatch) {
    add(`E${eMatch[1]}-${eMatch[2]}`);
    add(`${eMatch[1]}-${eMatch[2]}`);
    add(`EAEI${eMatch[2]}`);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

function scoreCmRow(model, cmName) {
  const needles = modelNeedles(model);
  const hay = normHay(cmName);
  const modelHay = normHay(model);
  let score = 0;
  for (const n of needles) {
    if (hay.includes(n)) score += n.length * 2;
  }
  if (/Düz/i.test(model) && /Düz Pleyt/i.test(cmName) && !/Nervürlü|ND/i.test(cmName)) score += 40;
  if (/Nervürlü|CR/i.test(model) && /Nervürlü|NCR/i.test(cmName)) score += 40;
  if (/ND/i.test(model) && /ND/i.test(cmName)) score += 30;
  if (!modelHay.includes("CR") && /Krom Yüzey|NCR|Nervürlü/i.test(cmName)) score -= 35;
  if (!modelHay.includes("N") && /Nervürlü/i.test(cmName) && !/ND/i.test(cmName)) score -= 25;
  if (modelHay === normHay("E AEI - 360") && hay === normHay("Atalay EAEI-360 600 Seri Düz Pleyt Izgara, 30x60 cm, Elektrikli")) {
    score += 100;
  }
  return score;
}

function findCmProduct(model, cmRows) {
  let best = null;
  let bestScore = 0;
  for (const p of cmRows) {
    const s = scoreCmRow(model, p["ürün_adı"] || "");
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 12 ? best : null;
}

async function searchWitCdn(q) {
  const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const re = /data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi;
  const urls = [];
  let m;
  while ((m = re.exec(html))) urls.push(m[1]);
  return [...new Set(urls)];
}

function witVariants(url) {
  return [
    url.replace(/-K\.(jpe?g)/i, "-B.$1"),
    url.replace(/-K\.(jpe?g)/i, "-O.$1"),
    url,
  ].filter((u, i, a) => a.indexOf(u) === i);
}

async function downloadBest(urls) {
  const tried = [];
  for (const base of urls) {
    for (const u of witVariants(base)) {
      if (tried.includes(u)) continue;
      tried.push(u);
      const res = await fetch(u, { headers: { "User-Agent": UA } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if ((meta.width || 0) >= MIN_PX && (meta.height || 0) >= MIN_PX) {
        return { buf, url: u, meta };
      }
    }
  }
  return null;
}

function slugFromModel(model) {
  return (
    "atalay-" +
    String(model || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\+/g, "-plus-")
      .replace(/[^a-z0-9-+]/g, "") +
    ".jpg"
  );
}

async function ensureGmcSize(buf) {
  const meta = await sharp(buf).metadata();
  if ((meta.width || 0) >= GMC_PX && (meta.height || 0) >= GMC_PX) return buf;
  const scale = Math.max(GMC_PX / (meta.width || 1), GMC_PX / (meta.height || 1), 1);
  const w = Math.ceil((meta.width || GMC_PX) * scale);
  const h = Math.ceil((meta.height || GMC_PX) * scale);
  return sharp(buf)
    .resize(w, h, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

function isAtalayRow(row) {
  return /atalay/i.test(String(row.brand || ""));
}

async function resolveForModel(model, cmRows) {
  const cm = findCmProduct(model, cmRows);
  const queries = [
    cm?.["ürün_adı"],
    model,
    ...modelNeedles(model).slice(0, 3),
  ].filter(Boolean);

  let urls = [];
  for (const q of queries) {
    urls.push(...(await searchWitCdn(q)));
    if (urls.length) break;
  }
  urls = [...new Set(urls)].filter((u) => /atalay/i.test(u));

  if (cm) {
    const hay = normHay(cm["ürün_adı"]);
    const modelHay = normHay(model);
    const scored = urls.map((u) => {
      const uh = normHay(u);
      let s = 0;
      for (const n of modelNeedles(model)) if (uh.includes(n)) s += n.length;
      if (hay.includes("DUZ") && /duz/i.test(uh)) s += 25;
      if (hay.includes("NERVURLU") && /nervur/i.test(uh)) s += 25;
      if (hay.includes("ND") && /nd/i.test(uh)) s += 20;
      if (/-B\.jpe?g$/i.test(u)) s += 5;
      if (/krom/i.test(uh) && !modelHay.includes("CR") && !modelHay.includes("KROM")) s -= 60;
      if (/nervur/i.test(uh) && !/NERV|NCR|\/N/.test(model)) s -= 50;
      if (/nd/i.test(uh) && !modelHay.includes("ND")) s -= 50;
      if (/cr/i.test(uh) && !modelHay.includes("CR")) s -= 50;
      return { u, s };
    });
    scored.sort((a, b) => b.s - a.s);
    if (scored[0]?.s > 0) urls = scored.map((x) => x.u);
  }

  const got = await downloadBest(urls.slice(0, 8));
  return got;
}

async function needsFix(rel) {
  const fp = path.join(ROOT, "public", rel.replace(/^\//, ""));
  if (!fs.existsSync(fp)) return true;
  const meta = await sharp(fp).metadata();
  return (meta.width || 0) < MIN_PX || (meta.height || 0) < MIN_PX;
}

async function main() {
  const cmRows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  fs.mkdirSync(path.join(ROOT, "public", DEST_SUB), { recursive: true });

  const deptPath = path.join(ROOT, "public/data/dept/pisirme.json");
  const rows = JSON.parse(fs.readFileSync(deptPath, "utf8"));
  let targets = rows.filter(isAtalayRow);
  if (modelFilter) {
    targets = targets.filter((r) => String(r.model || "").includes(modelFilter));
  }
  if (fixSmall) {
    const filtered = [];
    for (const r of targets) {
      const rel = (r.images || [])[0] || "";
      if (await needsFix(rel)) filtered.push(r);
    }
    targets = filtered;
  }
  if (limit > 0) targets = targets.slice(0, limit);

  const stats = { ok: 0, fail: 0, skip: 0 };

  for (const row of targets) {
    const model = String(row.model || "").trim();
    const file = slugFromModel(model);
    const rel = `${DEST_SUB}/${file}`;
    const dest = path.join(ROOT, "public", rel);

    if (!fixSmall && !modelFilter && fs.existsSync(dest)) {
      const meta = await sharp(dest).metadata();
      if ((meta.width || 0) >= MIN_PX) {
        stats.skip++;
        continue;
      }
    }

    console.log("[fetch]", model);
    try {
      const got = await resolveForModel(model, cmRows);
      if (!got) {
        console.warn("  miss");
        stats.fail++;
        continue;
      }
      const out = await ensureGmcSize(got.buf);
      if (!dryRun) fs.writeFileSync(dest, out);
      const fin = await sharp(out).metadata();
      row.images = [rel.replace(/\\/g, "/")];
      console.log("  ok", fin.width, "x", fin.height, got.url.slice(-55));
      stats.ok++;
      await new Promise((r) => setTimeout(r, 280));
    } catch (e) {
      console.warn("  err", e.message);
      stats.fail++;
    }
  }

  if (!dryRun && stats.ok) {
    fs.writeFileSync(deptPath, JSON.stringify(rows), "utf8");
    console.log("Updated pisirme.json");
  }
  console.log("[fetch-atalay-gmc-images]", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
