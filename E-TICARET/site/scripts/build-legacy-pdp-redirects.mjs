/**
 * Eski PDP slug → kanonik /shop/{dept}/{slug} eşlemesi (proxy + GSC 404).
 *   node scripts/build-legacy-pdp-redirects.mjs
 *   npm run legacy-pdp:build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SHOP_DEPTS,
  catalogSlug,
  foldTr,
  loadEkipmanlar,
  resolveDept,
  slugifyPart,
} from "./lib/sitemap-entities.mjs";

const SHOP_DEPT_SET = new Set(SHOP_DEPTS);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(PUBLIC, "data", "legacy-pdp-redirects.json");

function legacyMeiliPathSlug(row) {
  const b = slugifyPart(row.brand);
  const n = slugifyPart(row.name);
  return (b ? `${b}-` : "") + n;
}

function normCanonSlug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Alias anahtarı — `__` korunur (GSC eski URL formatı) */
function normAliasKey(s) {
  return String(s || "").trim().toLowerCase();
}

function collectLegacyAliases(row) {
  const canon = normCanonSlug(catalogSlug(row));
  const out = new Set();
  const id = String(row.id || "").trim().toLowerCase();

  const add = (s) => {
    const key = normAliasKey(s);
    if (key && normCanonSlug(key) !== canon && key !== canon) out.add(key);
  };

  add(legacyMeiliPathSlug(row));
  if (id) {
    add(id.replace(/\//g, "-"));
    add(id.replace(/__/g, "-"));
    if (id.includes("__")) {
      const [brand, tail] = id.split("__", 2);
      add(`${brand}__${tail}`);
      add(`${brand}__${tail.replace(/\//g, "-")}`);
      add(tail);
      add(tail.replace(/\//g, "-"));
      add(`${brand}-${tail.replace(/\//g, "-")}`);
    }
  }

  const sku = String(row.sku || row.model || row.urun_kodu || row.stok_no || "").trim();
  if (sku) {
    add(
      foldTr(sku)
        .replace(/\./g, "-")
        .replace(/[^a-z0-9+\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }

  return { canon, aliases: [...out] };
}

function main() {
  const rows = loadEkipmanlar(PUBLIC);
  /** slug → /shop/{dept}/{canonSlug} (ilk eşleşme kazanır) */
  const map = Object.create(null);
  let products = 0;
  let aliases = 0;

  for (const row of rows) {
    if (!row?.name) continue;
    const dept = resolveDept(row);
    if (!SHOP_DEPT_SET.has(dept)) continue;
    const { canon, aliases: legacy } = collectLegacyAliases(row);
    if (!canon) continue;
    products += 1;
    const dest = `/shop/${dept}/${canon}`;
    for (const alias of legacy) {
      if (map[alias] && map[alias] !== dest) continue;
      map[alias] = dest;
      aliases += 1;
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ builtAt: new Date().toISOString(), products, aliases, redirects: map }),
    "utf8",
  );
  console.log(`legacy-pdp-redirects: ${products} products, ${aliases} alias → ${OUT}`);
}

main();
