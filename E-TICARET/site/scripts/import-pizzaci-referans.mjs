/**
 * pizzaci-200-500-m2.xlsx (kaynak: 2025-116 Avcılar) → pfos-referans + pfos-kategoriler.json
 * Kullanım: node scripts/import-pizzaci-referans.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_VERI = path.join(SITE, "..", "..", "PFOS", "veri", "proje-veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "pizzaci";
const BANT_ID = "200-500";
const XLSX = "pizzaci-200-500-m2.xlsx";
const REFERANS_M2 = 350;
const KAYNAK_NOT = "2025-116 Pizzacı Avcılar (Murat Çaylar) · 2025-116-2.xlsx";

const POZ_RE = /^[A-Z]\d{1,2}A?$|^\d{1,3}$/;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v) {
  if (v == null) return "";
  return String(v).trim();
}
function parseAdet(raw) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : "—";
}

function parseWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 4) return;
/** PROFORMA: C=alan/bölüm, E=poz, G=ürün, K=ölçü, O=adet */

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;

function isPoz(s) {

  return POZ_RE.test(String(s).trim());

}

function cellStr(v) {

  if (v == null) return "";

  if (typeof v === "object" && "text" in v) return String(v.text).trim();

  return String(v).trim();

}

function parseAdet(raw) {

  if (raw == null || raw === "") return "—";

  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);

  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);

  return Number.isFinite(n) ? n : "—";

}



function parseWs(ws) {

  const rows = [];

  let bolum = "";

  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {

    if (rowNumber < 21) return;

    const alan = cellStr(row.getCell(3).value);

    const poz = cellStr(row.getCell(5).value);

    const ad = cellStr(row.getCell(7).value);

    const olcuRaw = row.getCell(11).value;

    const adetRaw = row.getCell(15).value;



    if (alan && !poz && !ad) {

      bolumAd = alan;

      bolum = alan.split(/[\s-]/)[0]?.trim() || alan.charAt(0);

      return;

    }

    if (!poz || !ad || !isPoz(poz)) return;

    if (/^poz$/i.test(ad) || /^ürün adı$/i.test(ad)) return;



    rows.push({

      bolum,

      bolumAd,

      poz: poz.toUpperCase(),

      ad,

      olcu: olcuRaw != null && String(olcuRaw).trim() ? String(olcuRaw).trim() : "—",