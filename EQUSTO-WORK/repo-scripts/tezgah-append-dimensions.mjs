/**
 * Çalışma tezgahı — adında ölçü yoksa specs'ten W×D×H cm ekle.
 *   node scripts/tezgah-append-dimensions.mjs
 *   node scripts/tezgah-append-dimensions.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

function parseNum(s) {
  const n = parseFloat(String(s || "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Yanlış mm→cm dönüşümü (700×1200×850) kaldır */
function stripWrongDimSuffix(name) {
  const m = String(name || "").match(/^(.+?)\s+(\d+)×(\d+)×(\d+)\s*cm$/i);
  if (!m) return String(name || "").trim();
  const w = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  if (w >= 200 || d >= 200 || h >= 200) return m[1].trim();
  return String(name || "").trim();
}

function nameHasDim(name) {
  return /\d{2,4}\s*[x×]\s*\d{2,4}\s*[x×]\s*\d{2,3}(\s*cm)?/i.test(String(name || ""));
}

function extractDims(specs, name) {
  const hay = String(specs || "");
  const enM = hay.match(/En\s*\([^)]*\)\s*:\s*([\d.,]+)/i);
  const boyM = hay.match(/Boy\s*\([^)]*\)\s*:\s*([\d.,]+)/i);
  const yukM =
    hay.match(/Yükseklik\s*\([^)]*\)\s*:\s*([\d.,]+)/i) ||
    hay.match(/Yukseklik\s*\([^)]*\)\s*:\s*([\d.,]+)/i);
  if (enM && boyM && yukM) {
    let w = parseNum(enM[1]);
    let d = parseNum(boyM[1]);
    let h = parseNum(yukM[1]);
    if (w > 0 && d > 0 && h > 0) {
      if (w >= 200 || d >= 200 || h >= 200) {
        w = Math.round(w / 10);
        d = Math.round(d / 10);
        h = Math.round(h / 10);
      }
      return `${w}×${d}×${h} cm`;
    }
  }
  const ebat = hay.match(
    /Ebatlar?\s*:\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*[x×]\s*([\d.,]+)(?:\s*\/\s*[\d.,]+)?\s*(?:mm)?/i
  );
  if (ebat) {
    let w = parseNum(ebat[1]);
    let d = parseNum(ebat[2]);
    let h = parseNum(ebat[3]);
    if (w > 0 && d > 0 && h > 0) {
      if (w >= 200 || d >= 200 || h >= 200) {
        w = Math.round(w / 10);
        d = Math.round(d / 10);
        h = Math.round(h / 10);
      }
      return `${w}×${d}×${h} cm`;
    }
  }
  const olcuMm = hay.match(/Ölçü(?:ler)?\s*:\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*mm/i);
  if (olcuMm) {
    const w = Math.round(parseNum(olcuMm[1]) / 10);
    const d = Math.round(parseNum(olcuMm[2]) / 10);
    const h = Math.round(parseNum(olcuMm[3]) / 10);
    if (w > 0 && d > 0 && h > 0) return `${w}×${d}×${h} cm`;
  }
  const tri =
    hay.match(/Ölçü(?:ler)?\s*:\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*mm/i) ||
    hay.match(/Dimension[^:]*:\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*cm/i);
  if (tri) {
    const w = Math.round(parseNum(tri[1]));
    const d = Math.round(parseNum(tri[2]));
    const h = Math.round(parseNum(tri[3]));
    if (w > 0 && d > 0 && h > 0) return `${w}×${d}×${h} cm`;
  }
  return "";
}

function patchList(list, label) {
  let n = 0;
  for (const p of list) {
    if (!p || String(p.dept || "") !== "tezgah") continue;
    const name = stripWrongDimSuffix(p.name);
    if (APPLY && name !== p.name) p.name = name;
    if (nameHasDim(name)) continue;
    const dim = extractDims(p.specs, name);
    if (!dim) continue;
    const next = `${name} ${dim}`;
    console.log(`[${label}] ${name.slice(0, 50)} → ${dim}`);
    if (APPLY) p.name = next;
    n++;
  }
  return n;
}

const deptPath = path.join(ROOT, "public/data/dept/tezgah.json");
const dept = JSON.parse(fs.readFileSync(deptPath, "utf8"));
const deptList = Array.isArray(dept) ? dept : dept.products || [];
const nDept = patchList(deptList, "dept");

const ekPath = path.join(ROOT, "public/data/ekipmanlar.json");
const ek = JSON.parse(fs.readFileSync(ekPath, "utf8"));
const ekList = ek.products || ek;
const nEk = patchList(ekList, "ekipmanlar");

if (APPLY) {
  fs.writeFileSync(deptPath, JSON.stringify(deptList) + "\n", "utf8");
  if (ek.products) ek.products = ekList;
  fs.writeFileSync(ekPath, JSON.stringify(ek.products ? ek : ekList) + "\n", "utf8");
  console.log(`\n[apply] dept ${nDept}, ekipmanlar ${nEk}`);
} else {
  console.log(`\n[dry-run] dept ${nDept}, ekipmanlar ${nEk} — --apply ile yaz`);
}
