#!/usr/bin/env node
/** Teknik tablosu boş kayıtları yeniden çek */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const { default: scrape } = await import(`./scrape-pimak.mjs?x=${Date.now()}`).catch(() => ({}));

// scrape-pimak main only - call via child
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";

const pagesDir = path.join(ROOT, "urun-sayfalari");
const files = await fs.readdir(pagesDir);
const broken = [];
for (const f of files) {
  if (!f.endsWith(".json")) continue;
  const data = JSON.parse(await fs.readFile(path.join(pagesDir, f), "utf8"));
  if (!data.teknikDetaylar?.satirlar?.length) broken.push(data.url);
}
console.log("Teknik tablosu boş:", broken.length);
if (broken.length) {
  const listPath = path.join(ROOT, "repair-urls.json");
  await fs.writeFile(listPath, JSON.stringify(broken, null, 2));
  console.log("Liste:", listPath);
}
