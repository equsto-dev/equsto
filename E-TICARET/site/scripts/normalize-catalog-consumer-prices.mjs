#!/usr/bin/env node
/**
 * Katalog price alanını tek satır "₺… KDV dahil" yapar (vitrin + arama).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const EKIP = path.join(ROOT, "var/catalog/ekipmanlar.json");

function parseTr(raw) {
  const cleaned = String(raw || "")
    .replace(/₺/g, "")
    .replace(/\+?\s*KDV.*/gi, "")
    .replace(/KDV\s*dahil/gi, "")
    .trim()
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

function kdvDahilFromRow(row) {
  if (!row || row.fiyat_bekleniyor) return 0;
  const ft = Number(row.fiyat_tl);
  if (ft > 0) return Math.round(ft * 100) / 100;
  const full = String(row.price || "");
  const dahil = full.match(/K\s*D\s*V\s*[Dd]ahil[^\d]*([\d.,]+)/i);
  if (dahil) {
    const v = parseTr(dahil[1]);
    if (v > 0) return v;
  }
  const line0 = full.split("\n")[0] || "";
  if (/\+?\s*K\s*D\s*V/i.test(line0)) {
    const net = parseTr(line0);
    if (net > 0) return Math.round(net * 1.2 * 100) / 100;
  }
  if (/KDV\s*dahil/i.test(line0)) return parseTr(line0);
  return parseTr(line0);
}

function fmtTry(n) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeRow(row) {
  if (!row) return false;
  if (row.fiyat_bekleniyor || /teklif\s+için/i.test(String(row.price || ""))) return false;
  const kdv = kdvDahilFromRow(row);
  if (!(kdv > 0)) return false;
  const next = `₺${fmtTry(kdv)} KDV dahil`;
  if (row.price === next) return false;
  row.price = next;
  row.fiyat_tl = Math.round(kdv);
  return true;
}

function processFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) return 0;
  let n = 0;
  for (const row of data) {
    if (normalizeRow(row)) n++;
  }
  if (n > 0) {
    fs.writeFileSync(file, JSON.stringify(data) + "\n", "utf8");
  }
  return n;
}

let total = 0;
for (const f of fs.readdirSync(DEPT_DIR)) {
  if (!f.endsWith(".json")) continue;
  const n = processFile(path.join(DEPT_DIR, f));
  if (n) console.log(`[normalize-price] ${f}: ${n}`);
  total += n;
}
if (fs.existsSync(EKIP)) {
  const n = processFile(EKIP);
  console.log(`[normalize-price] ekipmanlar.json: ${n}`);
  total += n;
}
console.log(`[normalize-price] OK — ${total} satır güncellendi`);
