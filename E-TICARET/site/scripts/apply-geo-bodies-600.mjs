/**
 * geo-bodies-600.json → eq-geo-landing.js PROFILES body + skipBudget
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bodiesPath = path.join(root, "scripts/geo-bodies-600.json");
const jsPath = path.join(root, "public/eq-geo-landing.js");
const bodies = JSON.parse(fs.readFileSync(bodiesPath, "utf8"));

for (const [key, html] of Object.entries(bodies)) {
  const plain = html.replace(/<[^>]+>/g, "");
  const len = plain.length;
  if (len < 600 || len > 700) {
    console.warn(`[warn] ${key}: ${len} karakter (hedef 600-700)`);
  } else {
    console.log(`[ok] ${key}: ${len}`);
  }
}

let js = fs.readFileSync(jsPath, "utf8");

js = js.replace(
  /\(budget \? '<p class="eq-geo-budget">[\s\S]*?" : ""\)/,
  '(false ? "" : "")'
);

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
  if (!js.includes(`${profile}: {`)) continue;
  if (!js.includes(`skipBudget: true`) || !js.match(new RegExp(`${profile}:[\\s\\S]{0,120}skipBudget`))) {
    js = js.replace(profRe, `$1\n      skipBudget: true,`);
  }
}

js = js.replace(/\n\s*budget:\s*"[^"]*",/g, "\n      budget: null,");
js = js.replace(/\n\s*budget:\s*"[^"]*"\n/g, "\n      budget: null,\n");

fs.writeFileSync(jsPath, js);
console.log("[apply-geo-bodies-600] eq-geo-landing.js güncellendi");
