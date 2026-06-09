#!/usr/bin/env node
/**
 * İnoksan bulaşık yıkama makinelerini siteden tamamen kaldırır.
 *
 *   node scripts/remove-inoksan-yikama.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const YIKAMA = path.join(ROOT, "public/data/dept/yikama.json");
const I18N = path.join(ROOT, "public/data/i18n/products-en-by-id.json");
const PFOS_LINKS = path.join(ROOT, "public/data/pfos-tip-shop-links.json");
const KAYNAK = "inoksan-fiyat-listesi-2026-r1";

function isInoksanRow(row) {
  return (
    row.brand === "İnoksan" ||
    row.kaynak_fiyat_listesi === KAYNAK ||
    String(row.id || "").startsWith("inoksan__")
  );
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  fs.renameSync(tmp, filePath);
}

const rows = JSON.parse(fs.readFileSync(YIKAMA, "utf8"));
const removed = rows.filter(isInoksanRow);
const kept = rows.filter((r) => !isInoksanRow(r));
const removedIds = new Set(removed.map((r) => String(r.id || "")).filter(Boolean));

writeJsonAtomic(YIKAMA, kept);

if (fs.existsSync(I18N)) {
  const i18n = JSON.parse(fs.readFileSync(I18N, "utf8"));
  let i18nRemoved = 0;
  for (const id of removedIds) {
    if (id in i18n) {
      delete i18n[id];
      i18nRemoved++;
    }
  }
  if (i18nRemoved) writeJsonAtomic(I18N, i18n);
  console.log(`  i18n: ${i18nRemoved} kayıt silindi`);
}

if (fs.existsSync(PFOS_LINKS)) {
  const root = JSON.parse(fs.readFileSync(PFOS_LINKS, "utf8"));
  const links = root.links && typeof root.links === "object" ? root.links : root;
  let linkRemoved = 0;
  for (const [tip, entry] of Object.entries(links)) {
    if (!entry || typeof entry !== "object") continue;
    const sku = String(entry.sku || "");
    const marka = String(entry.marka || entry.brand || "");
    if (sku.startsWith("INO-") || /inoksan/i.test(marka)) {
      delete links[tip];
      linkRemoved++;
    }
  }
  if (linkRemoved) writeJsonAtomic(PFOS_LINKS, root);
  console.log(`  pfos-tip-shop-links: ${linkRemoved} İnoksan bulaşık linki silindi`);
}

spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

console.log(`[remove-inoksan-yikama] silinen: ${removed.length} | kalan yıkama: ${kept.length}`);
