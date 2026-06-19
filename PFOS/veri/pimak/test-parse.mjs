import { parseTable } from "./lib/html-utils.mjs";

const url = "https://www.pimak.com/m003r-radyanli-pilic-cevirme-makinesi";
const html = await (await fetch(url)).text();
const teknikHtml = html.match(/class="tenikdetay"[\s\S]*?<\/table>/i)?.[0] || html;
const t = parseTable(teknikHtml);
console.log("rows from first table only:", t.rows.length);

// all tables in tenikdetay section
const section = html.match(/class="tenikdetay"[\s\S]*?(?=class="footer|<footer)/i)?.[0] || "";
const allTables = [...section.matchAll(/<table[\s\S]*?<\/table>/gi)];
console.log("tables in section:", allTables.length);
for (let i = 0; i < allTables.length; i++) {
  const pt = parseTable(allTables[i][0]);
  console.log(`table ${i}: rows`, pt.rows.length, "headers", pt.headers.slice(0, 3));
}
