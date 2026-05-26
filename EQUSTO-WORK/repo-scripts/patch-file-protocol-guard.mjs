/**
 * Vitrin HTML: file:// uyari — INLINE script (harici /eq-... yuklenmez).
 * Calistir: node scripts/patch-file-protocol-guard.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const guardPath = path.join(pub, "eq-file-protocol-guard.js");
const inlineBody = fs.readFileSync(guardPath, "utf8").trim();
const inlineTag = "<script>\n" + inlineBody + "\n</script>\n";
const externalTag = '<script src="/eq-file-protocol-guard.js"></script>\n';

function walkHtml(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkHtml(fp));
    else if (ent.name.endsWith(".html")) out.push(fp);
  }
  return out;
}

let n = 0;
for (const fp of walkHtml(pub)) {
  let html = fs.readFileSync(fp, "utf8");
  let changed = false;
  if (html.includes(externalTag.trim())) {
    html = html.split(externalTag).join(inlineTag);
    changed = true;
  } else if (!html.includes("eq-file-protocol-guard") && !html.includes("file:// ile acilinca")) {
    const m = html.match(/<head[^>]*>/i);
    if (!m) continue;
    const idx = m.index + m[0].length;
    html = html.slice(0, idx) + "\n" + inlineTag + html.slice(idx);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(fp, html, "utf8");
    console.log("[patch]", path.relative(pub, fp));
    n++;
  }
}
console.log("[patch] tamam,", n, "dosya.");
