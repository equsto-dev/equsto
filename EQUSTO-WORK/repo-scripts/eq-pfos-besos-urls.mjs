/**
 * PFOS + Besos öncelik URL listesi (sitemap, IndexNow, Bing/GSC).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN } from "./eq-seo-lib.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vitrumPath = path.join(root, "public", "data", "vitrum-bars-catalogue.json");

function stripDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function moduleSlug(p) {
  if (!p) return "";
  if (p.slug) return String(p.slug).trim();
  const raw = p.code || p.name || (p.page != null ? "modul-p" + p.page : "");
  let slug = stripDiacritics(String(raw))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (p.page != null) slug = slug || "modul-p" + p.page;
  return slug;
}

/** Bing / IndexNow / manuel gönderim için tam liste */
export function pfosBesosPriorityUrls(origin = ORIGIN) {
  const base = String(origin).replace(/\/$/, "");
  const urls = [
    `${base}/pfos`,
    `${base}/en/pfos`,
    `${base}/besos`,
    `${base}/en/besos`,
    `${base}/proje-fabrikasi`,
    `${base}/bar-design.html`,
  ];
  if (fs.existsSync(vitrumPath)) {
    const cat = JSON.parse(fs.readFileSync(vitrumPath, "utf8"));
    const seen = new Set();
    for (const p of cat.products || []) {
      const slug = moduleSlug(p);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      urls.push(`${base}/besos/modul/${slug}`);
    }
  }
  return urls;
}

/** IndexNow tek istekte üst sınır */
export function pfosBesosIndexNowBatch(origin = ORIGIN, max = 100) {
  const base = String(origin).replace(/\/$/, "");
  const head = [`${base}/`, `${base}/pfos`, `${base}/besos`, `${base}/sitemap-priority.xml`];
  const rest = pfosBesosPriorityUrls(base).filter((u) => !head.includes(u));
  return [...head, ...rest].slice(0, max);
}
