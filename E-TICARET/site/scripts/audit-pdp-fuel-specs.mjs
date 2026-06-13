/**
 * PDP Gaz/Elektrik sınıflandırma denetimi — inoksan + öztiryakiler + atalay
 * Gaz ürünlerinde "Toplam Güç" kW satırının Elektrik bölümüne düşmediğini doğrular.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/ekipmanlar.json"), "utf8"));

function decode(s) {
  return String(s || "")
    .replace(/&([a-z]+);/gi, (_, n) => {
      const map = { ouml: "ö", Ouml: "Ö", uuml: "ü", deg: "°" };
      return map[n] || `&${n};`;
    })
    .trim();
}

function specKey(line) {
  return String(line || "").split(":")[0].trim().toLocaleLowerCase("tr");
}
function specVal(line) {
  return String(line || "").split(":").slice(1).join(":").trim();
}
function isGasVal(val) {
  return /kcal|mbar|\bbar\b|g31|g25|\blpg\b|\bng\b/i.test(val);
}
function isElectricVal(val) {
  return /\b\d+\s*[-–]\s*\d+\s*v|\b\d+\s*v\b|\b\d+\s*hz\b|380|230|220/i.test(val);
}

function inoksanLines(x) {
  const out = [];
  const seen = new Set();
  const add = (l) => {
    const t = decode(l);
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };
  for (const ln of x.teknik_ozellikler || []) {
    const t = decode(ln);
    if (t.length > 160) {
      const m = t.match(/TEKNİK\s*ÖZELLİKLER\s*([\s\S]+)/i);
      if (m) {
        for (const part of m[1].split(/(?=Toplam Güç|Gaz Girişi|Tüketim|Elektrik girişi|Su girişi)/i)) {
          const p = part.trim();
          if (!p) continue;
          const km = p.match(/^([^:]+?)\s+(.+)$/);
          if (km) add(`${km[1].trim()}: ${km[2].trim()}`);
        }
      }
    } else if (t.includes(":")) add(t);
  }
  const desc = decode(x.inoksan_shop_description || "");
  const dm = desc.match(/TEKNİK\s*ÖZELLİKLER\s*([\s\S]+)/i);
  if (dm) {
    for (const ln of x.teknik_ozellikler || []) {
      if (ln.includes(":") && ln.length < 160) add(decode(ln));
    }
  }
  return out;
}

function inoksanProfile(x, lines) {
  const blob = decode([x.name, x.inoksan_shop_description].join(" ")).toLocaleLowerCase("tr-TR");
  let gas = /gazl[ıi]|,\s*gaz,|\bgazli\b|kcal\/h|\blpg\b/i.test(blob);
  let electric = /elektrikli|380-50|220-50|230v|\b50\s*hz/i.test(blob);
  for (const ln of lines) {
    const k = specKey(ln);
    const v = specVal(ln).toLocaleLowerCase("tr-TR");
    if (/^gaz|gaz girişi|tüketim/.test(k) || isGasVal(v)) gas = true;
    if (/^elektrik|voltaj|frekans/.test(k) || isElectricVal(v)) electric = true;
  }
  if (/gazl[ıi]|,\s*gaz,/i.test(x.name || "") && !/elektrikli/i.test(x.name || "")) {
    gas = true;
    if (!/voltaj|frekans|elektrik girişi|\d+\s*v\b/i.test(blob)) electric = false;
  }
  return { gas, electric };
}

function routeInoksan(key, val, profile) {
  key = key.toLocaleLowerCase("tr-TR");
  if (/^elektrik\s/.test(key)) return "elk";
  if (/^gaz\s/.test(key)) return "gaz";
  if (isGasVal(val)) return "gaz";
  if (/^tüketim$|gaz girişi|sarfiyat/.test(key)) return "gaz";
  if (/voltaj|frekans|elektrik girişi|max\. elektrik/.test(key)) return "elk";
  if (/^toplam\s*g[uü][çc]|^g[uü][çc]$/.test(key)) {
    if (profile.gas && !profile.electric) return "gaz";
    if (profile.electric && !profile.gas) return "elk";
    if (/^toplam/.test(key) && profile.gas) return "gaz";
    return profile.gas ? "gaz" : "elk";
  }
  return null;
}

function auditBrand(label, filterFn) {
  const items = rows.filter(filterFn);
  const issues = [];
  for (const x of items) {
    const lines = label === "inoksan" ? inoksanLines(x) : (x.teknik_ozellikler || []).map(decode).filter((l) => l.includes(":"));
    const profile =
      label === "inoksan"
        ? inoksanProfile(x, lines)
        : {
            gas: /gazl[ıi]|\blpg\b|gaz girişi|kcal/i.test(
              decode([x.name, ...(x.teknik_ozellikler || [])].join(" "))
            ),
            electric: /elektrikli|elektrik\s|^elektrik/i.test(
              decode([x.name, ...(x.teknik_ozellikler || [])].join(" "))
            ),
          };
    if (!profile.gas || profile.electric) continue;
    const elk = [];
    const gaz = [];
    for (const ln of lines) {
      const k = specKey(ln);
      const v = specVal(ln);
      const route = label === "inoksan" ? routeInoksan(k, v, profile) : null;
      if (label === "inoksan") {
        if (route === "elk") elk.push(ln);
        else if (route === "gaz") gaz.push(ln);
      } else {
        if (/^elektrik\s|^güç$|toplam\s*güc/i.test(k) && !/^gaz/.test(k)) {
          if (/^toplam\s*g[uü]c|^güç$|^tüketim$/i.test(k) || isGasVal(v)) gaz.push(ln);
          else elk.push(ln);
        } else if (/^gaz|tüketim|kcal/i.test(k) || isGasVal(v)) gaz.push(ln);
      }
    }
    const bad = elk.filter((l) => /^toplam\s*g[uü]c|^güç$/i.test(specKey(l)) && !isElectricVal(specVal(l)));
    if (bad.length) {
      issues.push({ sku: x.sku, name: x.name, bad, gaz: gaz.slice(0, 3), elk: elk.slice(0, 3) });
    }
  }
  return { total: items.length, issues };
}

const ino = auditBrand("inoksan", (x) => String(x.brand || "").toLocaleLowerCase("tr-TR").includes("inoksan"));
const ozti = auditBrand("ozti", (x) => String(x.brand || "").includes("ztiryakiler"));
const atalay = auditBrand("atalay", (x) => /atalay/i.test(x.brand || ""));

console.log("=== PDP fuel spec audit ===");
console.log(`Inoksan: ${ino.issues.length} gas-kW-in-electric issues / ${ino.total} products`);
console.log(`Ozti: ${ozti.issues.length} issues / ${ozti.total} products`);
console.log(`Atalay: ${atalay.issues.length} issues / ${atalay.total} products`);
if (ino.issues.length) {
  console.log("\nSample Inoksan issues:");
  ino.issues.slice(0, 5).forEach((i) => console.log(`  ${i.sku}: ${i.bad.join(" | ")}`));
}
const sample = rows.find((x) => x.sku === "INO-ZMD-9DG08T");
if (sample) {
  const lines = inoksanLines(sample);
  const profile = inoksanProfile(sample, lines);
  const elk = [];
  const gaz = [];
  for (const ln of lines) {
    const r = routeInoksan(specKey(ln), specVal(ln), profile);
    if (r === "elk") elk.push(ln);
    if (r === "gaz") gaz.push(ln);
  }
  console.log("\nINO-ZMD-9DG08T after fix:");
  console.log("  profile:", profile);
  console.log("  GAZ:", gaz.join(" ; "));
  console.log("  ELK:", elk.join(" ; ") || "(empty)");
}
