/**
 * Atalay vitrin adı: katalog tipi + model kodu.
 * Örnek: "Atalay Seri 700 AMP - 470 …" → "Makarna Pişirici AMP-470"
 * Kaynak: atalay.com.tr başlıkları + ATALAY 2025 kategori. Ölçü adın dışında kalır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const EN_PATH = path.join(ROOT, "public/data/i18n/products-en-by-id.json");

/** Uzun önek önce. Compact kod (harf+rakam) ile startsWith. */
const PREFIXES = [
  ["EAAIE", "Amerikan Izgara"],
  ["EAAIG", "Amerikan Izgara"],
  ["AAIE", "Amerikan Izgara"],
  ["AAIG", "Amerikan Izgara"],
  ["EAEI", "Izgara"],
  ["EAGI", "Izgara"],
  ["AEGL", "Izgara"],
  ["AEGI", "Izgara"],
  ["AEI", "Izgara"],
  ["AGI", "Izgara"],
  ["EALI", "Lavataşlı Izgara"],
  ["ALIG", "Lavataşlı Izgara"],
  ["ALI", "Lavataşlı Izgara"],
  ["EAEO", "Elektrikli Ocak"],
  ["AIO", "İndüksiyon Ocak"],
  ["AEO", "Elektrikli Ocak"],
  ["EAGO", "Gazlı Ocak"],
  ["AGO", "Gazlı Ocak"],
  ["EAWO", "Wok Ocak"],
  ["AWO", "Wok Ocak"],
  ["AGKO", "Kapalı Ateş Ocak"],
  ["AEKG", "Kuzine"],
  ["EAEK", "Kuzine"],
  ["EAGK", "Kuzine"],
  ["AEK", "Kuzine"],
  ["AGK", "Kuzine"],
  ["EAMPG", "Makarna Pişirici"],
  ["EAMP", "Makarna Pişirici"],
  ["AMPG", "Makarna Pişirici"],
  ["AMP", "Makarna Pişirici"],
  ["EAEF", "Fritöz"],
  ["EAGF", "Fritöz"],
  ["AEF", "Fritöz"],
  ["AGF", "Fritöz"],
  ["EAPD", "Patates Dinlendirme"],
  ["APD", "Patates Dinlendirme"],
  ["ADGC", "Döner Ocağı"],
  ["ADG", "Döner Ocağı"],
  ["ADEK", "Konveyörlü Izgara"],
  ["ADE", "Döner Ocağı"],
  ["ADRM", "Döner Robotu Masası"],
  ["ADR", "Döner Robotu"],
  ["EASFE", "Setaltı Fırın"],
  ["EASFG", "Setaltı Fırın"],
  ["ASFE", "Setaltı Fırın"],
  ["ASFG", "Setaltı Fırın"],
  ["EASB", "Sos Benmari"],
  ["ASBM", "Benmari"],
  ["ASSB", "Saladbar"],
  ["ASB", "Sos Benmari"],
  ["EAAT", "Ara Tezgah"],
  ["AAT", "Ara Tezgah"],
  ["EAST", "Alt Stand"],
  ["AST", "Alt Stand"],
  ["APFM", "Fırın Altlığı"],
  ["APME", "Piliç Çevirme"],
  ["APMG", "Piliç Çevirme"],
  ["APF", "Pizza Fırını"],
  ["AMAY", "Mayalandırma Kabini"],
  ["AKTE", "Kaynatma Tenceresi"],
  ["AKTG", "Kaynatma Tenceresi"],
  ["AKIE", "Konveyörlü Izgara"],
  ["AKEK", "Ekmek Kızartma"],
  ["AYEK", "Ekmek Kızartma"],
  ["ADTE", "Devrilir Tava"],
  ["ADTG", "Devrilir Tava"],
  ["ATKM", "Çay Makinesi"],
  ["ATM", "Tost Makinesi"],
  ["AWMC", "Waffle Makinesi"],
  ["AWM", "Waffle Makinesi"],
  ["ACIE", "Ocakbaşı Izgara"],
  ["AYOE", "Yer Ocağı"],
  ["AYOG", "Yer Ocağı"],
  ["ACAG", "Cağ Kebap Makinesi"],
  ["ADST", "Döner Kalıbı"],
  ["ADSA", "Döner Bıçağı"],
  ["ADSK", "Döner Sıkıştırma Aparatı"],
  ["ADTS", "Döner Traşlama Aparatı"],
  ["ADTA", "Döner Taşıma Arabası"],
  ["ADKM", "Döner Kaldırma Kolu"],
  ["ADK", "Döner Kalıbı"],
  ["AKF", "Kumpir Fırını"],
  ["ABA", "Banket Arabası"],
  ["ABS", "Bıçak Sterilizatörü"],
  ["AKM", "Krep Makinesi"],
  ["ABB", "Bıçak Bileme"],
  ["AKE", "El Yıkama Evyesi"],
  ["AKC", "Kahve Çekmecesi"],
  ["AKA", "Yardımcı Ekipman"],
  ["ATAT", "Tepsi Taşıma Arabası"],
  ["ASA", "Servis Arabası"],
  ["DKM", "Döner Kesme Makinesi"],
];

