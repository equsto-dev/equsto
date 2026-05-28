/**
 * Rational fırın tepsileri: pisirme → set-ustu-mutfak, görsel + kategori düzeltmesi.
 *   node scripts/fix-rational-trays.mjs
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");
const SETUSTU = path.join(ROOT, "public/data/dept/set-ustu-mutfak.json");
const EKIPMAN = path.join(ROOT, "public/data/ekipmanlar.json");
const WEB_DIR = path.join(ROOT, "public/images/catalog/ozti/web");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const TRAY_SKUS = new Set([
  "5RRX.60141.202",
  "5RRX.60141.204",
  "5RRX.60141.206",
  "5RRX.60141.102",
  "5RRX.60141.104",
  "5RRX.60141.106",
  "5RRX.60142.102",
  "5RRX.60142.104",
  "5RRX.60142.106",
  "5RRX.60709.43",
  "5RRX.60351.017",
]);

const NEW_CATEGORY = "kombi-konveksiyonlu-firin-aksesuarlar";
const NEW_DEPT = "set-ustu-mutfak";

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
          if (buf.length < 4000) {
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

function patchRow(row) {
  const kod = String(row.sku || row.urun_kodu || "").trim();
  row.category = NEW_CATEGORY;
  row.dept = NEW_DEPT;
  row.images = [webRel(kod)];
  const specs = String(row.specs || "");
  if (specs.includes("MUFFIN VE TIMBAL")) {
    row.specs = specs.replace(/MUFFIN VE TIMBAL KALIPLARI/g, "KOMBİ - KONVEKSİYONLU FIRIN AKSESUARLAR");
  }
  if (row.aciklama) {
    row.aciklama = String(row.aciklama).replace(
      /MUFFIN VE TIMBAL KALIPLARI/g,
      "KOMBİ - KONVEKSİYONLU FIRIN AKSESUARLAR"
    );
  }
  if (Array.isArray(row.keywords)) {
    row.keywords = row.keywords.map((k) =>
      k === "muffin-ve-timbal-kaliplari" ? NEW_CATEGORY : k
    );
    if (!row.keywords.includes(NEW_CATEGORY)) row.keywords.push(NEW_CATEGORY);
  }
  return row;
}

async function main() {
  fs.mkdirSync(WEB_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  const pisirme = JSON.parse(fs.readFileSync(PISIRME, "utf8"));
  const setUstu = JSON.parse(fs.readFileSync(SETUSTU, "utf8"));
  const setIds = new Set(setUstu.map((r) => r.id || r.sku));

  const moving = [];
  const kept = [];
  for (const row of pisirme) {
    const kod = String(row.sku || row.urun_kodu || "").trim();
    if (TRAY_SKUS.has(kod)) {
      const patched = patchRow({ ...row });
      moving.push(patched);
    } else {
      kept.push(row);
    }
  }

  let added = 0;
  for (const row of moving) {
    const kod = row.sku;
    const dest = path.join(WEB_DIR, slugFile(kod) + ".jpg");
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 4000) {
      const ok = await download(`${AX}/${encodeURIComponent(kod)}.jpg`, dest);
      console.log(ok ? `  img ${kod}` : `  img fail ${kod}`);
    }
    manifest[kod] = webRel(kod);
    if (!setIds.has(row.id)) {
      setUstu.push(row);
      setIds.add(row.id);
      added++;
    }
  }

  fs.writeFileSync(PISIRME, JSON.stringify(kept, null, 0), "utf8");
  fs.writeFileSync(SETUSTU, JSON.stringify(setUstu, null, 0), "utf8");
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");

  if (fs.existsSync(EKIPMAN)) {
    const ekip = JSON.parse(fs.readFileSync(EKIPMAN, "utf8"));
  let n = 0;
    for (const row of ekip) {
      const kod = String(row.sku || row.urun_kodu || "").trim();
      if (TRAY_SKUS.has(kod)) {
        patchRow(row);
        n++;
      }
    }
    fs.writeFileSync(EKIPMAN, JSON.stringify(ekip, null, 0), "utf8");
    console.log(`ekipmanlar.json: ${n} satır`);
  }

  console.log(`pisirme: -${moving.length}, set-ustu-mutfak: +${added}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
