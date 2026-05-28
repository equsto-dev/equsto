#!/usr/bin/env node
/**
 * public/*.html gövdesini (chrome hariç) lib/vitrin/bodies/*.ts modüllerine çıkarır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const OUT = path.join(__dirname, "..", "lib", "vitrin", "bodies");

const DEFAULT_FILES = [
  "index.html",
  "pfos.html",
  "admin.html",
  "login.html",
  "imt300.html",
  "bar-module.html",
  "bar-design.html",
  "product.html",
];

function stripChrome(inner) {
  let s = inner;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<header class="hdr"[\s\S]*?<\/nav>\s*/i, "");
  s = s.replace(/<nav class="breadcrumb"[\s\S]*?<\/nav>\s*/i, "");
  s = s.replace(/<nav class="topnav"[\s\S]*?<\/nav>\s*/i, "");
  s = s.replace(/<footer class="footer"[\s\S]*$/i, "");
  s = s.replace(/<div class="drawer-overlay"[\s\S]*$/i, "");
  s = s.replace(/<div class="cat-drawer[\s\S]*$/i, "");
  return s.trim();
}

function extractBody(html) {
  html = html.replace(/<script>\s*\/\*\* file:\/\/[\s\S]*?<\/script>/i, "");
  const bodyStart = html.search(/<body[\s>]/i);
  const bodyEnd = html.search(/<\/body>/i);
  if (bodyStart < 0 || bodyEnd < 0) throw new Error("no body");
  let inner = html.slice(bodyStart, bodyEnd).replace(/^<body[^>]*>/i, "");
  return stripChrome(inner);
}

function toExportName(file) {
  return (
    file
      .replace(/\.html$/, "")
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/^./, (c) => c.toUpperCase()) + "BodyHtml"
  );
}

function writeModule(file, bodyHtml) {
  const base = file.replace(/\.html$/, "");
  const exportName = toExportName(file);
  const outPath = path.join(OUT, `${base}.ts`);
  const content = `/** Auto-generated from public/${file} — do not edit by hand */\nexport const ${exportName} = ${JSON.stringify(bodyHtml)};\n`;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(outPath, content, "utf8");
  console.log("wrote", outPath, `(${bodyHtml.length} chars)`);
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_FILES;

for (const file of files) {
  const p = path.join(PUBLIC, file);
  if (!fs.existsSync(p)) {
    console.warn("skip missing", file);
    continue;
  }
  let html = fs.readFileSync(p, "utf8");
  if (html.charCodeAt(0) === 0xfeff) html = html.slice(1);
  writeModule(file, extractBody(html));
}

console.log("done");
