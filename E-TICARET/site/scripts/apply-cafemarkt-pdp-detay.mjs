/**
 * Cafemarkt ürün sayfası önbelleği → rakip ürünlerin açıklama, teknik satır, ölçü, elektrik/gaz.
 * Dolu açıklama / ölçü üzerine yazılmaz.
 *
 *   node scripts/apply-cafemarkt-pdp-detay.mjs --dry
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  applyDimsToRow,
  applyEnergyLines,
  cleanMixedEnergy,
  decodeCatalogText,
  parseProductDims,
} from "./lib/pdp-katalog-specs.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const CACHE = path.join(ROOT, "scripts/data/cafemarkt-pdp/detay.jsonl");
const DRY = process.argv.includes("--dry");

const JUNK =
  /cafemarkt|kargo|taksit|sepete|fiyat|₺|\bkdv\b|indirim|kampanya|stok|whatsapp|bizi arayın|daha fazla göster|tıklayınız|garanti belgesi/i;
const TEKNIK_HEAD = /^(teknik (özellik|ozellik|bilgi|detay)|ürün özellikleri|technical)/i;
const OTHER_HEAD = /^(öne çıkan|genel özellik|özellikler|kullanım alan|açıklama|avantaj|ürün detay)/i;

function htmlToBlocks(html) {
  let s = String(html || "");
  s = s.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "\n");
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, " ¦ ");
  s = s.replace(/<\/?(tr|li|p|h[1-6]|div|br|ul|ol|table|tbody|thead)[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeCatalogText(s);
  return s
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").replace(/^[\s•·*\-–—]+/, "").trim())
    .filter((l) => l && l !== "¦");
}

function toKeyVal(line) {
  if (line.includes("¦")) {
    const cells = line.split("¦").map((c) => c.trim()).filter(Boolean);
    if (cells.length === 2) return `${cells[0]}: ${cells[1]}`;
    return "";
  }
  const semi = line.match(/^([^:;]{2,50});\s*(.+)$/);
  if (semi && !line.includes(":")) return `${semi[1].trim()}: ${semi[2].trim()}`;
  if (line.includes(":")) return line;
  const m = line.match(/^([A-Za-zÇĞİÖŞÜçğıöşü.()/\- ]{3,45}?)\s+([\d¾½~≈±].*)$/);
  if (m) return `${m[1].trim()}: ${m[2].trim()}`;
  return "";
}

const DUMP_UNIT = /\((?:mm|kw|m³|m3|kg\/h|m³\/h|lt|v)\)/gi;
const DUMP_AXIS = { boy: "Genişlik", en: "Derinlik", genişlik: "Genişlik", derinlik: "Derinlik", yükseklik: "Yükseklik" };

function specDumpLines(text) {
  const out = [];
  const num = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
  const re = /(Boy|En|Genişlik|Derinlik|Yükseklik)\s*\(mm\)\s*(\d{1,2}\.\d{3}|\d{2,4})(?![\d,])/gi;
  let m;
  while ((m = re.exec(text))) {
    const n = num(m[2]);
    if (n >= 40 && n <= 8000) out.push(`${DUMP_AXIS[m[1].toLocaleLowerCase("tr-TR")]}: ${n} mm`);
  }
  const kw = /(Elektrik gücü|Gaz Gücü[^()]{0,12})\s*\(kW\)\s*(\d+(?:,\d+)?)(?![\d.])/gi;
  while ((m = kw.exec(text))) {
    const label = /gaz/i.test(m[1]) ? "Gaz gücü" : "Elektrik gücü";
    out.push(`${label}: ${m[2]} kW`);
  }
  return out;
}

function parseBody(rec, name) {
  const blocks = [];
  for (const b of htmlToBlocks(rec.body)) {
    const plain = b.replace(/^açıklama\s*/i, "");
    if (plain.includes(" * ")) blocks.push(...plain.split(/\s*\*\s*/).map((x) => x.trim()).filter(Boolean));
    else blocks.push(b);
  }
  const nameL = name.toLocaleLowerCase("tr-TR");
  const prose = [];
  const teknik = [];
  let mode = "prose";
  for (const b of blocks) {
    if ((b.match(DUMP_UNIT) || []).length >= 2) {
      teknik.push(...specDumpLines(b));
      continue;
    }
    if (JUNK.test(b)) continue;
    if (b.toLocaleLowerCase("tr-TR") === nameL) continue;
    if (/^açıklama$/i.test(b)) continue;
    const head = b.replace(/[:：]\s*$/, "");
    if (head.length < 40 && TEKNIK_HEAD.test(head)) {
      mode = "teknik";
      continue;
    }
    if (head.length < 40 && OTHER_HEAD.test(head)) {
      mode = "prose";
      continue;
    }
    if (mode === "teknik") {
      const kv = toKeyVal(b);
      if (kv && kv.length <= 140) teknik.push(kv);
      continue;
    }
    if (b.includes("¦")) {
      const kv = toKeyVal(b);
      if (kv) teknik.push(kv);
      continue;
    }
    if (b.length < 3) continue;
    if (/^[^:]{2,40}:\s*\S/.test(b) && b.length <= 120) {
      teknik.push(b);
      continue;
    }
    prose.push(b);
  }
  for (const [k, v] of rec.features || []) {
    const line = `${decodeCatalogText(k)}: ${decodeCatalogText(v)}`;
    if (!JUNK.test(line)) teknik.push(line);
  }
  const short = [];
  for (const l of teknik) {
    const val = l.split(":").slice(1).join(":").trim();
    if (val.length > 70 || /[.!?]$/.test(val) && val.split(" ").length > 6) prose.push(l);
    else short.push(l);
  }
  const byKey = new Map();
  for (const l of short) {
    const k = l.split(":")[0].trim().toLocaleLowerCase("tr-TR");
    if (!byKey.has(k)) byKey.set(k, l);
  }
  return { prose: [...new Set(prose)], teknik: [...byKey.values()] };
}

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

