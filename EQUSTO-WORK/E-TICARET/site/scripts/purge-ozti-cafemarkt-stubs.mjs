#!/usr/bin/env node
/**
 * cafemarkt UNOX stub dosyalarını sil; dept JSON'da web/manifest yoluna çevir.
 * ax-images 404 olan kodlar için OZTI_AX_PROXY kullan.
 *
 *   node scripts/purge-ozti-cafemarkt-stubs.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAFEMARKT_DIR = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const WEB_DIR = path.join(ROOT, "public/images/catalog/ozti/web");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const BAD_STUB_BYTES = 10995;
const BAD_STUB_MD5 = "6696b6d14fecffc05fb1dc0156c9f6b4";

/** ax-images yok — aynı ürün ailesi / parça fotoğrafı */
const OZTI_AX_PROXY = {
  "2919.0B390.AD01.00": "7506.0B390.00",
  "7919.47NTV.C2": "7919.47NTV.24",
  "7919.46NTV.C2": "7919.47NTV.24",
  "7919.37NTV.C2": "7919.37NTV.24",
  "7919.36NTV.C2": "7919.36NTV.24",
  "7919.27NTV.C2": "7919.26NTV.24",
  "7919.26NTV.C2": "7919.26NTV.24",
  "7919.47NTV.C1": "7919.47NTV.24",
  "7919.46NTV.C1": "7919.47NTV.24",
  "7919.37NTV.C1": "7919.37NTV.24",
  "7919.36NTV.C1": "7919.36NTV.24",
  "7919.27NTV.C1": "7919.26NTV.24",
  "9805.IM240D.NHC": "9805.IM240X.NHC",
  "9805.00IMD.00": "9805.IM45N.EHC",
  "7919.26NTV.C1": "7919.26NTV.24",
  "7919.47NTV.T1": "7919.47NTV.24",
  "7919.37NTV.T1": "7919.37NTV.24",
};

function md5File(abs) {
  return crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex");
}

function isStub(abs) {
  if (!fs.existsSync(abs)) return false;
  const bytes = fs.statSync(abs).size;
  return bytes === BAD_STUB_BYTES && md5File(abs) === BAD_STUB_MD5;
}

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function slugFile(kod) {
  return (
    "ozti-" +
    String(kod)
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function webRel(kod) {
  return `images/catalog/ozti/web/${slugFile(kod)}.jpg`;
}

function resolveKod(kod) {
  const k = normKod(kod);
  return OZTI_AX_PROXY[k] || k;
}

function bestRelForKod(kod, manifest) {
  const k = normKod(kod);
  const proxy = resolveKod(k);
  const fromMan = manifest[proxy] || manifest[k];
  if (fromMan && !fromMan.includes("/cafemarkt/")) {
    const abs = path.join(ROOT, "public", fromMan.replace(/^\//, ""));
    if (fs.existsSync(abs) && !isStub(abs)) return fromMan;
  }
  const web = webRel(proxy);
  const webAbs = path.join(ROOT, "public", web);
  if (fs.existsSync(webAbs) && !isStub(webAbs)) return web;
  if (proxy !== k) {
    const ownWeb = webRel(k);
    const ownAbs = path.join(ROOT, "public", ownWeb);
    if (fs.existsSync(ownAbs) && !isStub(ownAbs)) return ownWeb;
  }
  return "";
}

function main() {
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  let deleted = 0;
  for (const name of fs.readdirSync(CAFEMARKT_DIR)) {
    if (!/\.jpe?g$/i.test(name)) continue;
    const abs = path.join(CAFEMARKT_DIR, name);
    if (!isStub(abs)) continue;
    fs.unlinkSync(abs);
    deleted++;
  }

  let jsonFixed = 0;
  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
    const fp = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    let changed = 0;
    for (const row of rows) {
      if (!/öztiryakiler|oztiryakiler/i.test(String(row.brand || ""))) continue;
      const cur = String((row.images || [])[0] || "").replace(/\\/g, "/");
      const curAbs = cur ? path.join(ROOT, "public", cur) : "";
      if (cur && fs.existsSync(curAbs) && !isStub(curAbs)) continue;
      if (cur && fs.existsSync(curAbs)) {
        /* stub silindi */
      } else if (cur && !cur.includes("/cafemarkt/")) continue;

      const kod = String(row.sku || row.model || row.urun_kodu || "").trim();
      const next = bestRelForKod(kod, manifest);
      if (next && next !== cur) {
        row.images = [next];
        row.imageSource = "stub-purge";
        changed++;
      } else if (!next && cur) {
        row.images = [];
        changed++;
      }
    }
    if (changed) {
      fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
      jsonFixed += changed;
      console.log(file, changed);
    }
  }

  console.log("[purge-stubs] deleted", deleted, "json rows fixed", jsonFixed);
}

main();
