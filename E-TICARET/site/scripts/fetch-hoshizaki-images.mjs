#!/usr/bin/env node
/**
 * Hoshizaki (9805.*) eksik PLP görselleri — ax-images, kardeş kopya, Cafemarkt.
 *
 *   cd /d "c:\D Disk\EQUSTO-WORK\E-TICARET\site"
 *   node scripts/fetch-hoshizaki-images.mjs
 *   node scripts/fetch-hoshizaki-images.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const CAFE = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const WEB_SUB = "images/catalog/ozti/web";
const CAFE_SUB = "images/catalog/ozti/cafemarkt";
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_BYTES = 6000;
const dryRun = process.argv.includes("--dry-run");

/** ax 404 → yerel kardeş SKU */
const PROXY = {
  "9805.00IMD.00": "9805.IM240X.NHC",
  "9805.IM45CNE.HC": "9805.IM45N.EHC",
  "9805.XNEHC.32": "9805.IM240X.NHC",
  "9805.IM240N.EHC": "9805.IM240D.NHC",
  "9805.AWNE.HC": "9805.IM240A.NEH",
  "9805.XNEHC.23": "9805.IM240X.NHC",
  "9805.240HC.23": "9805.IM240D.NHC",
};

/** Cafemarkt arama — model adı */
const CAFE_QUERY = {
  "9805.IM100.HC": ["Hoshizaki IM-100CNE-HC", "IM-100CNE-HC Hoshizaki"],
  "9805.IM45CNE.HC": ["Hoshizaki IM-45CNE-HC", "IM-45CNE-HC"],
  "9805.XNEHC.32": ["Hoshizaki IM-240XNE-HC-32", "IM-240XNE-HC-32"],
  "9805.IM240N.EHC": ["Hoshizaki IM-240NE-HC", "IM-240NE-HC Hoshizaki"],
  "9805.AWNE.HC": ["Hoshizaki IM-240AWNE-HC", "IM-240AWNE-HC"],
  "9805.FM480.AKE": ["Hoshizaki FM-480AWG-HC-SB", "FM-480AKE-HC-SB Hoshizaki"],
  "9805.IM130N.EHC": ["Hoshizaki IM-130NE-HC", "IM-130NE-HC"],
  "9805.XNEHC.23": ["Hoshizaki IM-240XNE-HC-23", "IM-240XNE-HC-23"],
  "9805.240HC.23": ["Hoshizaki IM-240DNE-HC-23", "IM-240DNE-HC-23"],
  "9805.00IMD.00": ["Hoshizaki TK-IMD2", "TK-IMD2 Hoshizaki"],
};

function slugFile(kod) {
  return (
    "ozti-" +
    String(kod)
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function publicAbs(rel) {
  return path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
}

function hasGoodImage(rel) {
  const abs = publicAbs(rel);
  return fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES;
}

function extractModel(name) {
  const m = String(name || "").match(/\b(IM|FM|TK|B|KM|DCM)[- ]?[A-Z0-9-]{2,24}\b/i);
  return m ? m[0].replace(/\s+/g, "-").toUpperCase() : "";
}

function downloadAx(kod, destAbs) {
  if (dryRun) return false;
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  const url = `${AX}/${encodeURIComponent(normKod(kod))}.jpg`;
  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", destAbs, url], {
    stdio: "pipe",
  });
  return r.status === 0 && fs.existsSync(destAbs) && fs.statSync(destAbs).size >= MIN_BYTES;
}

function copyFromKod(srcKod, destKod) {
  for (const sub of [WEB_SUB, CAFE_SUB]) {
    const src = publicAbs(`${sub}/${slugFile(srcKod)}.jpg`);
    if (!fs.existsSync(src) || fs.statSync(src).size < MIN_BYTES) continue;
    const destAbs = path.join(WEB, `${slugFile(destKod)}.jpg`);
    if (dryRun) return `${WEB_SUB}/${slugFile(destKod)}.jpg`;
    fs.mkdirSync(WEB, { recursive: true });
    fs.copyFileSync(src, destAbs);
    return `${WEB_SUB}/${slugFile(destKod)}.jpg`;
  }
  return "";
}

