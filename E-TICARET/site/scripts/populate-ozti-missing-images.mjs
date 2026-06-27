#!/usr/bin/env node
/**
 * Öztiryakiler ax-images CDN 404 → yerel web/ görseli (PDF kırpım, CDN kardeş veya proxy).
 *
 *   node scripts/populate-ozti-missing-images.mjs
 *   node scripts/populate-ozti-missing-images.mjs --dept sogutma
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_DIR = path.join(ROOT, "public/images/catalog/ozti/web");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const MIN_BYTES = 8000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** CDN 404 kod → yerel kaynak (dosya adı web/ içinde veya { kod } ile CDN indir). */
const PROXY = {
  "7897.15030.09": "ozti-7897-15030-03.jpg",
  /** NTV cihazaltı — ax-images yok; çekmeceli/kapılı aile fotoğrafı (.24 havuzlu değil). */
  "7919.26NTV.C1": { kod: "7919.26NTV.24" },
  "7919.26NTV.C2": { kod: "7919.26NTV.24" },
  "7919.27NTV.C1": { kod: "7919.27NTV.24" },
  "7919.27NTV.C2": { kod: "7919.27NTV.24" },
  "7919.36NTV.C1": { kod: "7919.36NTV.24" },
  "7919.36NTV.C2": { kod: "7919.36NTV.24" },
  "7919.46NTV.C1": { kod: "7919.37NTV.C1" },
  "7919.46NTV.C2": { kod: "7919.37NTV.C2" },
  "7919.47NTV.C1": { kod: "7919.37NTV.C1" },
  "7919.47NTV.C2": { kod: "7919.37NTV.C2" },
  "7919.37NTV.T1": { kod: "7919.27NTV.T1" },
  "7919.47NTV.T1": { kod: "7919.27NTV.T1" },
  "7919.27NTV.T1": { kod: "7919.27NTV.24" },
  "79K3.06NMV.10": { kod: "7919.06NMV.00" },
  "79K4.06NMV.10": { kod: "7919.06NMV.00" },
  "9805.IM240D.NHC": { kod: "9805.IM240X.NHC" },
  /** SIMAG SDE18 — ax-images 404; SDE24 aynı seri */
  "9805.SDE18.00": "ozti-9805-sde24-00.jpg",
  "2919.0B390.AD01.00": "ozti-7506-0b390-00.jpg",
  /** WMF şebeke kiti — ax-images yok; 1100S/1300S makine görseli (Cafemarkt). */
  "9868.11986.6001": { kod: "9580.1100S.00" },
  /** İki katlı OTKFGE 12090 elektrik — ax-images yok; G/E kardeş SKU */
  "7890.12901.51": { kod: "7890.12901.55" },
  /** Tek katlı OTKFGE 12090 elektrik — ax-images yok; G/E kardeş SKU */
  "7890.12908.52": { kod: "7890.12908.54" },
  /** 700 seri kuzine 12708.12L — ax-images yok; 12908.10 aynı seri */
  "7865.N1.12708.12L": { kod: "7865.N1.12908.10" },
  /** ATS çay kazanları — ax-images 404; aynı seri kardeş model */
  "8573.CDE3S": { kod: "8573.CDE2S" },
  "8573.CDE4S": { kod: "8573.CDE2S" },
  "8573.CDE5S": { kod: "8573.CDE2S" },
  "8573.CDGE4S": { kod: "8573.CDGE3S" },
  "8573.CDGE5": { kod: "8573.CDGE3S" },
  "8573.CDGE6S": { kod: "8573.CDGE3S" },
  "8573.CSGE4S": { kod: "8573.CDGE3S" },
  "8573.CSGE5S": { kod: "8573.CDGE3S" },
  "8573.EDE3S": { kod: "8573.EDE2S" },
  "8573.ESE2S": { kod: "8573.EDE2S" },
  "8573.ESE3S": { kod: "8573.ESE3R.00" },
  /** Gurmeaid mikser — renk varyantları */
  "9810.EF705.H0": { kod: "9810.EF708.B0" },
  "9810.EF708.G0": { kod: "9810.EF708.B0" },
  "9810.EF708.S0": { kod: "9810.EF708.B0" },
  /** Sebze doğrama USD-01 + diskler — ax-images yok */
  "8840.USD01.00": { kod: "8840.USD02.00" },
  "8841.SDC10.00": { kod: "8840.USD02.00" },
  "8841.SDC20.00": { kod: "8840.USD02.00" },
  "8841.SDK10.00": { kod: "8840.USD02.00" },
  "8841.SDP10.00": { kod: "8840.USD02.00" },
};

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function slugFile(kod) {
  return (
    "ozti-" +
    kod
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function webRel(kod) {
  return `images/catalog/ozti/web/${slugFile(kod)}.jpg`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let dept = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dept") dept = args[++i] || "";
  }
  return { dept };
}

function headStatus(url) {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      { method: "HEAD", headers: { "User-Agent": UA } },
      (res) => resolve(res.statusCode || 0)
    );
    req.on("error", () => resolve(0));
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": UA } }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(false);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (buf.length < MIN_BYTES) {
            resolve(false);
            return;
          }
          fs.writeFileSync(dest, buf);
          resolve(true);
        });
      })
      .on("error", () => resolve(false));
  });
}

