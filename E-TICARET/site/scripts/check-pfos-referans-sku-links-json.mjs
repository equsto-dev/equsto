/**
 * pfos-referans-sku-links.json şema doğrulama (CI — DB gerekmez)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "pfos-referans-sku-links.json",
);

function fail(msg) {
  console.error(`[pfos:referans-sku-links:check] HATA: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(JSON_PATH)) {
  fail(`Dosya yok: ${JSON_PATH}`);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
} catch (e) {
  fail(`JSON parse: ${e instanceof Error ? e.message : e}`);
}

if (typeof data.version !== "number") {
  fail("version alanı sayı olmalı");
}

if (!data.links || typeof data.links !== "object" || Array.isArray(data.links)) {
  fail("links nesnesi zorunlu");
}

const keys = Object.keys(data.links);
let badKeys = 0;
let badSku = 0;

for (const key of keys) {
  if (!/^[^|]+\|[^|]+$/i.test(key)) badKeys += 1;
  const entry = data.links[key];
  if (!entry || typeof entry !== "object") {
    badSku += 1;
    continue;
  }
  if (typeof entry.sku !== "string" || !entry.sku.trim()) badSku += 1;
}

if (badKeys > 0) {
  fail(`${badKeys} geçersiz link anahtarı (beklenen: listeKey|POZ)`);
}

if (badSku > 0) {
  fail(`${badSku} kayıtta sku eksik veya geçersiz`);
}

console.log(
  `[pfos:referans-sku-links:check] OK — v${data.version}, ${keys.length} link`,
);
