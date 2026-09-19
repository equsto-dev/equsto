#!/usr/bin/env node
/**
 * Krom Mutfak San. Tic. A.Ş. → Kroom + Brema katalog görsellerini bağla.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const BREMA_DIR = path.join(ROOT, "public/images/catalog/brema");
const OLD = "Krom Mutfak San. Tic. A.Ş.";
const NEW = "Kroom";

const files = fs.existsSync(BREMA_DIR)
  ? fs.readdirSync(BREMA_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !/placeholder/i.test(f))
  : [];

function norm(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/b-?küp|b-?kup/gi, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function resolveBremaImage(row) {
  const candidates = [row.model, row.sku, row.name]
    .filter(Boolean)
    .map((x) =>
      String(x)
        .replace(/^BREMA\s+/i, "")
        .replace(/^BRE-/i, "")
        .replace(/\s*KÜP.*$/i, "")
        .replace(/\s*BUZ.*$/i, "")
        .trim(),
    );
  const norms = candidates.map(norm).filter(Boolean);

  for (const f of files) {
    const base = f.replace(/\.(jpe?g|png|webp)$/i, "");
    const fn = norm(base);
    for (const n of norms) {
      if (!n) continue;
      if (fn === n || fn.includes(n) || n.includes(fn)) {
        return `images/catalog/brema/${f}`;
      }
    }
  }

  // CB249 A HC B-QUBE ↔ cb249-a-hc-b-qube
  for (const f of files) {
    const fn = norm(f.replace(/\.(jpe?g|png|webp)$/i, ""));
    for (const c of candidates) {
      const compact = norm(String(c).replace(/\s+/g, ""));
      if (compact && (fn === compact || fn.startsWith(compact) || compact.startsWith(fn))) {
        return `images/catalog/brema/${f}`;
      }
    }
  }
  return "";
}

let renamed = 0;
let imaged = 0;
let noImg = 0;

for (const file of fs.readdirSync(DEPT).filter((f) => f.endsWith(".json") && !f.includes("_items"))) {
  const fp = path.join(DEPT, file);
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!Array.isArray(rows)) continue;
  let changed = false;

  for (const row of rows) {
    const isKrom =
      row.brand === OLD ||
      row.brand === NEW ||
      /krom\s*mutfak/i.test(String(row.brand || ""));
    if (!isKrom) continue;

    if (row.brand !== NEW) {
      row.brand = NEW;
      renamed++;
      changed = true;
    }
    if (!row.oem_brand || /krom/i.test(String(row.oem_brand))) {
      row.oem_brand = "Brema";
      changed = true;
    }

    const cur = String(row.image || (row.images && row.images[0]) || "");
    const bad = !cur || /placeholder/i.test(cur) || !fs.existsSync(path.join(ROOT, "public", cur.replace(/^\/+/, "")));
    if (bad) {
      const rel = resolveBremaImage(row);
      if (rel) {
        row.image = rel;
        row.images = [rel];
        imaged++;
        changed = true;
      } else {
        noImg++;
        console.warn("[kroom] no image", row.id, row.model || row.sku);
      }
    }
  }

  if (changed) fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
}

console.log({ renamed, imaged, noImg });
spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], { cwd: ROOT, stdio: "inherit" });
