/**
 * Cafemarkt → Equsto ortak yardımcılar.
 * Mevcut apply-cafemarkt-* scriptlerine dokunmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, "../..");
export const DATA_DIR = path.join(ROOT, "scripts/data/cm-import");
export const REPORT_DIR = path.join("C:/D Disk/EQUSTO-ONE/wip/cm-import-rapor");
export const DEPT_DIR = path.join(ROOT, "public/data/dept");

export const VITRIN_ISKONTO = 0.02;
export const HAVALE_ISKONTO = 0.02;
export const DELAY_PAGE_MS = 1500;
export const DELAY_BRAND_MS = 8000;

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function normCode(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function asciiUpper(s) {
  return String(s || "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "I")
    .toLocaleUpperCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function slugify(s) {
  return asciiUpper(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function writeJson(filePath, data, pretty = true) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, pretty ? `${JSON.stringify(data, null, 2)}\n` : JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

export function formatTl(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "";
  return `₺${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function priceFromCm(cmKdvDahil) {
  const cm = Number(cmKdvDahil);
  if (!Number.isFinite(cm) || cm <= 0) {
    return { vitrin: 0, havale: 0, cm: 0 };
  }
  const vitrin = Math.round(cm * (1 - VITRIN_ISKONTO) * 100) / 100;
  const havale = Math.round(vitrin * (1 - HAVALE_ISKONTO) * 100) / 100;
  return { vitrin, havale, cm };
}

/** Cafemarkt / Özti dağıtıcı öneki: 083.9890.OCMP20.2E → 9890.OCMP20.2E ; 083.075T.00010.AD → 075T.00010.AD ; 151.2137 → 2137 */
export function stripDistributorPrefix(code) {
  let s = String(code || "").trim();
  s = s.replace(/^T1\./i, "");
  s = s.replace(/^\d{3}\./, "");
  return s;
}

export function loadBrandCsv() {
  const p = path.join("C:/D Disk/EQUSTO-ONE/wip/marka-urun-sayilari.csv");
  const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean).slice(1);
  const out = [];
  for (const line of lines) {
    const m = line.match(/^"([^"]*)","([^"]*)","([^"]*)"$/);
    if (!m) continue;
    const url = m[3];
    const slug = url.replace(/^https?:\/\/www\.cafemarkt\.com\//i, "").replace(/\/$/, "");
    out.push({ name: m[1], count: m[2] ? Number(m[2]) : null, url, slug });
  }
  return out;
}

export function brandSlug(name) {
  const rows = loadBrandCsv();
  const hit = rows.find((r) => r.name.toLocaleLowerCase("tr-TR") === String(name).toLocaleLowerCase("tr-TR"));
  if (hit?.slug) return hit.slug;
  return slugify(name);
}

export function plpCachePath(slug) {
  return path.join(DATA_DIR, `${slug}-plp.json`);
}
