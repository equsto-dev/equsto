/**
 * Kafe MVP — sadece filtreleme (rule engine yok)
 *
 * Girdi: ürün listesi, her üründe kategori + seviye
 * Çıktı: KAFE + LIGHT eşleşen ürünler
 *
 * node veri/kafe-filter-mvp/filter.mjs
 * node veri/kafe-filter-mvp/filter.mjs path/to/products.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Sabit kombinasyon — MVP tek senaryo */
export const FILTER = {
  kategori: "KAFE",
  seviye: "LIGHT",
};

function norm(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/ı/g, "I");
}

/**
 * @param {Array<{ id?: string, ad?: string, kategori: string, seviye: string }>} products
 * @param {{ kategori?: string, seviye?: string }} [criteria]
 */
export function filterProducts(products, criteria = FILTER) {
  const wantKategori = norm(criteria.kategori ?? FILTER.kategori);
  const wantSeviye = norm(criteria.seviye ?? FILTER.seviye);

  return products.filter((p) => {
    return norm(p.kategori) === wantKategori && norm(p.seviye) === wantSeviye;
  });
}

function loadProducts(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("JSON kökü dizi olmalı");
  }
  return data;
}

function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(__dirname, "products.json");

  const products = loadProducts(inputPath);
  const matched = filterProducts(products);

  const output = {
    filtre: FILTER,
    toplam: products.length,
    eslesen: matched.length,
    urunler: matched,
  };

  console.log(JSON.stringify(output, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
