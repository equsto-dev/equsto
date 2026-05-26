import fs from "node:fs";
const h = fs.readFileSync("public/sogutma.html", "utf8");
const r =
  /<script vite-ignore src="\/(?:theme|equsto-logo|eq-i18n|eq-site-urls|nav)\.js"[^>]*>\s*<\/script>\s*/gi;
console.log("matches", (h.match(r) || []).length);
const i = h.indexOf("theme.js");
console.log(JSON.stringify(h.slice(i - 40, i + 60)));
