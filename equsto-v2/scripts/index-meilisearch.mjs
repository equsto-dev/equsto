/**
 * public/data/dept/*.json → Meilisearch indeks (MEILISEARCH_INDEX, varsayılan equsto_products)
 *   npm run search:index
 *
 * Gerekli: MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY (.env.local)
 * Yerel: docker compose -f docker-compose.meilisearch.yml up -d
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Meilisearch } from "meilisearch";
import "./load-env.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const INDEX = process.env.MEILISEARCH_INDEX?.trim() || "equsto_products";

const host = process.env.MEILISEARCH_HOST?.trim();
const key = process.env.MEILISEARCH_MASTER_KEY?.trim();

if (!host || !key) {
  const miss = [];
  if (!host) miss.push("MEILISEARCH_HOST (boş — Cloud’daki https://….meilisearch.io adresi)");
  if (!key) miss.push("MEILISEARCH_MASTER_KEY");
  console.error("[search:index] Eksik .env.local alanları:\n  - " + miss.join("\n  - "));
  console.error("Dosya: equsto-v2/.env.local  |  bkz. docs/MEILISEARCH.md");
  process.exit(1);
}

function slugify(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-z0-9+\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/** Meilisearch id: yalnız a-z A-Z 0-9 - _ */
function meiliId(raw) {
  return String(raw || "")
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_+]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 500);
}

function productSlug(row) {
  const b = slugify(row.brand);
  const n = slugify(row.name);
  return (b ? `${b}-` : "") + n;
}

function docId(row, dept) {
  if (row.id) return meiliId(row.id);
  const sku = row.sku || row.model;
  if (sku) return meiliId(`${dept}__${sku}`);
  return meiliId(`${dept}__${productSlug(row)}`);
}

function firstImage(row) {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs[0]) return "";
  return String(imgs[0]).replace(/\\/g, "/");
}

function rowToDoc(row, deptFallback) {
  const name = String(row.name || "").trim();
  if (!name) return null;
  const dept = String(row.dept || deptFallback || "").trim();
  if (!dept) return null;
  const slug = productSlug(row);
  const id = docId(row, dept);
  return {
    id,
    slug,
    name,
    brand: String(row.brand || "").trim(),
    kaynak: String(row.kaynak || row.kaynak_fiyat_listesi || "").trim(),
    category: String(row.category || "").trim(),
    dept,
    model: String(row.model || row.sku || "").trim(),
    sku: String(row.sku || "").trim(),
    price: String(row.price || "").split("\n")[0].slice(0, 120),
    liste_fiyati_eur: Number(row.liste_fiyati_eur) || null,
    satis_eur_indirimli: Number(row.satis_eur_indirimli) || null,
    iskonto_oran: Number(row.iskonto_oran) || null,
    image: firstImage(row),
    url: `/shop/${dept}/${slug}`,
    specs: [
      String(row.specs || ""),
      Array.isArray(row.keywords) ? row.keywords.join(" ") : "",
      String(row.aciklama || ""),
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 4000),
  };
}

/** Canlı katalog: vitrin ile aynı — ekipmanlar.json, yoksa dept. Arşiv kullanılmaz. */
function loadCatalogRows() {
  const docs = [];
  const seen = new Set();
  const ekipPath = path.join(ROOT, "public/data/ekipmanlar.json");

  function pushRow(row, deptFallback) {
    const doc = rowToDoc(row, deptFallback);
    if (!doc || seen.has(doc.id)) return;
    seen.add(doc.id);
    docs.push(doc);
  }

  if (fs.existsSync(ekipPath)) {
    const rows = JSON.parse(fs.readFileSync(ekipPath, "utf8"));
    if (Array.isArray(rows) && rows.length) {
      for (const row of rows) pushRow(row, "");
      console.log("[search:index] kaynak: public/data/ekipmanlar.json");
      return docs;
    }
  }

  if (!fs.existsSync(DEPT_DIR)) {
    console.warn("[search:index] dept klasörü yok:", DEPT_DIR);
    return docs;
  }
  for (const file of fs.readdirSync(DEPT_DIR)) {
    if (!file.endsWith(".json")) continue;
    const dept = file.replace(/\.json$/, "");
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
    if (!Array.isArray(rows)) continue;
    for (const row of rows) pushRow(row, dept);
  }
  console.log("[search:index] kaynak: public/data/dept/*.json");
  return docs;
}

async function main() {
  const client = new Meilisearch({ host, apiKey: key });
  try {
    await client.health();
  } catch (e) {
    console.error("[search:index] Meilisearch erişilemiyor:", host, e?.message || e);
    process.exit(1);
  }

  const documents = loadCatalogRows();
  if (!documents.length) {
    console.error("[search:index] 0 belge — dept JSON boş mu?");
    process.exit(1);
  }

  const index = client.index(INDEX);
  try {
    await client.createIndex(INDEX, { primaryKey: "id" });
  } catch {
    /* zaten var */
  }

  await index.updateSettings({
    searchableAttributes: [
      "name",
      "brand",
      "category",
      "dept",
      "model",
      "sku",
      "specs",
    ],
    displayedAttributes: [
      "id",
      "slug",
      "name",
      "brand",
      "dept",
      "category",
      "model",
      "sku",
      "price",
      "liste_fiyati_eur",
      "satis_eur_indirimli",
      "iskonto_oran",
      "image",
      "url",
    ],
    filterableAttributes: ["dept", "brand", "category", "kaynak"],
    sortableAttributes: ["name", "brand"],
  });

  const del = await index.deleteAllDocuments();
  console.log("[search:index] eski belgeler siliniyor, task", del.taskUid);
  const delDone = await client.tasks.waitForTask(del.taskUid, {
    timeout: 600_000,
    interval: 2_000,
  });
  if (delDone.status === "failed") {
    console.error("[search:index] silme hatası:", delDone.error?.message || delDone);
    process.exit(1);
  }

  const task = await index.addDocuments(documents);
  console.log("[search:index] task", task.taskUid, "→", documents.length, "belge");

  const finished = await client.tasks.waitForTask(task.taskUid, {
    timeout: 600_000,
    interval: 2_000,
  });
  if (finished.status === "failed") {
    console.error("[search:index] indeksleme hatası:", finished.error?.message || finished);
    process.exit(1);
  }

  const stats = await index.getStats();
  console.log(
    "[search:index] tamam —",
    stats.numberOfDocuments,
    "belge,",
    host,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
