/**
 * geo-bodies-words.json → eq-geo-landing.js PROFILES body (hedef: 600–700 sözcük)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bodiesPath = path.join(root, "scripts/geo-bodies-words.json");
const jsPath = path.join(root, "public/eq-geo-landing.js");
const bodies = JSON.parse(fs.readFileSync(bodiesPath, "utf8"));

function wordCount(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

let fail = 0;
for (const [key, html] of Object.entries(bodies)) {
  const w = wordCount(html);
  if (w < 600 || w > 700) {
    console.warn(`[warn] ${key}: ${w} sözcük (hedef 600-700)`);
    fail++;
  } else {
    console.log(`[ok] ${key}: ${w} sözcük`);
  }
}

let js = fs.readFileSync(jsPath, "utf8");

for (const [profile, body] of Object.entries(bodies)) {
  const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const re = new RegExp(
    `(${profile}:\\s*\\{[\\s\\S]*?body:\\s*\\n?\\s*)"(?:[^"\\\\]|\\\\.)*"(\\s*,\\s*faq:)`,
    "m"
  );
  if (!re.test(js)) {
    console.error(`[fail] profile not patched: ${profile}`);
    process.exit(1);
  }
  js = js.replace(re, `$1"${escaped}"$2`);
  const profRe = new RegExp(`(${profile}:\\s*\\{)`, "m");
  if (!js.match(new RegExp(`${profile}:[\\s\\S]{0,200}skipBudget`))) {
    js = js.replace(profRe, `$1\n      skipBudget: true,`);
  }
}

js = js.replace(/\n\s*budget:\s*"[^"]*",/g, "\n      budget: null,");

fs.writeFileSync(jsPath, js);
console.log(fail ? `[apply] ${fail} profil aralık dışı` : "[apply-geo-bodies-words] eq-geo-landing.js güncellendi");
