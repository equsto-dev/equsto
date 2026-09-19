/**
 * Cafemarkt / witcdn kart görseli kullanılmaz.
 * Üretici veya marka sitesinden orijinal foto.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, slugify, sleep } from "./shared.mjs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 EqustoCatalog";

const BLOCKED_HOST = /cafemarkt\.com|witcdn\.cafemarkt/i;

export function isBlockedImageUrl(url) {
  return BLOCKED_HOST.test(String(url || ""));
}

export async function downloadOfficialImage(url, destAbs) {
  if (!url || isBlockedImageUrl(url)) return false;
  if (fs.existsSync(destAbs) && fs.statSync(destAbs).size > 4000) return true;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*" } });
  if (!res.ok) return false;
  const ctype = res.headers.get("content-type") || "";
  if (ctype && !/image\//i.test(ctype)) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000) return false;
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, buf);
  return true;
}

/**
 * Rational resmi ürün fotoğrafı — rational-online.com medya.
 * CMP / SCC eski seri; bulunamazsa boş bırak (Cafemarkt'a düşme).
 */
export async function resolveRationalOfficialImage(cm, sku) {
  const relDir = "images/catalog/rational";
  const destName = `${sku}.jpg`;
  const rel = `${relDir}/${destName}`;
  const abs = path.join(ROOT, "public", rel);
  if (fs.existsSync(abs) && fs.statSync(abs).size > 4000) return rel;

  const queries = rationalSearchQueries(cm, sku);
  for (const q of queries) {
    const url = await searchRationalMedia(q);
    if (!url) continue;
    await sleep(800);
    const ok = await downloadOfficialImage(url, abs);
    if (ok) return rel.replace(/\\/g, "/");
  }
  return "";
}

function rationalSearchQueries(cm, sku) {
  const name = String(cm.name || "");
  const out = [];
  if (/ivario/i.test(name)) out.push("iVario Pro");
  else if (/icombi\s*pro/i.test(name)) out.push("iCombi Pro");
  else if (/icombi\s*classic/i.test(name)) out.push("iCombi Classic");
  else if (/cmp|combi\s*master/i.test(name)) out.push("CombiMaster Plus");
  else if (/selfcooking|scc/i.test(name)) out.push("SelfCookingCenter");
  out.push(sku);
  return [...new Set(out)];
}

async function searchRationalMedia(q) {
  const search = `https://www.rational-online.com/en_gb/search/?q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(search, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const imgs = [...html.matchAll(/https?:\/\/[^"' ]+\.(?:jpg|jpeg|png|webp)/gi)].map((m) => m[0]);
    const official = imgs.find(
      (u) => /rational-online|rational\.com|scene7|cloudinary|dam\./i.test(u) && !BLOCKED_HOST.test(u),
    );
    return official || "";
  } catch {
    return "";
  }
}

export async function resolveRobotCoupeOfficialImage(cm, sku) {
  const relDir = "images/catalog/robot-coupe";
  const destName = `${sku}.jpg`;
  const rel = `${relDir}/${destName}`;
  const abs = path.join(ROOT, "public", rel);
  if (fs.existsSync(abs) && fs.statSync(abs).size > 4000) return rel.replace(/\\/g, "/");

  const q = robotCoupeQuery(cm);
  const url = await searchRobotCoupeMedia(q);
  if (url) {
    await sleep(800);
    const ok = await downloadOfficialImage(url, abs);
    if (ok) return rel.replace(/\\/g, "/");
  }
  return "";
}

function robotCoupeQuery(cm) {
  const name = String(cm.name || "");
  const m = name.match(
    /\b(Blixer\s*\d+[^\s]*|CL\s*\d+[^\s]*|R\s*\d+[^\s]*|MP\s*\d+[^\s]*|CMP\s*\d+[^\s]*|Mini MP\s*\d+|Micromix|Robot Cook|BL\s*\d+|J\s*\d+|C\s*40)\b/i,
  );
  return m ? m[0] : name.replace(/Robot Coupe/i, "").trim().slice(0, 40);
}

async function searchRobotCoupeMedia(q) {
  const search = `https://www.robot-coupe.com/en/search?search=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(search, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const imgs = [...html.matchAll(/https?:\/\/[^"' ]+\.(?:jpg|jpeg|png|webp)/gi)].map((m) => m[0]);
    const official = imgs.find(
      (u) => /robot-coupe\.com|cloudinary|scene7|akamai/i.test(u) && !BLOCKED_HOST.test(u) && !/logo|icon|sprite/i.test(u),
    );
    return official || "";
  } catch {
    return "";
  }
}

export function localImageRel(brandSlug, sku) {
  return `images/catalog/${slugify(brandSlug)}/${sku}.jpg`;
}

export async function resolveOztiryakilerOfficialImage(cm, sku) {
  const safe = String(sku || "urun").replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 80);
  const rel = `images/catalog/oztiryakiler/${safe}.jpg`;
  const abs = path.join(ROOT, "public", rel);
  if (fs.existsSync(abs) && fs.statSync(abs).size > 4000) return rel.replace(/\\/g, "/");
  return "";
}