function pageExactMm(teknik) {
  for (const l of teknik) {
    if (!/ebat|ölçü|olcu|boyut|dimension/i.test(l.split(":")[0])) continue;
    const m = l.match(/(\d{2,4})\s*[xX×*]\s*(\d{2,4})\s*[xX×*]\s*(\d{2,4})\s*mm/);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  return null;
}

function weakDesc(row) {
  const name = decodeCatalogText(row.name);
  const desc = decodeCatalogText(row.description);
  return !desc || desc === name || desc.length < name.length + 24;
}

function hasDim(row) {
  const o = row.olculer;
  return Boolean(o && typeof o === "object" && (Number(o.genislik_mm) >= 40 || Number(o.uzunluk_mm) >= 40));
}

const cache = new Map();
for (const line of fs.readFileSync(CACHE, "utf8").split("\n")) {
  if (!line.trim()) continue;
  try {
    const j = JSON.parse(line);
    if (j.ok && j.status === 200 && j.body) cache.set(j.url, j);
  } catch {}
}

const stats = { rakip: 0, sayfa: 0, aciklama: 0, teknik: 0, olcu: 0, enerji: 0 };
const samples = [];
const WATCH = new Set(["INT.SG0066", "M10", "FKG.42E", "FBE042", "GAL.MDF90W25L", "EMP.3545.6D"]);

for (const f of fs.readdirSync(DEPT)) {
  if (!f.endsWith(".json") || f.includes("brema")) continue;
  const file = path.join(DEPT, f);
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  let dirty = false;
  for (const row of items) {
    if (!row || row.kaynak_fiyat_listesi !== "cafemarkt-plp") continue;
    stats.rakip++;
    const rec = cache.get(row.cafemarkt_url);
    if (!rec) continue;
    stats.sayfa++;
    const before = JSON.stringify(row);
    const name = decodeCatalogText(row.name);
    const { prose, teknik } = parseBody(rec, name);

    if (weakDesc(row) && prose.join(" ").length >= 40) {
      const next = prose.join("\n").slice(0, 1800);
      row.description = next;
      row.aciklama = next;
      stats.aciklama++;
      dirty = true;
    }

    const lines = Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler.map(String) : [];
    const haveKeys = new Set(lines.map((l) => l.split(":")[0].trim().toLocaleLowerCase("tr-TR")));
    const add = teknik.filter((l) => !haveKeys.has(l.split(":")[0].trim().toLocaleLowerCase("tr-TR")));
    if (add.length) {
      row.teknik_ozellikler = lines.concat(add).slice(0, 40);
      stats.teknik++;
      dirty = true;
    }

    if (!hasDim(row)) {
      const extra = teknik.concat(prose).join("\n");
      const dims = parseProductDims(row, extra);
      if (applyDimsToRow(row, dims) && hasDim(row)) {
        stats.olcu++;
        dirty = true;
      }
    } else {
      const exact = pageExactMm(teknik);
      const o = row.olculer;
      const near = (a, b) => a > 0 && b > 0 && a !== b && Math.abs(a - b) / b <= 0.02;
      const same = (a, b) => a > 0 && a === b;
      if (exact) {
        const pairs = [
          [Number(o.genislik_mm), exact[0]],
          [Number(o.derinlik_mm), exact[1]],
          [Number(o.yukseklik_mm), exact[2]],
        ];
        if (pairs.some(([a, b]) => near(a, b)) && pairs.every(([a, b]) => near(a, b) || same(a, b))) {
          row.olculer = { ...o, genislik_mm: exact[0], derinlik_mm: exact[1], yukseklik_mm: exact[2] };
          row.olcu_etiket = `${exact[0]}×${exact[1]}×${exact[2]} mm`;
          stats.olcuKesin = (stats.olcuKesin || 0) + 1;
          dirty = true;
        }
      }
    }
    if (applyEnergyLines(row)) {
      stats.enerji++;
      dirty = true;
    }
    if (cleanMixedEnergy(row)) dirty = true;
    if (JSON.stringify(row) !== before) {
      stats.gercekDegisen = (stats.gercekDegisen || 0) + 1;
      if (process.env.CM_DIFF && (stats.gercekDegisen || 0) <= 5) {
        const b = JSON.parse(before);
        console.log("DIFF", row.sku, JSON.stringify(b.teknik_ozellikler), "=>", JSON.stringify(row.teknik_ozellikler));
        if (b.description !== row.description) console.log("  DESC", JSON.stringify(b.description).slice(0, 120), "=>", JSON.stringify(row.description).slice(0, 120));
      }
    }

    if (WATCH.has(row.sku) || Math.random() < 0.03) {
      samples.push({
        sku: row.sku,
        olcu: row.olcu_etiket || "",
        teknik: (row.teknik_ozellikler || []).slice(0, 12),
        desc: String(row.description || "").slice(0, 300),
      });
    }
  }
  if (dirty && !DRY) writeWithRetry(file, JSON.stringify(items, null, 2) + "\n");
}

console.log(JSON.stringify(stats, null, 2));
if (process.env.CM_SAMPLES) fs.writeFileSync(process.env.CM_SAMPLES, JSON.stringify(samples, null, 1));
else for (const s of samples) console.log(JSON.stringify(s, null, 1));
if (DRY) console.log("dry — yazılmadı");