function hasGoodLocal(kod) {
  const p = path.join(WEB_DIR, slugFile(kod) + ".jpg");
  return fs.existsSync(p) && fs.statSync(p).size >= MIN_BYTES;
}

function collectOztiKods(dept) {
  const seen = new Set();
  const files = fs
    .readdirSync(DEPT_DIR)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => !dept || f.replace(".json", "") === dept);
  for (const file of files) {
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
    for (const row of rows) {
      if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;
      const kod = normKod(row.urun_kodu || row.sku || row.model);
      if (kod) seen.add(kod);
    }
  }
  return [...seen];
}

async function ensureBaseImages() {
  fs.mkdirSync(WEB_DIR, { recursive: true });
  const base = [
    "7919.47NTV.S0",
    "7897.15030.03",
    "7919.06NMV.00",
    "9805.IM240X.NHC",
    "7919.47NTV.T1",
  ];
  for (const kod of base) {
    const dest = path.join(WEB_DIR, slugFile(kod) + ".jpg");
    if (hasGoodLocal(kod)) continue;
    const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
    if ((await headStatus(url)) === 200) {
      await download(url, dest);
      console.log(`  cdn base ${kod}`);
    }
  }
}

function runPdfExtract(kods) {
  if (!kods.length) return;
  const py = path.join(ROOT, "scripts/extract-ozti-kods-to-web.py");
  spawnSync("python", [py, ...kods], { stdio: "inherit", cwd: ROOT });
}

function copyProxy(kod, srcName) {
  const src = path.join(WEB_DIR, srcName);
  const dest = path.join(WEB_DIR, slugFile(kod) + ".jpg");
  if (!fs.existsSync(src)) return false;
  fs.copyFileSync(src, dest);
  return fs.statSync(dest).size >= MIN_BYTES;
}

async function main() {
  const { dept } = parseArgs();
  fs.mkdirSync(WEB_DIR, { recursive: true });

  // PDF'den bilinen kodlar
  runPdfExtract(["9805.SDE18.00", "9805.00IMD.00"]);

  await ensureBaseImages();

  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  const kods = collectOztiKods(dept);
  const missing = [];
  for (const kod of kods) {
    if (hasGoodLocal(kod)) {
      manifest[kod] = webRel(kod);
      continue;
    }
    const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
    const st = await headStatus(url);
    if (st === 200) {
      const dest = path.join(WEB_DIR, slugFile(kod) + ".jpg");
      if (await download(url, dest)) {
        manifest[kod] = webRel(kod);
        console.log(`  cdn ${kod}`);
        continue;
      }
    }
    missing.push(kod);
  }

  for (const kod of missing) {
    if (hasGoodLocal(kod)) {
      manifest[kod] = webRel(kod);
      continue;
    }
    const rule = PROXY[kod];
    if (!rule) continue;
    let ok = false;
    if (typeof rule === "string") {
      ok = copyProxy(kod, rule);
    } else if (rule.kod) {
      const srcKod = rule.kod;
      const srcPath = path.join(WEB_DIR, slugFile(srcKod) + ".jpg");
      if (!fs.existsSync(srcPath)) {
        const url = `${AX}/${encodeURIComponent(srcKod)}.jpg`;
        await download(url, srcPath);
      }
      if (fs.existsSync(srcPath)) {
        ok = copyProxy(kod, slugFile(srcKod) + ".jpg");
      }
    }
    if (ok) {
      manifest[kod] = webRel(kod);
      console.log(`  proxy ${kod}`);
    } else {
      console.log(`  still missing ${kod}`);
    }
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  const localCount = fs.readdirSync(WEB_DIR).filter((f) => f.endsWith(".jpg")).length;
  console.log(`\n[ozti-missing] web/ dosya: ${localCount}, manifest: ${Object.keys(manifest).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
