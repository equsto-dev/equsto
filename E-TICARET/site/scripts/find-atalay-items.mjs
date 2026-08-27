import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== ATALAY ARAMA ===");

const atalayProducts = products.filter(p => p.brand && p.brand.toLowerCase().includes("atalay"));
console.log(`Toplam Atalay ürünü: ${atalayProducts.length}`);

const ocaklar = atalayProducts.filter(p => p.name && p.name.toLowerCase().includes("ocak"));
console.log(`\nOcaklar (${ocaklar.length}):`);
ocaklar.slice(0, 10).forEach(o => {
  console.log(`SKU: ${o.sku} | Name: ${o.name} | Price: ${o.satis_fiyat_eur ?? o.price}`);
});

const fitozler = atalayProducts.filter(p => p.name && p.name.toLowerCase().includes("fritöz"));
console.log(`\nFritözler (${fitozler.length}):`);
fitozler.slice(0, 10).forEach(o => {
  console.log(`SKU: ${o.sku} | Name: ${o.name} | Price: ${o.satis_fiyat_eur ?? o.price}`);
});

const patates = atalayProducts.filter(p => p.name && p.name.toLowerCase().includes("patates"));
console.log(`\nPatates Üniteleri (${patates.length}):`);
patates.slice(0, 10).forEach(o => {
  console.log(`SKU: ${o.sku} | Name: ${o.name} | Price: ${o.satis_fiyat_eur ?? o.price}`);
});

const izgaralar = atalayProducts.filter(p => p.name && (p.name.toLowerCase().includes("ızgara") || p.name.toLowerCase().includes("plate")));
console.log(`\nIzgaralar (${izgaralar.length}):`);
izgaralar.slice(0, 10).forEach(o => {
  console.log(`SKU: ${o.sku} | Name: ${o.name} | Price: ${o.satis_fiyat_eur ?? o.price}`);
});

console.log("\n=== DIGER ARANANLAR ===");
// Dizden basmalı el yıkama evyesi
const dizden = products.filter(p => p.name && p.name.toLowerCase().includes("diz"));
console.log(`\nDizden basmalı/kumandalı (${dizden.length}):`);
dizden.slice(0, 5).forEach(d => {
  console.log(`SKU: ${d.sku} | Brand: ${d.brand} | Name: ${d.name}`);
});

// Davlumbaz orta tip filtreli
const davlumbaz = products.filter(p => p.name && p.name.toLowerCase().includes("davlumbaz") && p.name.toLowerCase().includes("orta"));
console.log(`\nDavlumbaz Orta Tip (${davlumbaz.length}):`);
davlumbaz.slice(0, 5).forEach(d => {
  console.log(`SKU: ${d.sku} | Brand: ${d.brand} | Name: ${d.name}`);
});

// Çöp arabası
const cop = products.filter(p => p.name && p.name.toLowerCase().includes("çöp"));
console.log(`\nÇöp Arabası / Kovası (${cop.length}):`);
cop.slice(0, 10).forEach(d => {
  console.log(`SKU: ${d.sku} | Brand: ${d.brand} | Name: ${d.name}`);
});