async function searchCafemarkt(queries) {
  for (const q of queries) {
    const term = String(q || "").trim();
    if (term.length < 4) continue;
    const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(term)}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const urls = [];
      const re = /data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi;
      let m;
      while ((m = re.exec(html))) urls.push(m[1]);
      const hosh = [...new Set(urls)].filter(
        (u) => /hoshizaki/i.test(u) && !/logo|icon|menu|banner|gif/i.test(u),
      );
      if (hosh.length) return hosh[0];
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  return "";
}

async function downloadCafe(url, kod) {
  const rel = `${CAFE_SUB}/${slugFile(kod)}.jpg`;
  const dest = publicAbs(rel);
  if (hasGoodImage(rel)) return rel;
  if (dryRun) return rel;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error("too small");
  fs.mkdirSync(CAFE, { recursive: true });
  fs.writeFileSync(dest, buf);
  return rel;
}

async function resolveImage(row, preferCafe = false) {
  const kod = normKod(row.sku || row.urun_kodu);
  const cur = String((row.images || [])[0] || "");
  if (cur && hasGoodImage(cur) && !preferCafe) return { rel: cur, src: "existing" };

  const nameModel = extractModel(row.name);
  const queries = CAFE_QUERY[kod] || (nameModel ? [`Hoshizaki ${nameModel}`, nameModel] : []);

  if (preferCafe || queries.length) {
    const witUrl = await searchCafemarkt(queries);
    if (witUrl) {
      try {
        const rel = await downloadCafe(witUrl, kod);
        return { rel, src: "cafemarkt" };
      } catch (e) {
        console.warn("[hoshizaki-img] cafe dl", kod, e.message);
      }
    }
  }

  const webRel = `${WEB_SUB}/${slugFile(kod)}.jpg`;
  const webAbs = path.join(WEB, `${slugFile(kod)}.jpg`);

  if (!preferCafe && hasGoodImage(webRel)) return { rel: webRel, src: "existing" };

  if (downloadAx(kod, webAbs)) return { rel: webRel, src: "ax" };

  const proxy = PROXY[kod];
  if (proxy) {
    const copied = copyFromKod(proxy, kod);
    if (copied) return { rel: copied, src: `proxy:${proxy}` };
  }

  if (!preferCafe && queries.length) {
    const witUrl = await searchCafemarkt(queries);
    if (witUrl) {
      const rel = await downloadCafe(witUrl, kod);
      return { rel, src: "cafemarkt" };
    }
  }

  return { rel: cur, src: "miss" };
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(SOGUTMA, "utf8"));
  const upgradeCafe = process.argv.includes("--upgrade-cafe");
  const targets = rows.filter(
    (r) => r.oem_brand === "Hoshizaki" || /^9805\./i.test(String(r.sku || "")),
  );
  let changed = 0;
  const stats = { ax: 0, proxy: 0, cafemarkt: 0, miss: 0, skip: 0 };

  for (const row of targets) {
    const kod = normKod(row.sku);
    const cur = String((row.images || [])[0] || "");
    const isProxyOnly =
      upgradeCafe &&
      cur.includes("/web/") &&
      PROXY[kod] &&
      hasGoodImage(cur) &&
      !String(row.imageSource || "").includes("cafemarkt");
    if (cur && hasGoodImage(cur) && !isProxyOnly) {
      stats.skip++;
      continue;
    }

    const { rel, src } = await resolveImage(row, isProxyOnly);
    if (src === "miss" || !rel || rel === cur) {
      stats.miss++;
      console.warn("[hoshizaki-img] eksik:", kod, row.name?.slice(0, 50));
      continue;
    }

    if (!dryRun) {
      row.images = [rel];
      row.imageSource = src.startsWith("cafemarkt") ? "cafemarkt" : src;
      changed++;
    }
    if (src === "ax") stats.ax++;
    else if (src.startsWith("proxy")) stats.proxy++;
    else if (src === "cafemarkt") stats.cafemarkt++;
    console.log("[hoshizaki-img]", kod, "->", src, rel);
  }

  if (!dryRun && changed) {
    fs.writeFileSync(SOGUTMA, JSON.stringify(rows), "utf8");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log("\n[hoshizaki-img] bitti:", { changed, ...stats, dryRun });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
