import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTER = path.join(ROOT, "var/catalog/ekipmanlar.json");
const DEPT = path.join(ROOT, "public/data/dept/hazirlik.json");

const imgBase = "images/catalog/kitchenaid";
const imgMap = {
  "5K45SSEWH": "5k45ss.jpg",
  "5K45SSEOB": "5k45ss.jpg",
  "5K45SSEFW": "5k45ss.jpg",
  "5K45SSEBM": "5k45ss.jpg",
  "5KPM5EWH": "5kpm5.jpg",
  "5KPM5EOB": "5kpm5.jpg",
  "5KPM5EER": "5kpm5.jpg",
  "5KSM7591XEER": "5ksm7591x.jpg",
  "5KSM7591XEOB": "5ksm7591x.jpg",
  "5KSM7591XESL": "5ksm7591x.jpg",
  "5KSM7591XEWH": "5ksm7591x.jpg",
  "5KSM7990XEWH": "5ksm7990x.jpg",
  "5KSM7990XEER": "5ksm7990x.jpg",
  "5KSM7990XESL": "5ksm7990x.jpg",
  "5KSMVSA": "5ksmvsa.jpg",
  "5KSMSCA": "5ksmsca.jpg",
  "5KGM": "5kgm.jpg",
  "5KSM2FPA": "5ksm2fpa.jpg",
  "5KSMPRA": "5ksmpra.jpg",
  "5KSM1APC": "5ksm1apc.jpg",
  "5KSMPSA": "5ksmpsa.jpg",
  "5KSM1JA": "5ksm1ja.jpg",
  "5KSMPEXTA": "5ksmpexta.jpg",
  "5K7SFB": "5k7sfb.jpg",
  "5KC7SB": "5kc7sb.jpg",
};

function fmtTl(n) {
  return "₺" + new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function pct(n) {
  return "%" + Math.round(n * 100);
}

function updateRows(rows, dryRun) {
  let changed = 0, missingImg = 0, meta = [];
  for (const r of rows) {
    const sku = r.sku;
    const img = imgMap[sku];
    if (!img) { missingImg++; continue; }
    const old = {...r};
    const tl2 = Math.round(r.fiyat_tl * 1.25);
    const net2 = Math.round(tl2 / 1.2);
    const eur2 = Math.round((net2 / r.kur_eur_try) * 100) / 100;
    const oran2 = eur2 / r.liste_fiyati_eur;
    const isk2 = Math.round(100 - oran2 * 100);
    r.images = [imgBase + "/" + img];
    r.satis_fiyati_eur = eur2;
    r.satis_eur_indirimli = eur2;
    r.satis_oran = Math.round(oran2 * 100) / 100;
    r.iskonto_oran = isk2;
    r.fiyat_tl_net = net2;
    r.fiyat_tl = tl2;
    r.price = fmtTl(tl2) + " KDV dahil";
    if (r.specs && r.specs.includes("Satış oranı:")) {
      r.specs = r.specs
        .replace(/Satış oranı: %\d+ \(katalog listesi üzerinden %\d+ iskonto\)/,
          `Satış oranı: ${pct(oran2)} (katalog listesi üzerinden ${pct(isk2 / 100)} iskonto)`)
        .replace(/KDV dahil: ₺[\d.,]+/, `KDV dahil: ${fmtTl(tl2)}`);
    }
    const diff = JSON.stringify(r) !== JSON.stringify(old);
    if (diff) { changed++; meta.push({sku, from: old.fiyat_tl, to: tl2, img}); }
  }
  return {changed, missingImg, meta};
}

const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));
const dept = JSON.parse(fs.readFileSync(DEPT, "utf8"));

const kaMaster = master.filter(r => String(r.brand || "").toLowerCase() === "kitchenaid");
const kaDept = dept.filter(r => String(r.brand || "").toLowerCase() === "kitchenaid");
console.log("master rows:", kaMaster.length, "dept rows:", kaDept.length);

const dryMaster = updateRows(kaMaster, true);
const dryDept = updateRows(kaDept, true);
console.log("MASTER changed:", dryMaster.changed, "missingImg:", dryMaster.missingImg);
console.log("DEPT   changed:", dryDept.changed, "missingImg:", dryDept.missingImg);
for (const m of dryMaster.meta) console.log(" ", m.sku, m.from, "->", m.to, m.img);

if (process.argv.includes("--apply")) {
  fs.writeFileSync(MASTER, JSON.stringify(master));
  fs.writeFileSync(DEPT, JSON.stringify(dept));
  console.log("APPLIED ->", MASTER, "&", DEPT);
} else {
  console.log("dry run (--apply ile uygular)");
}