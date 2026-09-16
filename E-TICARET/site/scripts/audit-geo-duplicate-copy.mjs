/**
 * GEO landing metin tekrarı — aynı cümle birden fazla slug'da mı?
 *   node scripts/audit-geo-duplicate-copy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts", "out", "geo-duplicate-sentences.json");
const META_KEYS = new Set(["version", "source", "updatedAt", "notes", "_comment"]);

function loadLandings() {
  const files = [
    path.join(ROOT, "lib", "geo", "landings.json"),
    path.join(ROOT, "lib", "geo", "landings-en.json"),
  ];
  const pages = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data !== "object") continue;
    for (const [slug, item] of Object.entries(data)) {
      if (META_KEYS.has(slug) || !item || typeof item !== "object") continue;
      const body = [
        item.h1,
        item.title,
        item.description,
        item.lead,
        item.intro,
        Array.isArray(item.sections)
          ? item.sections.map((s) => [s.heading, s.body, s.html].filter(Boolean).join("\n")).join("\n")
          : "",
        item.body,
        item.content,
      ]
        .filter(Boolean)
        .join("\n");
      if (body) pages.push({ slug, file: path.basename(file), body: String(body) });
    }
  }
  return pages;
}

function sentences(text) {
  return String(text)
    .replace(/<[^>]+>/g, " ")
    .split(/[.!?\n]+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 48);
}

function main() {
  const pages = loadLandings();
  const map = new Map();
  for (const p of pages) {
    for (const s of sentences(p.body)) {
      const key = s.toLocaleLowerCase("tr-TR");
      if (!map.has(key)) map.set(key, { text: s, slugs: new Set() });
      map.get(key).slugs.add(`${p.file}:${p.slug}`);
    }
  }
  const dups = [...map.values()]
    .filter((v) => v.slugs.size >= 2)
    .map((v) => ({
      sharedBy: v.slugs.size,
      text: v.text.slice(0, 220),
      slugs: [...v.slugs].slice(0, 12),
    }))
    .sort((a, b) => b.sharedBy - a.sharedBy);

  const summary = {
    generatedAt: new Date().toISOString(),
    pages: pages.length,
    duplicateSentenceGroups: dups.length,
    top: dups.slice(0, 40),
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2), "utf8");
  console.log("[seo:geo-dup]", JSON.stringify({ pages: pages.length, groups: dups.length }, null, 2));
  console.log("[seo:geo-dup] →", OUT);
  process.exit(dups.length > 80 ? 1 : 0);
}

main();