function compact(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function displayCode(p) {
  const sku = String(p.sku || "").trim();
  const model = String(p.model || "").trim();
  const mk = String(p.marka_urun_kodu || "").trim();
  const key = compact(mk || sku || model);
  if (key.startsWith("GN")) {
    const m = model.replace(/\s+/g, " ").trim();
    return m || sku;
  }
  let c = mk || sku || model;
  c = c
    .replace(/\s+/g, "")
    .replace(/\./g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return c.toUpperCase();
}

function typeFor(p) {
  const sku = String(p.sku || "");
  const model = String(p.model || "");
  const name = String(p.name || "");
  const key = compact(p.marka_urun_kodu || sku || model);
  const kat = ((String(p.specs || "").match(/Kategori:\s*(.+)/) || [])[1] || "");

  if (/^DKM0?1$/.test(key) || /kald[ıi]rma kolu/i.test(name)) return "Döner Kaldırma Kolu";
  if (key.startsWith("GN") && /kuzine/i.test(kat + " " + name)) return "Kuzine";
  if (key.startsWith("GN")) return "Benmari";
  if (key.startsWith("ASM")) return "Salamander";
  if (/^ATA50$/.test(key) || key.startsWith("ATIA")) return "Tabak Otomat Kartuşu";
  if (key.startsWith("ATAT") || key.startsWith("ATA")) return "Tepsi Taşıma Arabası";
  if (key.startsWith("ATN") || key.startsWith("ATI")) return "Tabak Otomat Arabası";

  for (const [pre, label] of PREFIXES) {
    if (key.startsWith(pre)) return label;
  }
  return null;
}

function fixAlt(s) {
  return String(s || "")
    .replace(/Makarna Hafllamalar/g, "Makarna Haşlamalar")
    .replace(/Lavataﬂlı/g, "Lavataşlı")
    .replace(/Lavatafllı/g, "Lavataşlı");
}

const changes = [];
const unknown = [];
let files = 0;

for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json"))) {
  const fp = path.join(DEPT, f);
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!Array.isArray(rows)) continue;
  let touched = false;
  for (const p of rows) {
    if (!/atalay/i.test(String(p.brand || ""))) continue;
    const type = typeFor(p);
    const code = displayCode(p);
    if (!type || !code) {
      unknown.push(`${p.sku || p.id} | ${p.name}`);
      continue;
    }
    const next = `${type} ${code}`.replace(/\s+/g, " ").trim();
    if (p.urun_alt_kategori) p.urun_alt_kategori = fixAlt(p.urun_alt_kategori);
    if (Array.isArray(p.kategori_yolu)) p.kategori_yolu = p.kategori_yolu.map(fixAlt);
    if (p.name !== next) {
      changes.push({ id: p.id, old: p.name, next, file: f });
      p.name = next;
      touched = true;
    }
  }
  if (touched) {
    fs.writeFileSync(fp, JSON.stringify(rows, null, 2) + "\n");
    files += 1;
  }
}

if (fs.existsSync(EN_PATH)) {
  const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
  const byId = en.byId || {};
  const nameById = new Map();
  for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json"))) {
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(rows)) continue;
    for (const p of rows) {
      if (!/atalay/i.test(String(p.brand || "")) || !p.id || !p.name) continue;
      nameById.set(p.id, p.name);
    }
  }
  let enN = 0;
  for (const [id, name] of nameById) {
    const row = byId[id];
    if (!row || row.n === name) continue;
    const prev = String(row.n || "");
    row.n = name;
    if (typeof row.s === "string" && prev && row.s.startsWith(prev)) {
      row.s = name + row.s.slice(prev.length);
    }
    enN += 1;
  }
  const tmp = EN_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(en));
  fs.renameSync(tmp, EN_PATH);
  console.log("en names", enN);
}

const byType = {};
for (const c of changes) {
  const t = c.next.replace(/\s+\S+$/, "");
  byType[t] = (byType[t] || 0) + 1;
}
console.log("changed", changes.length, "files", files);
console.log("unknown", unknown.length);
unknown.slice(0, 30).forEach((u) => console.log(" ?", u));
const dup = {};
for (const c of changes) dup[c.next] = (dup[c.next] || 0) + 1;
const dups = Object.entries(dup).filter(([, n]) => n > 1);
console.log("duplicate titles", dups.length);
dups.slice(0, 15).forEach(([n, c]) => console.log("  ", c, n));
const amp = changes.filter((c) => /AMP-470/.test(c.next));
amp.forEach((c) => console.log("AMP", c.old, "=>", c.next));
