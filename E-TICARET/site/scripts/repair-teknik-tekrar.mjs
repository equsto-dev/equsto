/**
 * Teknik satırlarda tekrarları temizler:
 * - birebir aynı satır (büyük/küçük harf ve boşluk farkı yok sayılır)
 * - eklenen "Elektrik gücü:/Gaz gücü:/Elektrik voltaj:/Elektrik frekans:" satırı, aynı değer başka satırda zaten varsa
 *
 *   node scripts/repair-teknik-tekrar.mjs --dry
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry");

const norm = (l) => String(l).toLocaleLowerCase("tr-TR").replace(/\s+/g, "").replace(",", ".");
const keyOf = (l) => String(l).split(":")[0].trim().toLocaleLowerCase("tr-TR");
const valOf = (l) => String(l).split(":").slice(1).join(":");

function kwValues(text) {
  const out = [];
  const s = String(text).replace(/,/g, ".");
  for (const m of s.matchAll(/(\d+(?:\.\d+)?)\s*kw\b/gi)) out.push(Number(m[1]));
  for (const m of s.matchAll(/(\d+(?:\.\d+)?)\s*(?:w|watt)\b/gi)) out.push(Number(m[1]) / 1000);
  return out;
}

const ADDED = /^(elektrik gücü|gaz gücü|elektrik voltaj|elektrik frekans):/i;
const stats = { satirSilinen: 0, urun: 0 };
const samples = [];

function writeWithRetry(file, text) {
  for (let i = 1; ; i++) {
    try {
      fs.writeFileSync(file, text);
      return;
    } catch (e) {
      if (i >= 10) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500 * i);
    }
  }
}

for (const f of fs.readdirSync(DEPT)) {
  if (!f.endsWith(".json") || f.includes("brema")) continue;
  const file = path.join(DEPT, f);
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  let dirty = false;
  for (const row of items) {
    const lines = Array.isArray(row?.teknik_ozellikler) ? row.teknik_ozellikler.map(String) : null;
    if (!lines || lines.length < 2) continue;
    const seen = new Set();
    const keep = [];
    for (const l of lines) {
      const n = norm(l);
      if (seen.has(n)) continue;
      seen.add(n);
      keep.push(l);
    }
    const out = keep.filter((l) => {
      if (!ADDED.test(l)) return true;
      const others = keep.filter((o) => o !== l && !ADDED.test(o));
      const k = keyOf(l);
      if (k.endsWith("gücü")) {
        const mine = kwValues(valOf(l));
        if (!mine.length) return true;
        const fuel = k.startsWith("gaz") ? /gaz/ : /elektrik/;
        return !others.some(
          (o) =>
            fuel.test(keyOf(o)) &&
            /g[uü][çc]/.test(keyOf(o)) &&
            kwValues(valOf(o)).some((v) => mine.some((m) => Math.abs(v - m) < 0.01)),
        );
      }
      if (k === "elektrik voltaj") {
        const v = (valOf(l).match(/\d{3}/) || [])[0];
        return !(v && others.some((o) => /volt|gerilim|elektrik|besleme/i.test(keyOf(o)) && valOf(o).includes(v)));
      }
      if (k === "elektrik frekans") {
        return !others.some((o) => /\d{2}\s*hz/i.test(o));
      }
      return true;
    });
    if (out.length !== lines.length) {
      stats.satirSilinen += lines.length - out.length;
      const removed = lines.length - keep.length;
      stats.birebirTekrar = (stats.birebirTekrar || 0) + removed;
      for (const l of keep) {
        if (out.includes(l)) continue;
        const t = "eklenen_" + keyOf(l).replace(/\s+/g, "_");
        stats[t] = (stats[t] || 0) + 1;
        if (t !== "eklenen_elektrik_frekans" && (stats["ornek_" + t] || 0) < 3) {
          stats["ornek_" + t] = (stats["ornek_" + t] || 0) + 1;
          const twin = keep.find((o) => o !== l && !ADDED.test(o) && /g[uü][çc]|volt|gerilim|elektrik|besleme/i.test(keyOf(o)));
          console.log("  ", row.sku, "|", l, "<= zaten:", twin);
        }
      }
      stats.urun++;
      if (samples.length < 12) samples.push(`${row.sku} | -${lines.filter((l) => !out.includes(l) || out.indexOf(l) !== lines.indexOf(l)).slice(0, 3).join(" ; ")}`);
      row.teknik_ozellikler = out;
      dirty = true;
    }
  }
  if (dirty && !DRY) writeWithRetry(file, JSON.stringify(items, null, 2) + "\n");
}

console.log(JSON.stringify(stats, null, 2));
for (const s of samples) console.log(s);
if (DRY) console.log("dry — yazılmadı");
