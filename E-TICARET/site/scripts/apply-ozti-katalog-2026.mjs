/**
 * Öztiryakiler 2026 kataloğundan eksik ölçü, elektrik/gaz ve açıklama.
 * Dolu ölçülerin üzerine yazılmaz. Açıklama yalnızca ürün tipiyle örtüşen maddelerden gelir.
 *
 *   node scripts/apply-ozti-katalog-2026.mjs --dry
 *   node scripts/apply-ozti-katalog-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const SPECS = path.join(ROOT, "scripts/data/ozti/ozti-katalog-2026-specs.json");
const DRY = process.argv.includes("--dry");

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function hasDim(row) {
  const o = row.olculer;
  return Boolean(o && typeof o === "object" && (Number(o.genislik_mm) >= 40 || Number(o.uzunluk_mm) >= 40));
}

function families(text) {
  const t = String(text || "").toLocaleLowerCase("tr-TR");
  const f = new Set();
  if (/ind[uü]ksiyon/.test(t)) f.add("ind");
  if (/infrared|k[ıi]z[ıi]l[öo]tesi/.test(t)) f.add("ir");
  if (/frit[öo]z/.test(t)) f.add("fr");
  if (/makarna/.test(t)) f.add("mak");
  if (/[ıi]zgara/.test(t)) f.add("izg");
  if (/d[öo]ner/.test(t)) f.add("don");
  if (/kuzine/.test(t)) f.add("kuz");
  if (/ocak/.test(t)) f.add("ocak");
  if (/f[ıi]r[ıi]n/.test(t)) f.add("fir");
  if (/buzdolab|so[gğ]utucu|derin dondur/.test(t)) f.add("sog");
  if (/y[ıi]kama|bula[sş][ıi]k/.test(t)) f.add("yik");
  if (/dolap/.test(t)) f.add("dol");
  if (/bain|tahliye|s[ıi]cak su buhar/.test(t)) f.add("bain");
  if (/\bara tezgah\b|\btezgah\b/.test(t)) f.add("tezgah");
  return f;
}

function bulletFamilies(text) {
  const t = String(text || "").toLocaleLowerCase("tr-TR");
  const f = new Set();
  if (/ind[uü]ksiyon/.test(t)) f.add("ind");
  if (/infrared|k[ıi]z[ıi]l[öo]tesi/.test(t)) f.add("ir");
  if (/frit[öo]z/.test(t)) f.add("fr");
  if (/makarna/.test(t)) f.add("mak");
  if (/[ıi]zgara/.test(t)) f.add("izg");
  if (/d[öo]ner/.test(t)) f.add("don");
  if (/kuzine/.test(t)) f.add("kuz");
  if (/\bocak\b/.test(t)) f.add("ocak");
  if (/f[ıi]r[ıi]n/.test(t)) f.add("fir");
  if (/buzdolab|so[gğ]utucu|derin dondur/.test(t)) f.add("sog");
  if (/bula[sş][ıi]k|y[ıi]kama/.test(t)) f.add("yik");
  if (/dolap/.test(t)) f.add("dol");
  if (/bain|tahliye|s[ıi]cak su buhar/.test(t)) f.add("bain");
  if (/ara tezgah/.test(t)) f.add("tezgah");
  return f;
}

const SPECIFIC = new Set(["ind", "ir", "fr", "mak", "izg", "don", "sog", "yik", "bain", "tezgah", "dol", "kuz", "fir"]);

function nameAgrees(name, g, d) {
  const m = String(name || "").match(/(\d{2,4})\s*[*x×]\s*(\d{2,4})/i);
  if (!m) return true;
  let a = Number(m[1]);
  let b = Number(m[2]);
  if (Math.max(a, b) <= 160 || Math.min(a, b) < 200) {
    a *= 10;
    b *= 10;
  }
  const near = (x, y) => Math.abs(x - y) <= 80;
  return (near(a, g) && near(b, d)) || (near(a, d) && near(b, g)) || near(a, g) || near(b, d);
}

function pickBullets(bullets, row) {
  const mine = families(`${row.name || ""} ${row.category || ""}`);
  const mineSpec = [...mine].filter((x) => SPECIFIC.has(x));
  const kept = [];
  for (const b of bullets || []) {
    const text = String(b || "").replace(/\s+/g, " ").trim();
    if (text.length < 40 || text.length > 280) continue;
    if (/\d{3,4}\.[A-Z0-9]/i.test(text)) continue;
    if (/fiyat|iskonto|₺|\beur\b|\busd\b/i.test(text)) continue;
    const nameL = String(row.name || "").toLocaleLowerCase("tr-TR");
    const hot = /bain|elektrik|termostat|frit[öo]z|ocak|kuzine|f[ıi]r[ıi]n/.test(nameL);
    if (!hot && /termostat|s[ıi]cakl[ıi]k kontrol|elektrikli model|°c/.test(text.toLocaleLowerCase("tr-TR"))) continue;
    const bf = bulletFamilies(text);
    const bSpec = [...bf].filter((x) => SPECIFIC.has(x));
    if (mineSpec.length && bSpec.length && !bSpec.some((x) => mineSpec.includes(x))) continue;
    kept.push(text);
  }
  const uniq = [];
  for (const t of kept) {
    if (!uniq.some((u) => u.slice(0, 48) === t.slice(0, 48))) uniq.push(t);
  }
  return uniq.slice(0, 8);
}

function weakOrCut(row) {
  const name = String(row.name || "").trim();
  const desc = String(row.description || "").replace(/\s+/g, " ").trim();
  if (!desc || desc === name) return true;
  if (desc.length < 90) return true;
  if (!/[.!?…]$/.test(desc)) return true;
  return false;
}

function cleanVolt(raw) {
  const s = String(raw || "").replace(/\s+/g, " ");
  const m = s.match(/((?:220|230|380|400)(?:\s*[-–/]\s*(?:240|415))?\s*V(?:\s*\/\s*\d)?(?:\s*[-–]?\s*\d?\s*NPE)?(?:\s*50\s*\/\s*60|\s*50|\s*60)?\s*Hz)/i);
  if (!m) {
    const simple = s.match(/\b(220|230|380|400)\s*V\b/i);
    return simple ? simple[0].replace(/\s+/g, " ") : "";
  }
  return m[1].replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").replace("Hz", " Hz").replace(/\s+/g, " ").trim();
}

function hasLine(lines, re) {
  return lines.some((l) => re.test(String(l || "")));
}

const specJson = JSON.parse(fs.readFileSync(SPECS, "utf8"));
const byCode = new Map();
for (const [code, rec] of Object.entries(specJson.products || {})) {
  byCode.set(norm(code), rec);
}

const files = fs
  .readdirSync(DEPT)
  .filter((f) => f.endsWith(".json") && !f.includes("brema"))
  .map((f) => path.join(DEPT, f));

const stats = { ozti: 0, eslesen: 0, olcu: 0, aciklama: 0, enerji: 0, atlananOlcu: 0, adUyusmaz: 0 };
const WATCH = new Set(["7865N140703CS", "7876N14060500", "78641050205", "78851515510"]);
const samples = [];

const fileItems = [];
for (const file of files) {
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(items)) continue;
  fileItems.push({ file, items, dirty: false });
  for (const row of items) {
    if (!row || String(row.kaynak_fiyat_listesi || "") !== "ozti-fiyat-listesi-2025") continue;
    stats.ozti++;
    const rec = byCode.get(norm(row.sku || row.urun_kodu || row.model));
    if (!rec) continue;
    stats.eslesen++;

    const agree = nameAgrees(row.name, rec.g, rec.d);
    if (!hasDim(row) && rec.g && rec.d && rec.y && !agree) stats.adUyusmaz++;
    if (!hasDim(row) && rec.g && rec.d && rec.y && agree) {
      const prev = row.olculer && typeof row.olculer === "object" ? row.olculer : {};
      row.olculer = {
        ...prev,
        genislik_mm: rec.g,
        derinlik_mm: rec.d,
        yukseklik_mm: rec.y,
      };
      if (!String(row.olcu_etiket || "").trim()) row.olcu_etiket = `${rec.g}×${rec.d}×${rec.y} mm`;
      stats.olcu++;
      fileItems[fileItems.length - 1].dirty = true;
      if (samples.length < 8) {
        samples.push({ sku: row.sku, olcu: row.olcu_etiket, name: String(row.name || "").slice(0, 60) });
      }
    } else if (hasDim(row)) {
      stats.atlananOlcu++;
    }

    const lines = Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler.map(String) : [];
    const added = [];
    const kw = Number(String(rec.kw || "").replace(",", "."));
    const kwOk = kw > 0 && kw <= 200;
    if (kwOk && !hasLine(lines, /g[uü][çc]\s*:/i) && !(Number(row.olculer && row.olculer.guc_kw) > 0)) {
      const label = (kw >= 10 ? String(Math.round(kw * 10) / 10) : String(Math.round(kw * 100) / 100)).replace(".", ",") + " kW";
      if (rec.fuel === "gaz") added.push("Gaz gücü: " + label);
      else if (rec.fuel === "elektrik") added.push("Elektrik gücü: " + label);
      if (!row.olculer || typeof row.olculer !== "object") row.olculer = {};
      row.olculer.guc_kw = kw;
    }
    const volt = rec.fuel === "elektrik" ? cleanVolt(rec.volt) : "";
    if (volt && !hasLine(lines, /voltaj|gerilim/i)) added.push("Elektrik voltaj: " + volt);
    if (added.length) {
      row.teknik_ozellikler = lines.concat(added);
      stats.enerji++;
      fileItems[fileItems.length - 1].dirty = true;
    }

    if (WATCH.has(norm(row.sku))) {
      samples.push({
        sku: row.sku,
        olcu: row.olcu_etiket || "",
        enerji: (row.teknik_ozellikler || []).slice(-3),
        desc: String(row.description || "").slice(0, 220),
      });
    }

    if (weakOrCut(row)) {
      const picked = pickBullets(rec.bullets, row);
      if (picked.length) {
        const next = picked.join("\n");
        if (next !== String(row.description || "").trim()) {
          row.description = next;
          row.aciklama = next;
          stats.aciklama++;
          fileItems[fileItems.length - 1].dirty = true;
          if (samples.length < 6 || WATCH.has(norm(row.sku))) {
            samples.push({ sku: row.sku, desc: next.slice(0, 180) });
          }
        }
      }
    }
  }
}

console.log(JSON.stringify(stats, null, 2));
console.log("--- ornek ---");
for (const s of samples) console.log(JSON.stringify(s));

if (DRY) {
  console.log("dry — dosya yazılmadı");
  process.exit(0);
}

let n = 0;
for (const { file, items, dirty } of fileItems) {
  if (!dirty) continue;
  fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
  n++;
}
console.log("yazildi", n);
